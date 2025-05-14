// ==========================================================================================
// Author      : Zcy
// Created     : 2025/1/7 20:59:26
// Description : 颜色编码高亮
// ==========================================================================================

import * as vscode from "vscode";
import { ModuleBase } from "./base/ModuleBase";
import { ColorTool } from "./tools/ColorTool";

// 定义颜色高亮渲染接口
interface IColorHighLightRender {
    color: string; // 颜色值
    decoration: vscode.TextEditorDecorationType; // 装饰类型
    ranges: vscode.Range[]; // 颜色应用的范围
}

let InvertHexColor = ColorTool.InvertHexColor;

export class ColorHighLight extends ModuleBase {
    private renderers: ColorHighLightRenderer[] = []; // 存储颜色高亮渲染器

    // 启用特性时的初始化
    protected OnModuleEnable(): void {
        this.InitRenderers(); // 初始化渲染器

        // 添加事件监听器
        this.AddListener(vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this));
        this.AddListener(vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this));
        this.AddListener(vscode.workspace.onDidChangeConfiguration(this.OnDidChangeConfiguration, this));
    }

    // 禁用特性时的清理
    protected OnModuleDisable(): void {
        this.ClearRenderer(); // 清除渲染器
        this.ClearListeners();
    }

    /** 活动文本编辑器变化事件 */
    private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
        if (editor) {
            this.UpdateRenderer(editor); // 更新当前活动编辑器的渲染器
        }

        // 处理掉无用的对象
        let editors = vscode.window.visibleTextEditors; // 获取当前可见的文本编辑器
        this.renderers = this.renderers.filter(item => editors.includes(item.editor)); // 过滤掉不再可见的渲染器
    }

    /** 文本文档变化事件 */
    private onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
        let activeEditor = this.GetActiveEditor(); // 获取当前活动编辑器
        if (!activeEditor) return; // 如果没有活动编辑器，直接返回
        this.UpdateRenderer(activeEditor); // 更新活动编辑器的渲染器
    }

    /** 配置参数变化 */
    private OnDidChangeConfiguration(e: vscode.ConfigurationChangeEvent): void {
        if (e.affectsConfiguration("codehelper.colorHighLightParam")) {
            this.renderers.forEach(item => item.ReUpdate()); // 重新更新所有渲染器
        }
    }

    /** 初始化渲染器 */
    private InitRenderers(): void {
        let editors = vscode.window.visibleTextEditors; // 获取当前可见的文本编辑器
        for (let editor of editors) {
            this.renderers.push(new ColorHighLightRenderer(editor)); // 为每个编辑器创建渲染器
        }
    }

    /** 更新渲染器 */
    private UpdateRenderer(editor: vscode.TextEditor): void {
        let renderer = this.renderers.find(item => item.editor === editor); // 查找对应的渲染器
        if (renderer) {
            renderer.Update(); // 更新已存在的渲染器
        }
        else {
            this.renderers.push(new ColorHighLightRenderer(editor)); // 创建新的渲染器
        }
    }

    /** 清除渲染器 */
    private ClearRenderer(): void {
        for (let renderer of this.renderers) {
            renderer.Clear(); // 清除每个渲染器的装饰
        }
        this.renderers.length = 0; // 清空渲染器数组
    }
}

class ColorHighLightRenderer {
    private colors: IColorHighLightRender[] = []; // 存储颜色高亮信息的数组

    constructor(public editor: vscode.TextEditor) {
        this.editor = editor;
        this.Update();
    }

    public ReUpdate(): void {
        this.Clear();
        this.Update();
    }

    public async Update(): Promise<void> {
        await this.FindColor();
        this.Apply();
    }

    private async FindColor(): Promise<void> {
        let editor = this.editor;
        let document = editor.document; // 获取当前文档
        let text = document.getText(); // 获取文档文本
        let regex = new RegExp("#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})", "ig"); // 创建正则表达式匹配颜色
        let match: RegExpExecArray | null;
        let config = vscode.workspace.getConfiguration().get("codehelper.ColorHighLightParam") as ColorHighLightParam; // 获取配置参数
        while (match = regex.exec(text)) {
            let start = document.positionAt(match.index); // 匹配开始位置
            let end = document.positionAt(match.index + match[0].length); // 匹配结束位置
            let range = new vscode.Range(start, end);
            let color = `#${match[1]}`; // 获取颜色值
            let search = this.colors.find(item => item.color === color); // 查找已存在的颜色
            if (search) {
                search.ranges.push(range);
            }
            else {
                let options: vscode.DecorationRenderOptions = { backgroundColor: color }; // 设置背景颜色

                if (config.InvertTextColor) {
                    options.color = InvertHexColor(color);             // 反转颜色
                }

                if (config.UseBorder) {
                    options.borderStyle = config.BorderStyle || "solid";    // 设置边框样式
                    options.borderWidth = config.BorderWidth || "1px";      // 设置边框宽度
                    options.borderRadius = config.BorderRadius || "3px";    // 设置边框圆角
                    options.borderColor = InvertHexColor(color);       // 设置边框颜色
                }

                let decoration = vscode.window.createTextEditorDecorationType(options); // 创建装饰类型
                this.colors.push({ color: color, decoration: decoration, ranges: [range] });
            }
        }
    }

    private Apply(): void {
        let editor = this.editor;
        for (let color of this.colors) {
            editor.setDecorations(color.decoration, color.ranges);
            color.ranges.length = 0;
        }
    }

    public Clear(): void {
        for (let color of this.colors) {
            color.decoration.dispose();
        }
        this.colors.length = 0;
    }
}