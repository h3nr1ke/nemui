import * as vscode from 'vscode';
import { Environment, Environments } from '../types';

const ENV_FILE = '.nemui/environments.json';

export class EnvironmentManager {
    private environments: Environments = {};
    private activeEnvironment: string | null = null;
    private workspacePath: string | undefined;

    constructor() {
        this.loadFromStorage();
    }

    private async loadFromStorage() {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspacePath) return;

        this.workspacePath = workspacePath;
        
        try {
            const envUri = vscode.Uri.joinPath(
                vscode.Uri.file(workspacePath),
                ENV_FILE
            );
            const data = await vscode.workspace.fs.readFile(envUri);
            const parsed = JSON.parse(data.toString());
            this.environments = parsed.environments || {};
            this.activeEnvironment = parsed.activeEnvironment || null;
        } catch {
            this.environments = {};
        }
    }

    private async saveToStorage() {
        if (!this.workspacePath) return;

        const dirUri = vscode.Uri.joinPath(
            vscode.Uri.file(this.workspacePath),
            '.nemui'
        );

        try {
            await vscode.workspace.fs.createDirectory(dirUri);
        } catch {}

        const envUri = vscode.Uri.joinPath(
            vscode.Uri.file(this.workspacePath),
            ENV_FILE
        );

        await vscode.workspace.fs.writeFile(
            envUri,
            Buffer.from(JSON.stringify({
                environments: this.environments,
                activeEnvironment: this.activeEnvironment
            }, null, 2))
        );
    }

    getEnvironments(): Environment[] {
        return Object.values(this.environments);
    }

    getEnvironment(id: string): Environment | undefined {
        return this.environments[id];
    }

    getActiveEnvironment(): Environment | undefined {
        if (!this.activeEnvironment) return undefined;
        return this.environments[this.activeEnvironment];
    }

    getActiveEnvironmentId(): string | null {
        return this.activeEnvironment;
    }

    setActiveEnvironment(id: string | null) {
        this.activeEnvironment = id;
        this.saveToStorage();
    }

    addEnvironment(env: Environment) {
        this.environments[env.id] = env;
        this.saveToStorage();
    }

    updateEnvironment(env: Environment) {
        this.environments[env.id] = env;
        this.saveToStorage();
    }

    deleteEnvironment(id: string) {
        delete this.environments[id];
        if (this.activeEnvironment === id) {
            this.activeEnvironment = null;
        }
        this.saveToStorage();
    }

    resolveVariables(text: string): string {
        const env = this.getActiveEnvironment();
        if (!env) return text;

        let resolved = text;
        
        // Replace {{variable}} with environment variables
        const variablePattern = /\{\{([^}]+)\}\}/g;
        resolved = resolved.replace(variablePattern, (match, varName) => {
            const variable = env.variables.find(v => v.key === varName && v.enabled);
            return variable ? variable.value : match;
        });

        return resolved;
    }
}

export const environmentManager = new EnvironmentManager();
