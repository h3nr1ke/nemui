import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { registerExportCommands } from './commands/exportCommands';
import { registerImportCommands } from './commands/importCommands';
import { CollectionsTreeProvider } from './providers/collectionsTreeProvider';
import { NemuiPanel } from './utils/panel';

export function activate(context: vscode.ExtensionContext) {
    // Register tree view provider
    const collectionsProvider = new CollectionsTreeProvider();
    vscode.window.registerTreeDataProvider('project-nemui.collections', collectionsProvider);

    // Register commands
    registerCommands(context, collectionsProvider);
    registerExportCommands(context, collectionsProvider);
    registerImportCommands(context, collectionsProvider);

    // Add panel to subscriptions
    context.subscriptions.push(NemuiPanel(context));

    console.log('Nemui API Client activated!');
}

export function deactivate() {
    console.log('Nemui API Client deactivated!');
}
