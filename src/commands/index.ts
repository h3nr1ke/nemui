import * as vscode from 'vscode';
import { NemuiPanel } from '../utils/panel';
import { CollectionsTreeProvider } from '../providers/collectionsTreeProvider';
import { ApiRequest, ApiCollection, Environment } from '../types';
import { environmentManager } from '../utils/environmentManager';

export function registerCommands(context: vscode.ExtensionContext, collectionsProvider: CollectionsTreeProvider) {
    
    // Open API Client
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.openClient', () => {
            NemuiPanel.createOrShow(context);
        })
    );

    // New Collection
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.newCollection', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Collection name',
                placeHolder: 'My API Collection'
            });
            
            if (name) {
                const collection: ApiCollection = {
                    id: Date.now().toString(),
                    name,
                    requests: [],
                    folders: []
                };
                
                collectionsProvider.addCollection(collection);
                vscode.window.showInformationMessage(`Collection "${name}" created!`);
            }
        })
    );

    // New Request
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.newRequest', async (collectionId?: string) => {
            if (!collectionId) {
                vscode.window.showWarningMessage('Select a collection first');
                return;
            }

            const name = await vscode.window.showInputBox({
                prompt: 'Request name',
                placeHolder: 'My Request'
            });

            if (name) {
                const request: ApiRequest = {
                    id: Date.now().toString(),
                    name,
                    method: 'GET',
                    url: '',
                    headers: [],
                    queryParams: [],
                    body: '',
                    bodyType: 'none',
                    collectionId
                };

                collectionsProvider.addRequest(collectionId, request);
                NemuiPanel.createOrShow(context, request);
            }
        })
    );

    // Send Request
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.sendRequest', async () => {
            const panel = NemuiPanel.current;
            if (panel) {
                panel.sendRequest();
            } else {
                vscode.window.showWarningMessage('Open the API Client first');
            }
        })
    );

    // Open Request in Client
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.openRequest', (request: ApiRequest) => {
            NemuiPanel.createOrShow(context, request);
        })
    );

    // ===== Environment Commands =====

    // New Environment
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.newEnvironment', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Environment name',
                placeHolder: 'Development'
            });
            
            if (name) {
                const env: Environment = {
                    id: Date.now().toString(),
                    name,
                    variables: [
                        { key: 'base_url', value: '', enabled: true },
                        { key: 'api_key', value: '', enabled: false }
                    ]
                };
                
                environmentManager.addEnvironment(env);
                vscode.window.showInformationMessage(`Environment "${name}" created!`);
                
                // Notify webview if open
                if (NemuiPanel.current) {
                    NemuiPanel.current.panel.webview.postMessage({
                        type: 'environments',
                        payload: environmentManager.getEnvironments()
                    });
                }
            }
        })
    );

    // Manage Environment Variables
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.manageEnvironment', async () => {
            const envs = environmentManager.getEnvironments();
            
            if (envs.length === 0) {
                vscode.window.showInformationMessage('No environments. Create one first with "New Environment"');
                return;
            }

            const selected = await vscode.window.showQuickPick(
                envs.map(e => e.name),
                { placeHolder: 'Select environment to manage' }
            );

            if (selected) {
                const env = envs.find(e => e.name === selected);
                if (env) {
                    // Show environment details
                    const variablesText = env.variables
                        .map(v => `${v.enabled ? '☑' : '☐'} ${v.key}: ${v.value}`)
                        .join('\n');
                    
                    vscode.window.showInformationMessage(
                        `Environment: ${env.name}\n\nVariables:\n${variablesText}\n\nUse {{variable_name}} in your requests`
                    );
                }
            }
        })
    );

    // Switch Environment
    context.subscriptions.push(
        vscode.commands.registerCommand('nemui.switchEnvironment', async () => {
            const envs = environmentManager.getEnvironments();
            
            const items: vscode.QuickPickItem[] = [
                { label: 'None', description: 'No environment' },
                ...envs.map(e => ({ label: e.name, description: `${e.variables.length} variables` }))
            ];

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select environment'
            });

            if (selected) {
                if (selected.label === 'None') {
                    environmentManager.setActiveEnvironment(null);
                    vscode.window.showInformationMessage('Environment disabled');
                } else {
                    const env = envs.find(e => e.name === selected.label);
                    if (env) {
                        environmentManager.setActiveEnvironment(env.id);
                        vscode.window.showInformationMessage(`Active environment: ${env.name}`);
                    }
                }

                // Notify webview
                if (NemuiPanel.current) {
                    NemuiPanel.current.panel.webview.postMessage({
                        type: 'activeEnvironment',
                        payload: environmentManager.getActiveEnvironmentId()
                    });
                }
            }
        })
    );
}
