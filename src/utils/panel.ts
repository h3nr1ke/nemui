import * as vscode from 'vscode';
import * as path from 'path';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiRequest, ApiResponse } from '../types';
import { environmentManager } from './environmentManager';

export class NemuiPanel {
    public static current: NemuiPanel | undefined;
    public readonly panel: vscode.WebviewPanel;
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

        // Send initial environment data
        this.sendEnvironmentData();
    }

    private sendEnvironmentData() {
        this.panel.webview.postMessage({
            type: 'environments',
            payload: environmentManager.getEnvironments()
        });
        
        this.panel.webview.postMessage({
            type: 'activeEnvironment',
            payload: environmentManager.getActiveEnvironmentId()
        });

        this.panel.webview.postMessage({
            type: 'runtimeVariables',
            payload: environmentManager.getRuntimeVariables()
        });
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
            case 'getEnvironments':
                this.sendEnvironmentData();
                break;
            case 'setActiveEnvironment':
                environmentManager.setActiveEnvironment(message.payload as string | null);
                this.sendEnvironmentData();
                break;
            case 'setVariable':
                const { key, value, persistent } = message.payload as { key: string; value: string; persistent?: boolean };
                environmentManager.setRuntimeVariable(key, value);
                
                if (persistent) {
                    environmentManager.addVariableToEnvironment(key, value);
                }
                
                this.panel.webview.postMessage({
                    type: 'runtimeVariables',
                    payload: environmentManager.getRuntimeVariables()
                });
                break;
            case 'getRuntimeVariables':
                this.panel.webview.postMessage({
                    type: 'runtimeVariables',
                    payload: environmentManager.getRuntimeVariables()
                });
                break;
        }
    }

    public async sendRequest(): Promise<void> {
        if (this.currentRequest) {
            await this.sendHttpRequest(this.currentRequest);
        }
    }

    private resolveVariables(text: string): string {
        return environmentManager.resolveVariables(text);
    }

    private executePreRequestScript(script: string): void {
        if (!script) return;
        
        try {
            // Create a safe sandbox for the script
            const context = {
                variables: environmentManager.getRuntimeVariables(),
                setVariable: (key: string, value: string) => {
                    environmentManager.setRuntimeVariable(key, value);
                }
            };
            
            // Execute the script
            new Function('variables', 'setVariable', script)(context.variables, context.setVariable);
        } catch (error) {
            vscode.window.showWarningMessage(`Pre-request script error: ${error}`);
        }
    }

    private executePostResponseScript(script: string, response: ApiResponse): void {
        if (!script) return;
        
        try {
            const context = {
                response: {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data,
                    time: response.time,
                    json: typeof response.data === 'object' ? response.data : JSON.parse(String(response.data))
                },
                variables: environmentManager.getRuntimeVariables(),
                setVariable: (key: string, value: string) => {
                    environmentManager.setRuntimeVariable(key, value);
                },
                setPersistentVariable: (key: string, value: string) => {
                    environmentManager.setRuntimeVariable(key, value);
                    environmentManager.addVariableToEnvironment(key, value);
                }
            };
            
            // Execute the script
            new Function(
                'response', 
                'variables', 
                'setVariable', 
                'setPersistentVariable', 
                script
            )(context.response, context.variables, context.setVariable, context.setPersistentVariable);
            
            // Send updated runtime variables to webview
            this.panel.webview.postMessage({
                type: 'runtimeVariables',
                payload: environmentManager.getRuntimeVariables()
            });
        } catch (error) {
            vscode.window.showWarningMessage(`Post-response script error: ${error}`);
        }
    }

    private async sendHttpRequest(request: ApiRequest): Promise<void> {
        const startTime = Date.now();
        
        try {
            // Execute pre-request script
            if (request.preRequestScript) {
                this.executePreRequestScript(request.preRequestScript);
            }
            
            // Resolve variables in URL
            let url = this.resolveVariables(request.url);
            
            // Build URL with query params
            const enabledParams = request.queryParams.filter(p => p.enabled && p.key);
            const resolvedParams = enabledParams.map(p => ({
                ...p,
                key: this.resolveVariables(p.key),
                value: this.resolveVariables(p.value)
            }));
            
            if (resolvedParams.length > 0) {
                const params = new URLSearchParams();
                resolvedParams.forEach(p => params.append(p.key, p.value));
                url += (url.includes('?') ? '&' : '?') + params.toString();
            }

            // Build headers
            const headers: Record<string, string> = {};
            request.headers.filter(h => h.enabled && h.key).forEach(h => {
                headers[this.resolveVariables(h.key)] = this.resolveVariables(h.value);
            });

            // Add auth
            if (request.auth) {
                switch (request.auth.type) {
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${this.resolveVariables(request.auth.token || '')}`;
                        break;
                    case 'basic':
                        const credentials = Buffer.from(
                            `${this.resolveVariables(request.auth.username || '')}:${this.resolveVariables(request.auth.password || '')}`
                        ).toString('base64');
                        headers['Authorization'] = `Basic ${credentials}`;
                        break;
                    case 'api-key':
                        if (request.auth.addTo === 'header') {
                            headers[request.auth.key || 'X-API-Key'] = this.resolveVariables(request.auth.value || '');
                        }
                        break;
                }
            }

            // Build body
            let data: unknown = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
                const resolvedBody = this.resolveVariables(request.body);
                
                switch (request.bodyType) {
                    case 'json':
                        try {
                            data = JSON.parse(resolvedBody);
                            headers['Content-Type'] = 'application/json';
                        } catch {
                            data = resolvedBody;
                        }
                        break;
                    case 'form-data':
                        data = resolvedBody;
                        break;
                    case 'graphql':
                        try {
                            const parsed = JSON.parse(resolvedBody);
                            data = parsed;
                            headers['Content-Type'] = 'application/json';
                        } catch {
                            data = { query: resolvedBody };
                        }
                        break;
                    default:
                        data = resolvedBody;
                }
            }

            const config: AxiosRequestConfig = {
                method: request.method.toLowerCase(),
                url,
                headers,
                data,
                validateStatus: () => true,
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

            // Execute post-response script
            if (request.postResponseScript) {
                this.executePostResponseScript(request.postResponseScript, apiResponse);
            }

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
