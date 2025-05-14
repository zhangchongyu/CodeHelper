// ==========================================================================================
// Author      : Zcy
// Created     : 2025/1/10 11:50:22
// Description : 
// ==========================================================================================

import * as vscode from "vscode";
import * as path from "path";
import json5 from "json5";

export class ThemeManager {
    private readonly themeConfigurationsFiles: Map<string, string> = new Map();
    private readonly themeConfigurations: Map<string, ThemeConfiguration | undefined> = new Map();

    private static _instance: ThemeManager;
    public static get Ins(): ThemeManager {
        if (!ThemeManager._instance) {
            ThemeManager._instance = new ThemeManager();
        }
        return ThemeManager._instance;
    }

    constructor() {
        this.UpdateThemeDefinitions();
        vscode.extensions.onDidChange(this.UpdateThemeDefinitions, this);
    }

    public Clear(): void {
        this.themeConfigurations.clear();
        this.themeConfigurationsFiles.clear();
    }

    private UpdateThemeDefinitions(): void {
        this.Clear();
        for (let extension of vscode.extensions.all) {
            let packageJson = extension.packageJSON;
            if (packageJson.contributes && packageJson.contributes.themes) {
                for (let theme of packageJson.contributes.themes) {
                    let themePath = path.join(extension.extensionPath, theme.path);
                    this.themeConfigurationsFiles.set(theme.id, themePath);
                }
            }
        }
    }

    public async GetEditorBackgroundColor(): Promise<string | undefined> {
        let workbench = vscode.workspace.getConfiguration("workbench");
        let colorTheme = workbench.get<string>("colorTheme");
        if (!colorTheme) {
            return undefined;
        }
        let configuration = await this.GetThemeConfiguration(colorTheme);
        if (!configuration) {
            return undefined;
        }
        let colors = configuration.colors;
        return colors["editor.background"];
    }

    private async GetThemeConfiguration(themeId: string): Promise<ThemeConfiguration | undefined> {
        if (this.themeConfigurations.has(themeId)) {
            return this.themeConfigurations.get(themeId);
        }
        let themePath = this.themeConfigurationsFiles.get(themeId);
        if (!themePath) {
            return undefined;
        }
        try {
            let rawdata = await vscode.workspace.fs.readFile(vscode.Uri.file(themePath));
            let content = new TextDecoder().decode(rawdata);
            let json = json5.parse<ThemeConfiguration>(content);
            this.themeConfigurations.set(themeId, json);
            return json;
        }
        catch (e) {
            this.themeConfigurations.set(themeId, undefined);
            return undefined;
        }
    }
}
