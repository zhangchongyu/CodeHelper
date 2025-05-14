// ==========================================================================================
// Description : 注释高亮，集成了《Better Comments》功能（简易版）
// From        : better-comments
// Url         : https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments
// Github      : https://github.com/aaron-bond/better-comments
// ==========================================================================================

import * as vscode from "vscode";
import { ModuleBase } from "./base/ModuleBase";
import { LanguageManager } from "./tools/LanguageManager";

interface ITag {
    tag: string; // 标签名称
    escapedTag: string; // 转义后的标签，用于正则匹配
    decoration: vscode.TextEditorDecorationType;
    ranges: vscode.Range[];
}

interface IRegex {
    pattern: string;
    delimiter: string;
}

interface ILanguage {
    languageId: string;
    pattern: string;
    delimiter: string;
    supported: boolean;
}

export class CommentColor extends ModuleBase {
    private tags: ITag[] = [];
    private languages: ILanguage[] = [];
    private renderers: CommentColorRenderer[] = [];

    protected OnModuleEnable(): void {
        this.InitTags();
        this.InitRenderers();

        this.AddListener(vscode.window.onDidChangeActiveTextEditor(this.OnDidChangeActiveTextEditor, this));
        this.AddListener(vscode.workspace.onDidChangeTextDocument(this.OnDidChangeTextDocument, this));
        this.AddListener(vscode.workspace.onDidChangeConfiguration(this.OnDidChangeConfiguration, this));
    }

    protected OnModuleDisable(): void {
        this.ClearListeners();
        this.ClearDecorations();
    }

    private async InitRenderers(): Promise<void> {
        if (this.renderers.length > 0) {
            this.Error("CommentColorRenderer already initialized");
            return;
        }
        let editors = vscode.window.visibleTextEditors;
        for (let editor of editors) {
            let languageId = editor.document.languageId;
            let language = await this.GetLanguage(languageId);
            if (language.supported) {
                this.renderers.push(new CommentColorRenderer(editor, language, this.tags.concat()));
            }
        }
    }

    /** 活动文本编辑器变化事件 */
    private async OnDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): Promise<void> {
        if (editor) {
            this.UpdateEditorRender(editor);
        }
        // 处理掉无用的对象
        let editors = vscode.window.visibleTextEditors;
        this.renderers = this.renderers.filter(item => editors.includes(item.editor));
    }

    /** 文档文本变化事件 */
    private OnDidChangeTextDocument(): void {
        let editor = this.GetActiveEditor();
        if (editor) {
            this.UpdateEditorRender(editor);
        }
    }

    /** 配置变化事件 */
    private OnDidChangeConfiguration(event: vscode.ConfigurationChangeEvent): void {
        if (event.affectsConfiguration("codehelper.commentTag")) {
            this.ClearDecorations();
            this.InitTags();
            this.InitRenderers();
        }
    }

    /** 取消所有的渲染 */
    private ClearDecorations(): void {
        for (let tag of this.tags) {
            tag.decoration.dispose();
        }
        this.tags.length = 0;
        this.renderers.length = 0;
    }

    private async UpdateEditorRender(editor: vscode.TextEditor): Promise<void> {
        let renderer = this.GetRenderer(editor);
        if (renderer) {
            renderer.Update();
        }
        else {
            let languageId = editor.document.languageId;
            let language = await this.GetLanguage(languageId);
            if (language.supported) {
                this.renderers.push(new CommentColorRenderer(editor, language, this.tags.concat()));
            }
        }
    }

    private GetRenderer(editor: vscode.TextEditor): CommentColorRenderer | undefined {
        let renderer = this.renderers.find(item => item.editor === editor);
        return renderer;
    }

    private async GetLanguage(languageId: string): Promise<ILanguage> {
        let match = this.languages.find(item => item.languageId === languageId);
        if (match) return match;

        let _data: ILanguage = {
            languageId: languageId,
            pattern: "",
            delimiter: "",
            supported: false
        }
        this.languages.push(_data);
        let config = await LanguageManager.Ins.GetLanguageComments(languageId); // 获取语言注释配置
        if (config) {
            let lineComment = config.lineComment as string | string[] | null; // 获取行注释配置
            if (lineComment) {
                if (typeof lineComment === "string") {
                    _data.delimiter = this.EscapeRegExp(lineComment).replace(/\//ig, "\\/"); // 转义分隔符
                }
                else if (lineComment.length > 0) {
                    _data.delimiter = lineComment.map(s => this.EscapeRegExp(s)).join("|"); // 转义多个分隔符
                }

                _data.pattern = "(" + _data.delimiter + ")+( |\t)*"; // 构建正则表达式模式
                let characters: Array<string> = [];
                for (let commentTag of this.tags) {
                    characters.push(commentTag.escapedTag); // 收集标签的转义字符
                }
                _data.pattern += "(";
                _data.pattern += characters.join("|"); // 添加标签匹配
                _data.pattern += ")+(.*)";

                _data.supported = true; // 支持的语言
            }
        }

        this.Debug(`${languageId} comment color supported: ${_data.supported}`);

        return _data;
    }

    /**
     * 设置注释标签及其对应的装饰
     */
    private InitTags(): void {
        this.tags = []; // 初始化标签数组
        let items = this.GetConfiguration().CommentColorTag; // 获取配置中的注释标签
        let strs: string[] = [];
        for (let item of items) {

            let options: vscode.DecorationRenderOptions = { color: item.color } // 设置装饰选项
            options.textDecoration = "";
            if (item.strikethrough) {
                options.textDecoration += "line-through";
            }
            if (item.underline) {
                options.textDecoration += " underline";
            }
            if (item.bold) {
                options.fontWeight = "bold";
            }
            if (item.italic) {
                options.fontStyle = "italic";
            }

            let escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, '\\$1'); // 转义标签
            this.tags.push({
                tag: item.tag,
                escapedTag: escapedSequence.replace(/\//gi, "\\/"), // 转义后的标签
                decoration: vscode.window.createTextEditorDecorationType(options),
                ranges: []
            });
            strs.push(item.tag);
        }
    }

    /**
     * 转义正则表达式
     */
    private EscapeRegExp(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义正则表达式中的特殊字符
    }
}

class CommentColorRenderer {
    constructor(public editor: vscode.TextEditor, params: IRegex, tags: ITag[]) {
        this.regexParams = params;
        tags.forEach(tag => {
            tag.ranges = new Array<vscode.Range>();
        });
        this.tags = tags;
        this.Update();
    }

    private regexParams: IRegex;
    private tags: ITag[];

    public Update(): void {
        this.FindSingleLineComment();
        this.Apply();
    }

    private FindSingleLineComment(): void {
        const editor = this.editor;
        const document = editor.document;
        const text = document.getText();
        const regex = new RegExp(this.regexParams.pattern, "ig");
        let match: RegExpExecArray | null;
        while (match = regex.exec(text)) { // 匹配文本中的注释
            let start = document.positionAt(match.index); // 获取匹配开始位置
            let end = document.positionAt(match.index + match[0].length); // 获取匹配结束位置
            let range = new vscode.Range(start, end); // 创建范围
            let matchTag = this.tags.find(item => item.tag.toLocaleLowerCase() === match![3].toLocaleLowerCase()); // 查找匹配的标签
            if (matchTag) {
                matchTag.ranges.push(range); // 将范围添加到标签的范围中
            }
        }
    }

    private Apply(): void {
        const editor = this.editor;
        for (let tag of this.tags) {
            editor.setDecorations(tag.decoration, tag.ranges); // 设置装饰
            tag.ranges.length = 0; // 清空范围
        }
    }

    public Dispose(): void {
        this.tags.length = 0;
    }
}