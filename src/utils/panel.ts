import * as vscode from 'vscode';
import * as path from 'path';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiRequest, ApiResponse } from '../types';

export class NemuiPanel {
    public static current: NemuiPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private context: vscode.ExtensionContext;
    private currentRequest: ApiRequest | undefined;

    private constructor(context: vscode.ExtensionContext, request?: ApiRequest) {
        this.context = context;
        
        this.panel = vscode.window.createWebviewPanel(
            'nemui.client',
            'Nemui API Client',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'webview'))
                ]
            }
        );

        if (request) {
            this.currentRequest = request;
        }

        this.panel.webview.html = this.getHtml();
        
        this.panel.webview.onDidReceiveMessage(async (message) => {
            await this.handleMessage(message);
        });

        this.panel.onDidDispose(() => {
            NemuiPanel.current = undefined;
        });

        NemuiPanel.current = this;
    }

    public static createOrShow(context: vscode.ExtensionContext, request?: ApiRequest): NemuiPanel {
        if (NemuiPanel.current) {
            NemuiPanel.current.panel.reveal();
            if (request) {
                NemuiPanel.current.currentRequest = request;
                NemuiPanel.current.panel.webview.postMessage({
                    type: 'request',
                    payload: request
                });
            }
            return NemuiPanel.current;
        }
        
        return new NemuiPanel(context, request);
    }

    private getHtml(): string {
        const scriptUri = this.panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist', 'bundle.js'))
        );

        const styleUri = this.panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'styles', 'main.css'))
        );

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nemui API Client</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script src="${scriptUri}"></script>
</body>
</html>
        `;
    }

    private async handleMessage(message: { type: string; payload: unknown }) {
        switch (message.type) {
            case 'sendRequest':
                await this.sendHttpRequest(message.payload as ApiRequest);
                break;
            case 'getConfig':
                const config = vscode.workspace.getConfiguration('nemui');
                this.panel.webview.postMessage({
                    type: 'config',
                    payload: {
                        timeout: config.get('timeout', 30000),
                        followRedirects: config.get('followRedirects', true),
                        verifySsl: config.get('verifySsl', true)
                    }
                });
                break;
        }
    }

    public async sendRequest(): Promise<void> {
        if (this.currentRequest) {
            await this.sendHttpRequest(this.currentRequest);
        }
    }

    private async sendHttpRequest(request: ApiRequest): Promise<void> {
        const startTime = Date.now();
        
        try {
            // Build URL with query params
            let url = request.url;
            const enabledParams = request.queryParams.filter(p => p.enabled && p.key);
            if (enabledParams.length > 0) {
                const params = new URLSearchParams();
                enabledParams.forEach(p => params.append(p.key, p.value));
                url += (url.includes('?') ? '&' : '?') + params.toString();
            }

            // Build headers
            const headers: Record<string, string> = {};
            request.headers.filter(h => h.enabled && h.key).forEach(h => {
                headers[h.key] = h.value;
            });

            // Add auth
            if (request.auth) {
                switch (request.auth.type) {
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${request.auth.token}`;
                        break;
                    case 'basic':
                        const credentials = Buffer.from(
                            `${request.auth.username}:${request.auth.password}`
                        ).toString('base64');
                        headers['Authorization'] = `Basic ${credentials}`;
                        break;
                    case 'api-key':
                        if (request.auth.addTo === 'header') {
                            headers[request.auth.key || 'X-API-Key'] = request.auth.value || '';
                        }
                        break;
                }
            }

            // Build body
            let data: unknown = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
                switch (request.bodyType) {
                    case 'json':
                        try {
                            data = JSON.parse(request.body);
                            headers['Content-Type'] = 'application/json';
                        } catch {
                            data = request.body;
                        }
                        break;
                    case 'form-data':
                        // Parse form data
                        data = request.body;
                        break;
                    case 'graphql':
                        try {
                            const parsed = JSON.parse(request.body);
                            data = parsed;
                            headers['Content-Type'] = 'application/json';
                        } catch {
                            data = { query: request.body };
                        }
                        break;
                    default:
                        data = request.body;
                }
            }

            const config: AxiosRequestConfig = {
                method: request.method.toLowerCase(),
                url,
                headers,
                data,
                validateStatus: () => true, // Don't throw on any status
                maxRedirects: 0,
                timeout: vscode.workspace.getConfiguration('nemui').get('timeout', 30000)
            };

            const response = await axios(config);
            const endTime = Date.now();

            const apiResponse: ApiResponse = {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers as Record<string, string>,
                data: response.data,
                time: endTime - startTime,
                size: JSON.stringify(response.data).length
            };

            this.panel.webview.postMessage({
                type: 'response',
                payload: apiResponse
            });

        } catch (error) {
            const endTime = Date.now();
            const axiosError = error as AxiosError;
            
            this.panel.webview.postMessage({
                type: 'error',
                payload: {
                    message: axiosError.message,
                    code: axiosError.code,
                    time: endTime - startTime
                }
            });
        }
    }
}
