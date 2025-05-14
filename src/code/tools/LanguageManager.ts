// ==========================================================================================
// Description : 语言配置管理器
// From        : better-comments
// Url         : https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments
// Github      : https://github.com/aaron-bond/better-comments
// ==========================================================================================

import * as path from 'path';
import * as vscode from 'vscode';
// ! 坑爹玩意，使用 import * as json5 from 'json5'; 会报错，使用 import json5 from 'json5'; 则不会报错
import json5 from 'json5';

export class LanguageManager {
    private readonly languageConfigurationFiles = new Map<string, string>();
    private readonly languageConfigurations = new Map<string, vscode.LanguageConfiguration | undefined>();

    private static instance: LanguageManager;
    public static get Ins(): LanguageManager {
        if (!LanguageManager.instance) {
            LanguageManager.instance = new LanguageManager();
        }
        return LanguageManager.instance;
    }

    constructor() {
        this.UpdateLanguagesDefinitions();
        vscode.extensions.onDidChange(this.UpdateLanguagesDefinitions, this);
    }

    public Clear(): void {
        this.languageConfigurationFiles.clear();
        this.languageConfigurations.clear();
    }

    private UpdateLanguagesDefinitions(): void {
        this.Clear();
        for (let extension of vscode.extensions.all) {
            let packageJson = extension.packageJSON;
            if (packageJson.contributes && packageJson.contributes.languages) {
                for (let language of packageJson.contributes.languages) {
                    if (language.configuration) {
                        let configPath = path.join(extension.extensionPath, language.configuration);
                        this.languageConfigurationFiles.set(language.id, configPath);
                    }
                }
            }
        }
    }

    /**
     * 获取指定语言的注释配置
     * @param languageId 语言ID
     * @returns 注释配置
     */
    public async GetLanguageComments(languageId: string): Promise<any> {
        let config = await this.GetLanguageConfiguration(languageId);
        if (config) {
            return config.comments;
        }
        return undefined;
    }

    /**
     * 获取指定语言的完整配置
     * @param languageId 语言ID
     * @returns 完整配置
     */
    public async GetLanguageConfiguration(languageId: string): Promise<vscode.LanguageConfiguration | undefined> {
        if (this.languageConfigurations.has(languageId)) {
            return this.languageConfigurations.get(languageId);
        }
        if (!this.languageConfigurationFiles.has(languageId)) {
            return undefined;
        }

        try {
            let configPath = this.languageConfigurationFiles.get(languageId) as string;
            let rawdata = await vscode.workspace.fs.readFile(vscode.Uri.file(configPath));
            let content = new TextDecoder().decode(rawdata);
            // ? 这里使用 json5 解析，因为vscode的语言配置中有注释，使用 json 解析会报错，只能通过json5解析
            let json = json5.parse<vscode.LanguageConfiguration>(content);
            this.languageConfigurations.set(languageId, json);
            return json;
        }
        catch (e) {
            this.languageConfigurations.set(languageId, undefined);
            return undefined;
        }
    }
}
