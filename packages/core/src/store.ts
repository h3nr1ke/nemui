import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiRequest, ApiResponse, Environment, NemuiConfig, Platform, Project, ApiCollection } from './types';

// Default request
const defaultRequest: ApiRequest = {
    id: '',
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '', enabled: true }],
    queryParams: [{ key: '', value: '', enabled: true }],
    body: '',
    bodyType: 'none',
    collectionId: '',
    auth: { type: 'none' }
};

// Platform abstraction
let platformApi: {
    platform: Platform;
    sendRequest: (request: ApiRequest) => Promise<ApiResponse>;
    showMessage: (message: string, type?: 'info' | 'error' | 'warning') => void;
    getConfig: () => Promise<NemuiConfig>;
} | null = null;

export function setPlatformApi(api: typeof platformApi) {
    platformApi = api;
}

export function getPlatformApi() {
    return platformApi;
}

// Main store with persistence
interface AppState {
    // Request/Response
    request: ApiRequest;
    response: ApiResponse | null;
    isLoading: boolean;
    error: unknown;
    
    // Projects
    projects: Project[];
    activeProjectId: string | null;
    
    // Collections (filtered by active project)
    collections: ApiCollection[];
    
    // Environments
    environments: Environment[];
    activeEnvironmentId: string | null;
    
    // Runtime variables
    runtimeVariables: Record<string, string>;
    
    // Config
    config: NemuiConfig;
    
    // Actions
    setRequest: (request: ApiRequest) => void;
    setResponse: (response: ApiResponse) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: unknown) => void;
    updateRequest: (updates: Partial<ApiRequest>) => void;
    
    // Projects
    setProjects: (projects: Project[]) => void;
    addProject: (project: Project) => void;
    updateProject: (project: Project) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;
    
    // Collections
    setCollections: (collections: ApiCollection[]) => void;
    addCollection: (collection: ApiCollection) => void;
    updateCollection: (collection: ApiCollection) => void;
    deleteCollection: (id: string) => void;
    
    // Environments
    setEnvironments: (environments: Environment[]) => void;
    addEnvironment: (env: Environment) => void;
    updateEnvironment: (env: Environment) => void;
    deleteEnvironment: (id: string) => void;
    setActiveEnvironment: (id: string | null) => void;
    
    // Runtime variables
    setRuntimeVariables: (vars: Record<string, string>) => void;
    setRuntimeVariable: (key: string, value: string) => void;
    clearRuntimeVariables: () => void;
    
    // Config
    setConfig: (config: Partial<NemuiConfig>) => void;
    
    // Helpers
    resolveVariables: (text: string) => string;
    getFilteredCollections: () => ApiCollection[];
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            request: defaultRequest,
            response: null,
            isLoading: false,
            error: null,
            projects: [],
            activeProjectId: null,
            collections: [],
            environments: [],
            activeEnvironmentId: null,
            runtimeVariables: {},
            config: {
                platform: 'standalone',
                timeout: 30000,
                followRedirects: true,
                verifySsl: true
            },

            // Request actions
            setRequest: (request) => set({ request }),
            setResponse: (response) => set({ response }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            updateRequest: (updates) => set((state) => ({
                request: { ...state.request, ...updates }
            })),

            // Projects actions
            setProjects: (projects) => set({ projects }),
            addProject: (project) => set((state) => ({
                projects: [...state.projects, project]
            })),
            updateProject: (project) => set((state) => ({
                projects: state.projects.map(p => 
                    p.id === project.id ? project : p
                )
            })),
            deleteProject: (id) => set((state) => {
                // Also delete all collections in this project
                const collections = state.collections.filter(c => c.projectId !== id);
                return {
                    projects: state.projects.filter(p => p.id !== id),
                    activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
                    collections
                };
            }),
            setActiveProject: (id) => set({ 
                activeProjectId: id,
                // Clear request when switching projects
                request: defaultRequest
            }),

            // Collections actions
            setCollections: (collections) => set({ collections }),
            addCollection: (collection) => set((state) => ({
                collections: [...state.collections, collection]
            })),
            updateCollection: (collection) => set((state) => ({
                collections: state.collections.map(c => 
                    c.id === collection.id ? collection : c
                )
            })),
            deleteCollection: (id) => set((state) => ({
                collections: state.collections.filter(c => c.id !== id)
            })),

            // Environments actions
            setEnvironments: (environments) => set({ environments }),
            addEnvironment: (env) => set((state) => ({
                environments: [...state.environments, env]
            })),
            updateEnvironment: (env) => set((state) => ({
                environments: state.environments.map(e => 
                    e.id === env.id ? env : e
                )
            })),
            deleteEnvironment: (id) => set((state) => ({
                environments: state.environments.filter(e => e.id !== id),
                activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId
            })),
            setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

            // Runtime variables actions
            setRuntimeVariables: (vars) => set({ runtimeVariables: vars }),
            setRuntimeVariable: (key, value) => set((state) => ({
                runtimeVariables: { ...state.runtimeVariables, [key]: value }
            })),
            clearRuntimeVariables: () => set({ runtimeVariables: {} }),

            // Config actions
            setConfig: (config) => set((state) => ({
                config: { ...state.config, ...config }
            })),

            // Helper: resolve variables
            resolveVariables: (text) => {
                const state = get();
                const { environments, activeEnvironmentId, runtimeVariables } = state;
                
                let resolved = text;
                
                // Replace {{variable}} with environment or runtime variables
                const pattern = /\{\{([^}]+)\}\}/g;
                resolved = resolved.replace(pattern, (match, varName) => {
                    // First check runtime variables (from scripts)
                    if (runtimeVariables[varName]) {
                        return runtimeVariables[varName];
                    }
                    
                    // Then check environment variables
                    if (activeEnvironmentId) {
                        const env = environments.find(e => e.id === activeEnvironmentId);
                        if (env) {
                            const variable = env.variables.find(v => v.key === varName && v.enabled);
                            if (variable) return variable.value;
                        }
                    }
                    
                    return match;
                });
                
                return resolved;
            },

            // Get collections filtered by active project
            getFilteredCollections: () => {
                const state = get();
                if (!state.activeProjectId) {
                    return state.collections;
                }
                return state.collections.filter(c => c.projectId === state.activeProjectId);
            }
        }),
        {
            name: 'nemui-storage',
            partialize: (state) => ({
                projects: state.projects,
                activeProjectId: state.activeProjectId,
                collections: state.collections,
                environments: state.environments,
                activeEnvironmentId: state.activeEnvironmentId,
                config: state.config
            })
        }
    )
);
