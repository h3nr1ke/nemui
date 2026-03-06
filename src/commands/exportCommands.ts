import * as vscode from 'vscode';
import { ApiCollection, ApiRequest, Environment } from '../types';
import { environmentManager } from './environmentManager';
import { CollectionsTreeProvider } from '../providers/collectionsTreeProvider';

export function registerExportCommands(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    
    // Export to Insomnia
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.exportInsomnia', async () => {
            await exportToInsomnia(context, collectionsProvider);
        })
    );

    // Export to Postman
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.exportPostman', async () => {
            await exportToPostman(context, collectionsProvider);
        })
    );
}

async function exportToInsomnia(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    const collections = collectionsProvider.getCollections();
    const environments = environmentManager.getEnvironments();
    
    // Build Insomnia format (v4)
    const insomniaExport = {
        "_type": "export",
        "__export_format": 4,
        "__export_date": new Date().toISOString(),
        "__export_source": "nemui",
        "resources": [
            // Environments
            ...environments.map(env => ({
                "_type": "environment",
                "_id": `env_${env.id}`,
                "name": env.name,
                "data": env.variables.reduce((acc, v) => {
                    if (v.enabled) acc[v.key] = v.value;
                    return acc;
                }, {} as Record<string, string>)
            })),
            // Collections
            ...collections.map(col => ({
                "_type": "collection",
                "_id": `col_${col.id}`,
                "name": col.name,
                "requests": col.requests.map(req => ({
                    "_id": `req_${req.id}`,
                    "parentId": `col_${col.id}`,
                    "name": req.name,
                    "url": req.url,
                    "method": req.method,
                    "body": {
                        "mimeType": getMimeType(req.bodyType),
                        "text": req.body || undefined
                    },
                    "headers": req.headers
                        .filter(h => h.enabled && h.key)
                        .map(h => ({ key: h.key, value: h.value })),
                    "parameters": req.queryParams
                        .filter(p => p.enabled && p.key)
                        .map(p => ({ key: p.key, value: p.value }))
                }))
            }))
        ]
    };

    await saveExportFile(context, insomniaExport, 'insomnia');
}

async function exportToPostman(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    const collections = collectionsProvider.getCollections();
    const environments = environmentManager.getEnvironments();
    
    // Build Postman Collection v2.1 format
    const postmanExport = {
        "info": {
            "name": "Nemui Export",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "description": "Exported from Nemui API Client"
        },
        "variable": environments.map(env => ({
            "key": env.name.toLowerCase().replace(/\s+/g, '_'),
            "value": env.variables.find(v => v.key === 'base_url')?.value || ''
        })),
        "item": collections.flatMap(col => 
            col.requests.map(req => ({
                "name": req.name,
                "request": {
                    "method": req.method,
                    "header": req.headers
                        .filter(h => h.enabled && h.key)
                        .map(h => ({ key: h.key, value: h.value })),
                    "url": {
                        "raw": req.url,
                        "host": extractHost(req.url),
                        "path": extractPath(req.url),
                        "query": req.queryParams
                            .filter(p => p.enabled && p.key)
                            .map(p => ({ key: p.key, value: p.value }))
                    },
                    "body": req.bodyType !== 'none' ? {
                        "mode": getPostmanBodyMode(req.bodyType),
                        req.bodyType: req.body ? { "raw": req.body } : undefined
                    } : undefined,
                    "auth": req.auth ? transformAuth(req.auth) : undefined
                }
            }))
        )
    };

    await saveExportFile(context, postmanExport, 'postman');
}

async function saveExportFile(context: vscode.ExtensionContext, data: unknown, type: 'insomnia' | 'postman') {
    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`export_${type}_${Date.now()}.json`),
        filters: {
            'JSON': ['json']
        }
    });

    if (uri) {
        const content = JSON.stringify(data, null, 2);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
        vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`);
    }
}

function getMimeType(bodyType: string): string {
    const types: Record<string, string> = {
        'json': 'application/json',
        'form-data': 'multipart/form-data',
        'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
        'raw': 'text/plain',
        'graphql': 'application/json'
    };
    return types[bodyType] || 'application/json';
}

function getPostmanBodyMode(bodyType: string): string {
    const modes: Record<string, string> = {
        'json': 'raw',
        'form-data': 'formdata',
        'x-www-form-urlencoded': 'urlencoded',
        'raw': 'raw',
        'graphql': 'raw'
    };
    return modes[bodyType] || 'raw';
}

function extractHost(url: string): string[] {
    try {
        const parsed = new URL(url);
        return parsed.hostname.split('.');
    } catch {
        return ['example', 'com'];
    }
}

function extractPath(url: string): string[] {
    try {
        const parsed = new URL(url);
        return parsed.pathname.split('/').filter(p => p);
    } catch {
        return ['api'];
    }
}

function transformAuth(auth: ApiRequest['auth']): { type: string; bearer?: { token: string }; basic?: { username: string; password: string } } | undefined {
    if (!auth || auth.type === 'none') return undefined;
    
    switch (auth.type) {
        case 'bearer':
            return { type: 'bearer', bearer: { token: auth.token || '' } };
        case 'basic':
            return { type: 'basic', basic: { username: auth.username || '', password: auth.password || '' } };
        case 'api-key':
            return { type: 'apikey', apikey: { key: auth.key || '', value: auth.value || '', in: auth.addTo || 'header' } };
        default:
            return undefined;
    }
}
