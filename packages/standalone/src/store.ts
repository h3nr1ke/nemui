import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiRequest, ApiResponse, Environment, NemuiConfig, ApiCollection } from './types';

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
    platform: string;
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
    request: ApiRequest;
    response: ApiResponse | null;
    isLoading: boolean;
    error: unknown;
    collections: ApiCollection[];
    environments: Environment[];
    activeEnvironmentId: string | null;
    runtimeVariables: Record<string, string>;
    config: NemuiConfig;
    setRequest: (request: ApiRequest) => void;
    setResponse: (response: ApiResponse) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: unknown) => void;
    updateRequest: (updates: Partial<ApiRequest>) => void;
    setCollections: (collections: ApiCollection[]) => void;
    addCollection: (collection: ApiCollection) => void;
    updateCollection: (collection: ApiCollection) => void;
    deleteCollection: (id: string) => void;
    setEnvironments: (environments: Environment[]) => void;
    addEnvironment: (env: Environment) => void;
    updateEnvironment: (env: Environment) => void;
    deleteEnvironment: (id: string) => void;
    setActiveEnvironment: (id: string | null) => void;
    setRuntimeVariables: (vars: Record<string, string>) => void;
    setRuntimeVariable: (key: string, value: string) => void;
    clearRuntimeVariables: () => void;
    setConfig: (config: Partial<NemuiConfig>) => void;
    resolveVariables: (text: string) => string;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            request: defaultRequest,
            response: null,
            isLoading: false,
            error: null,
            collections: [],
            environments: [],
            activeEnvironmentId: null,
            runtimeVariables: {},
            config: { platform: 'standalone', timeout: 30000, followRedirects: true, verifySsl: true },
            setRequest: (request) => set({ request }),
            setResponse: (response) => set({ response }),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            updateRequest: (updates) => set((state) => ({ request: { ...state.request, ...updates } })),
            setCollections: (collections) => set({ collections }),
            addCollection: (collection) => set((state) => ({ collections: [...state.collections, collection] })),
            updateCollection: (collection) => set((state) => ({ collections: state.collections.map(c => c.id === collection.id ? collection : c) })),
            deleteCollection: (id) => set((state) => ({ collections: state.collections.filter(c => c.id !== id) })),
            setEnvironments: (environments) => set({ environments }),
            addEnvironment: (env) => set((state) => ({ environments: [...state.environments, env] })),
            updateEnvironment: (env) => set((state) => ({ environments: state.environments.map(e => e.id === env.id ? env : e) })),
            deleteEnvironment: (id) => set((state) => ({ environments: state.environments.filter(e => e.id !== id), activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId })),
            setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),
            setRuntimeVariables: (vars) => set({ runtimeVariables: vars }),
            setRuntimeVariable: (key, value) => set((state) => ({ runtimeVariables: { ...state.runtimeVariables, [key]: value } })),
            clearRuntimeVariables: () => set({ runtimeVariables: {} }),
            setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
            resolveVariables: (text) => {
                const state = get();
                const { environments, activeEnvironmentId, runtimeVariables } = state;
                let resolved = text;
                const pattern = /\{\{([^}]+)\}\}/g;
                resolved = resolved.replace(pattern, (match, varName) => {
                    if (runtimeVariables[varName]) return runtimeVariables[varName];
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
            }
        }),
        { name: 'nemui-storage', partialize: (state) => ({ collections: state.collections, environments: state.environments, activeEnvironmentId: state.activeEnvironmentId, config: state.config }) }
    )
);
