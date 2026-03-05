import * as vscode from 'vscode';
import { ApiCollection, ApiRequest } from '../types';

export class CollectionsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private collections: ApiCollection[] = [];
    private storagePath: string | undefined;

    constructor() {
        this.loadFromStorage();
    }

    private async loadFromStorage() {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspacePath) {
            this.storagePath = vscode.Uri.joinPath(
                vscode.Uri.file(workspacePath),
                '.nemui',
                'collections.json'
            ).fsPath;
            
            try {
                const data = await vscode.workspace.fs.readFile(
                    vscode.Uri.file(this.storagePath)
                );
                this.collections = JSON.parse(data.toString());
                this._onDidChangeTreeData.fire();
            } catch {
                // File doesn't exist yet, start empty
                this.collections = [];
            }
        }
    }

    private async saveToStorage() {
        if (this.storagePath) {
            const dir = vscode.Uri.joinPath(
                vscode.Uri.file(this.storagePath),
                '..'
            );
            
            try {
                await vscode.workspace.fs.createDirectory(dir);
            } catch {
                // Directory might already exist
            }
            
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(this.storagePath),
                Buffer.from(JSON.stringify(this.collections, null, 2))
            );
        }
    }

    addCollection(collection: ApiCollection) {
        this.collections.push(collection);
        this.saveToStorage();
        this._onDidChangeTreeData.fire();
    }

    addRequest(collectionId: string, request: ApiRequest) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (collection) {
            collection.requests.push(request);
            this.saveToStorage();
            this._onDidChangeTreeData.fire();
        }
    }

    getCollections(): ApiCollection[] {
        return this.collections;
    }

    getRequest(id: string): ApiRequest | undefined {
        for (const collection of this.collections) {
            const found = collection.requests.find(r => r.id === id);
            if (found) return found;
        }
        return undefined;
    }

    updateRequest(request: ApiRequest) {
        for (const collection of this.collections) {
            const index = collection.requests.findIndex(r => r.id === request.id);
            if (index !== -1) {
                collection.requests[index] = request;
                this.saveToStorage();
                this._onDidChangeTreeData.fire();
                return;
            }
        }
    }

    deleteRequest(id: string) {
        for (const collection of this.collections) {
            const index = collection.requests.findIndex(r => r.id === id);
            if (index !== -1) {
                collection.requests.splice(index, 1);
                this.saveToStorage();
                this._onDidChangeTreeData.fire();
                return;
            }
        }
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
        if (!element) {
            // Root: return collections
            return this.collections.map(col => {
                const item = new vscode.TreeItem(
                    col.name,
                    vscode.TreeItemCollapsibleState.Expanded
                );
                item.contextValue = 'collection';
                item.id = col.id;
                item.iconPath = new vscode.ThemeIcon('files');
                return item;
            });
        }

        if (element.contextValue === 'collection') {
            const collection = this.collections.find(c => c.id === element.id);
            if (collection) {
                return collection.requests.map(req => {
                    const item = new vscode.TreeItem(
                        req.name,
                        vscode.TreeItemCollapsibleState.None
                    );
                    item.contextValue = 'request';
                    item.id = req.id;
                    
                    // Color based on method
                    const colors: Record<string, string> = {
                        'GET': 'green',
                        'POST': 'blue',
                        'PUT': 'orange',
                        'PATCH': 'yellow',
                        'DELETE': 'red'
                    };
                    item.iconPath = new vscode.ThemeIcon(
                        'symbol-method',
                        new vscode.ThemeColor(`testing.iconRan-${colors[req.method] || 'green'}`)
                    );
                    
                    return item;
                });
            }
        }

        return [];
    }
}
