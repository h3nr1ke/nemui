import * as vscode from 'vscode';
import { NemuiPanel } from '../utils/panel';
import { CollectionsTreeProvider } from '../providers/collectionsTreeProvider';
import { ApiRequest, ApiCollection } from '../types';

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
}
