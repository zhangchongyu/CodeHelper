interface IModule {
    /**
     * 模块名称
     */
    ModuleName: string;
    /**
     * 初始化接口
     */
    InitModule(): Promise<void>;
    /**
     * 释放资源接口
     */
    Dispose(): void;
}

//#region 插件配置

/**
 * 插件配置
 */
declare class CodeHelperConfiguration {
    /**
     * 作者
     */
    author: string;
    /**
     * 是否启用自动头部注释
     */
    AutoHeadCommentEnable: boolean;
    /**
     * 自动头部注释参数
     */
    AutoHeadCommentParam: AutoHeadCommentParam[];
    /**
     * 是否启用颜色高亮
     */
    ColorHighlightEnable: boolean;
    /**
     * 颜色高亮参数
     */
    ColorHighLightParam: ColorHighLightParam;
    /**
     * 是否启用注释颜色
     */
    CommentColorEnable: boolean;
    /**
     * 注释颜色标签
     */
    CommentColorTag: CommentColorTag[];
    /**
     * GamePlay工作区路径
     */
    GamePlayWorkspacePath: string;
}

/**
 * 自动头部注释参数
 */
declare class AutoHeadCommentParam {
    /**
     * 语言(文件后缀)
     */
    language: string;
    /**
     * 注释
     */
    comment: string;
}

/**
 * 颜色高亮参数
 */
declare class ColorHighLightParam {
    /**
     * 是否反转文本颜色 
     * 
     * 启用后，文本颜色会改变成与背景颜色相反的颜色
     */
    InvertTextColor?: boolean;
    /**
     * 是否使用边框
     */
    UseBorder?: boolean;
    /**
     * 边框宽度
     */
    BorderWidth?: string;
    /**
     * 边框圆角
     */
    BorderRadius?: string;
    /**
     * 边框样式
     */
    BorderStyle?: string;
}

/**
 * 注释颜色标签
 */
declare class CommentColorTag {
    /**
     * 标签
     */
    tag: string;
    /**
     * 颜色
     */
    color: string;
    /**
     * 是否使用删除线
     */
    strikethrough: boolean;
    /**
     * 是否使用下划线
     */
    underline: boolean;
    /**
     * 是否使用加粗
     */
    bold: boolean;
    /**
     * 是否使用斜体
     */
    italic: boolean;
}

//#endregion

declare class ThemeConfiguration {
    colors: ThemeColors;
    name: string;
    semanticHighlighting: boolean;
    semanticTokenColors: any;
    tokenColors: any;
    type: string;
}

declare class ThemeColors {
    [key: string]: string;
}