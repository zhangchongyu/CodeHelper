import * as vscode from "vscode";

export abstract class ModuleBase implements IModule {
    constructor(protected vscodeContext: vscode.ExtensionContext) {
        this.ModuleName = this.constructor.name;
    }

    public ModuleName: string;

    public async InitModule(): Promise<void> {
        try {
            await this.OnInit();
            let enableString = vscode.workspace.getConfiguration().get(`codehelper.${this.ModuleName}Enable`) as boolean | undefined;
            if (enableString) {
                if (this.IsModuleEnable()) {
                    this.__OnModuleEnable();
                }
                this.AddListener(vscode.workspace.onDidChangeConfiguration(this.__OnDidChangeConfiguration, this));
            }
            else {
                this.__OnModuleEnable();
            }

            this.Debug(`Init Success`);
        } catch (error) {
            this.Error(error);
        }
    }

    public Dispose(): void {
        this.ClearListeners();
        this.OnDispose();
    }

    //#region 生命周期
    /** 初始化 */
    protected async OnInit(): Promise<void> { }
    /** 释放 */
    protected OnDispose(): void { }

    //#endregion

    //#region 功能启用

    /** 是否启用 */
    protected IsModuleEnable(): boolean {
        return vscode.workspace.getConfiguration().get<boolean>(`codehelper.${this.ModuleName}Enable`) || false;
    }

    private __OnModuleEnable(): void {
        this.Debug(`Module Enable`);
        this.OnModuleEnable();
    }

    private __OnModuleDisable(): void {
        this.Debug(`Module Disable`);
        this.OnModuleDisable();
    }

    /** 功能启用时执行 */
    protected OnModuleEnable(): void { }
    /** 功能禁用时执行 */
    protected OnModuleDisable(): void { }
    /** 配置变化监听函数 */
    private __OnDidChangeConfiguration(event: vscode.ConfigurationChangeEvent): void {
        if (event.affectsConfiguration(`codehelper.${this.ModuleName}Enable`)) {
            if (this.IsModuleEnable()) {
                this.__OnModuleEnable();
            } else {
                this.__OnModuleDisable();
            }
        }
    }

    //#endregion

    //#region get

    /** 作者名 */
    protected GetAuthor(): string {
        return vscode.workspace.getConfiguration().get<string>("codehelper.author") || "CodeHelper";
    }

    /** 当前激活的编辑器 */
    protected GetActiveEditor(): vscode.TextEditor | undefined {
        return vscode.window.activeTextEditor;
    }

    /** 当前激活的文档 */
    protected GetActiveDocument(): vscode.TextDocument | undefined {
        return this.GetActiveEditor()?.document;
    }

    /** 当前激活的文件路径 */
    protected GetActiveFilePath(): string | undefined {
        return this.GetActiveDocument()?.fileName;
    }

    /** 获取配置 */
    protected GetConfiguration(): CodeHelperConfiguration {
        return vscode.workspace.getConfiguration("codehelper") as unknown as CodeHelperConfiguration;
    }

    //#endregion

    //#region 订阅事件

    private __listeners: vscode.Disposable[] = [];

    protected AddListener(listener: vscode.Disposable): vscode.Disposable {
        this.__listeners.push(listener);
        return listener;
    }

    protected RemoveListener(listener: vscode.Disposable): void {
        let index = this.__listeners.indexOf(listener);
        if (index > -1) {
            let listener = this.__listeners.splice(index, 1)[0];
            listener.dispose();
        }
    }

    protected ClearListeners(): void {
        this.__listeners.forEach(listener => listener.dispose());
        this.__listeners = [];
    }

    /**
     * 注册命令
     * @param command 命令
     * @param callback 回调
     */
    protected RegisterCommand(command: string, callback: (...args: any[]) => void): vscode.Disposable {
        return this.AddListener(vscode.commands.registerCommand(command, callback, this));
    }

    //#endregion

    /**
     * 显示错误信息
     * @param msg 错误信息
     */
    protected ShowErrorMessage(msg: string): void {
        vscode.window.showErrorMessage(msg);
    }

    //#region DEBUG

    /**
     * 输出调试信息
     * @param msg 调试信息
     */
    protected Debug(msg: string): void {
        console.debug(`${new Date().toLocaleString()} [CodeHelper.${this.ModuleName}]: ${msg}`);
    }

    /**
     * 输出错误信息
     * @param msg 错误信息
     */
    protected Error(msg: any): void {
        console.error(`${new Date().toLocaleString()} [CodeHelper.${this.ModuleName}]: ${msg}`);
    }

    //#endregion
}