// ==========================================================================================
// Author      : Zcy
// Created     : 2025/1/7 16:48:53
// Description : 代码处理
// ==========================================================================================


import * as vscode from "vscode";
import { ModuleBase } from "./base/ModuleBase";
import * as path from "path";
import * as fs from "fs";

/**
 * 自动添加头部注释
 */
export class AutoHeadComment extends ModuleBase {

    protected OnModuleEnable(): void {
        this.AddListener(vscode.workspace.onDidCreateFiles(this.OnFileCreated, this));
    }

    protected OnModuleDisable(): void {
        this.ClearListeners();
    }

    /**
     * 文件创建事件
     * @param event 事件
     */
    private OnFileCreated(event: vscode.FileCreateEvent): void {
        for (const file of event.files) {
            try {
                this.TryWriteComment(file);
            } catch (error) {
                this.Error(error);
            }
        }
    }

    private TryWriteComment(file: vscode.Uri): void {
        let extname = path.extname(file.fsPath);
        let language = extname.replace(".", ""); // 获取文件扩展名
        let config = this.GetConfiguration();
        let items = config.AutoHeadCommentParam;
        let search = items.find(item => item.language == language); // 获取配置文件中对应的语言
        if (!search) {
            return;
        }
        let comment = search.comment;
        if (comment.indexOf("${author}") != -1) {
            comment = comment.replace("${author}", this.GetAuthor());
        }
        if (comment.indexOf("${date}") != -1) {
            comment = comment.replace("${date}", new Date().toLocaleString());
        }
        let data = fs.readFileSync(file.fsPath, 'utf8');
        const newData = comment + "\n\n" + data;
        fs.writeFileSync(file.fsPath, newData, 'utf8');
    }
}