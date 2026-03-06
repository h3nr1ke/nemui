import * as vscode from 'vscode';
import { ApiCollection, ApiRequest, ApiCollection as CollectionType } from '../types';
import { environmentManager } from './environmentManager';
import { CollectionsTreeProvider } from '../providers/collectionsTreeProvider';

// Types for Insomnia format
interface InsomniaResource {
    _type: string;
    _id?: string;
    name?: string;
    requests?: InsomniaRequest[];
    data?: Record<string, string>;
}

interface InsomniaRequest {
    _id?: string;
    parentId?: string;
    name?: string;
    url?: string;
    method?: string;
    body?: {
        mimeType?: string;
        text?: string;
    };
    headers?: { key: string; value: string }[];
    parameters?: { key: string; value: string }[];
}

// Types for Postman format
interface PostmanCollection {
    info?: {
        name?: string;
    };
    item?: PostmanItem[];
    variable?: { key: string; value: string }[];
}

interface PostmanItem {
    name?: string;
    request?: {
        method?: string;
        header?: { key: string; value: string }[];
        url?: string | PostmanUrl;
        body?: {
            mode?: string;
            raw?: string;
            graphql?: { query: string };
        };
        auth?: PostmanAuth;
    };
}

interface PostmanUrl {
    raw?: string;
    host?: string[];
    path?: string[];
    query?: { key: string; value: string }[];
}

interface PostmanAuth {
    type?: string;
    bearer?: { token: string };
    basic?: { username: string; password: string };
    apikey?: { key: string; value: string; in: string };
}

export function registerImportCommands(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    
    // Import from Insomnia
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.importInsomnia', async () => {
            await importFromInsomnia(context, collectionsProvider);
        })
    );

    // Import from Postman
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.importPostman', async () => {
            await importFromPostman(context, collectionsProvider);
        })
    );
}

async function importFromInsomnia(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    const uri = await vscode.window.showOpenDialog({
        filters: { 'JSON': ['json'] },
        canSelectMany: false
    });

    if (!uri || uri.length === 0) return;

    try {
        const data = await vscode.workspace.fs.readFile(uri[0]);
        const json = JSON.parse(data.toString()) as InsomniaResource[];
        
        let collectionsCreated = 0;
        let requestsImported = 0;

        for (const resource of json) {
            if (resource._type === 'environment' && resource.name && resource.data) {
                const env = {
                    id: generateId(),
                    name: resource.name,
                    variables: Object.entries(resource.data).map(([key, value]) => ({
                        key,
                        value,
                        enabled: true
                    }))
                };
                environmentManager.addEnvironment(env);
                continue;
            }

            if (resource._type === 'collection' && resource.name && resource.requests) {
                const collection: ApiCollection = {
                    id: generateId(),
                    name: resource.name,
                    requests: [],
                    folders: []
                };

                for (const req of resource.requests) {
                    const request = convertInsomniaRequest(req, collection.id);
                    collection.requests.push(request);
                    requestsImported++;
                }

                collectionsProvider.addCollection(collection);
                collectionsCreated++;
            }
        }

        vscode.window.showInformationMessage(
            `Imported ${collectionsCreated} collections and ${requestsImported} requests from Insomnia!`
        );

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to import: ${error}`);
    }
}

async function importFromPostman(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    const uri = await vscode.window.showOpenDialog({
        filters: { 'JSON': ['json'] },
        canSelectMany: false
    });

    if (!uri || uri.length === 0) return;

    try {
        const data = await vscode.workspace.fs.readFile(uri[0]);
        const json = JSON.parse(data.toString()) as PostmanCollection;
        
        // Handle both single collection and array of collections
        const collections = Array.isArray(json) ? json : [json];
        
        let collectionsCreated = 0;
        let requestsImported = 0;

        for (const collection of collections) {
            if (!collection.info?.name) continue;

            const newCollection: ApiCollection = {
                id: generateId(),
                name: collection.info.name,
                requests: [],
                folders: []
            };

            // Import environment variables if present
            if (collection.variable && collection.variable.length > 0) {
                const env = {
                    id: generateId(),
                    name: `${collection.info.name} Environment`,
                    variables: collection.variable.map(v => ({
                        key: v.key,
                        value: v.value,
                        enabled: true
                    }))
                };
                environmentManager.addEnvironment(env);
            }

            // Import items (requests)
            if (collection.item) {
                for (const item of collection.item) {
                    const request = convertPostmanRequest(item, newCollection.id);
                    if (request) {
                        newCollection.requests.push(request);
                        requestsImported++;
                    }
                }
            }

            collectionsProvider.addCollection(newCollection);
            collectionsCreated++;
        }

        vscode.window.showInformationMessage(
            `Imported ${collectionsCreated} collections and ${requestsImported} requests from Postman!`
        );

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to import: ${error}`);
    }
}

function convertInsomniaRequest(req: InsomniaRequest, collectionId: string): ApiRequest {
    let bodyType: string = 'none';
    let body = '';

    if (req.body?.mimeType) {
        if (req.body.mimeType.includes('json')) {
            bodyType = 'json';
            body = req.body.text || '';
        } else if (req.body.mimeType.includes('form-urlencoded')) {
            bodyType = 'x-www-form-urlencoded';
            body = req.body.text || '';
        } else if (req.body.mimeType.includes('graphql')) {
            bodyType = 'graphql';
            body = req.body.text || '';
        } else {
            bodyType = 'raw';
            body = req.body.text || '';
        }
    }

    return {
        id: generateId(),
        name: req.name || 'Imported Request',
        method: (req.method?.toUpperCase() as ApiRequest['method']) || 'GET',
        url: req.url || '',
        headers: req.headers?.map(h => ({ key: h.key, value: h.value, enabled: true })) || [],
        queryParams: req.parameters?.map(p => ({ key: p.key, value: p.value, enabled: true })) || [],
        body,
        bodyType,
        collectionId
    };
}

function convertPostmanRequest(item: PostmanItem, collectionId: string): ApiRequest | null {
    if (!item.request) return null;

    const req = item.request;
    
    // Extract URL
    let url = '';
    if (typeof req.url === 'string') {
        url = req.url;
    } else if (req.url?.raw) {
        url = req.url.raw;
    }

    // Extract body
    let bodyType: string = 'none';
    let body = '';

    if (req.body) {
        if (req.body.graphql) {
            bodyType = 'graphql';
            body = JSON.stringify(req.body.graphql);
        } else if (req.body.raw) {
            bodyType = 'json'; // Assume JSON for raw body
            body = req.body.raw;
        }
    }

    // Extract query params from URL
    let queryParams: { key: string; value: string; enabled: boolean }[] = [];
    if (req.url && typeof req.url !== 'string' && req.url.query) {
        queryParams = req.url.query.map(q => ({
            key: q.key,
            value: q.value,
            enabled: true
        }));
    }

    // Extract auth
    let auth: ApiRequest['auth'];
    if (req.auth) {
        if (req.auth.type === 'bearer' && req.auth.bearer) {
            auth = {
                type: 'bearer',
                token: req.auth.bearer.token
            };
        } else if (req.auth.type === 'basic' && req.auth.basic) {
            auth = {
                type: 'basic',
                username: req.auth.basic.username,
                password: req.auth.basic.password
            };
        } else if (req.auth.type === 'apikey' && req.auth.apikey) {
            auth = {
                type: 'api-key',
                key: req.auth.apikey.key,
                value: req.auth.apikey.value,
                addTo: req.auth.apikey.in as 'header' | 'query'
            };
        }
    }

    return {
        id: generateId(),
        name: item.name || 'Imported Request',
        method: (req.method?.toUpperCase() as ApiRequest['method']) || 'GET',
        url,
        headers: req.header?.map(h => ({ key: h.key, value: h.value, enabled: true })) || [],
        queryParams,
        body,
        bodyType,
        collectionId,
        auth
    };
}

function generateId(): string {
    return `nemui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
