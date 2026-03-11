// API Request types
export interface ApiRequest {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers: KeyValuePair[];
    queryParams: KeyValuePair[];
    body: string;
    bodyType: BodyType;
    collectionId: string;
    auth?: AuthConfig;
    preRequestScript?: string;
    postResponseScript?: string;
}

export interface KeyValuePair {
    key: string;
    value: string;
    enabled: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type BodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'graphql';

export interface AuthConfig {
    type: 'none' | 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    addTo?: 'header' | 'query';
}

// Project types
export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
}

// Collection types
export interface ApiCollection {
    id: string;
    name: string;
    projectId: string;
    requests: ApiRequest[];
    folders: Folder[];
}

export interface Folder {
    id: string;
    name: string;
    requests: ApiRequest[];
}

// Environment types
export interface Environment {
    id: string;
    name: string;
    variables: KeyValuePair[];
}

export interface Environments {
    [key: string]: Environment;
}

// Response types
export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    time: number;
    size: number;
}

// Platform detection
export type Platform = 'vscode' | 'standalone';

export interface NemuiConfig {
    platform: Platform;
    timeout: number;
    followRedirects: boolean;
    verifySsl: boolean;
}

// Default config
export const defaultConfig: NemuiConfig = {
    platform: 'standalone',
    timeout: 30000,
    followRedirects: true,
    verifySsl: true
};
