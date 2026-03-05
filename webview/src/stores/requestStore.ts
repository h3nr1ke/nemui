import { create } from 'zustand';

interface ApiRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  queryParams: { key: string; value: string; enabled: boolean }[];
  body: string;
  bodyType: string;
  collectionId: string;
  auth?: {
    type: string;
    token?: string;
    username?: string;
    password?: string;
  };
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

interface RequestState {
  request: ApiRequest;
  response: ApiResponse | null;
  isLoading: boolean;
  error: unknown;
  
  setRequest: (request: ApiRequest) => void;
  setResponse: (response: ApiResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: unknown) => void;
  updateRequest: (updates: Partial<ApiRequest>) => void;
}

const defaultRequest: ApiRequest = {
  id: '',
  name: 'New Request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  queryParams: [{ key: '', value: '', enabled: true }],
  body: '',
  bodyType: 'none',
  collectionId: ''
};

export const useRequestStore = create<RequestState>((set) => ({
  request: defaultRequest,
  response: null,
  isLoading: false,
  error: null,

  setRequest: (request) => set({ request }),
  
  setResponse: (response) => set({ response }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  updateRequest: (updates) => set((state) => ({
    request: { ...state.request, ...updates }
  }))
}));
