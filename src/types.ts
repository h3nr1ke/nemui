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

// Collection types
export interface ApiCollection {
    id: string;
    name: string;
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

// Webview message types
export interface WebviewToExtensionMessage {
    type: 'request' | 'updateRequest' | 'getCollections' | 'saveRequest';
    payload: unknown;
}

export interface ExtensionToWebviewMessage {
    type: 'response' | 'collections' | 'request' | 'error';
    payload: unknown;
}

// Tree view types
export interface CollectionTreeItem extends vscode.TreeItem {
    id: string;
    type: 'collection' | 'request' | 'folder';
    request?: ApiRequest;
}

import * as vscode from 'vscode';
