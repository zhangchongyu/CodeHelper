// ==========================================================================================
// Author      : Zcy
// Created     : 2025/1/10 15:30:13
// Description : 
// ==========================================================================================


export class ColorTool {
    /**
     * 将十六进制颜色转换为RGB颜色
     * @param hex 十六进制颜色值
     * @returns RGB颜色值
     */
    public static HexToRgb(hex: string): { r: number, g: number, b: number } {
        let r = parseInt(hex.slice(0, 2), 16);
        let g = parseInt(hex.slice(2, 4), 16);
        let b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
    }

    /**
     * 将RGB颜色转换为十六进制颜色
     * @param r 红色
     * @param g 绿色
     * @param b 蓝色
     * @returns 十六进制颜色值
     */
    public static RgbToHex(r: number, g: number, b: number): string {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    /**
     * 反转颜色
     * @param hex 颜色值
     * @returns 反转后的颜色值
     */
    public static InvertHexColor(hex: string): string {
        if (hex.startsWith('#')) {
            hex = hex.slice(1); // 去掉前缀#
        }
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join(''); // 将3位颜色扩展为6位
        }

        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16).padStart(2, '0'); // 计算反转的红色
        const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16).padStart(2, '0'); // 计算反转的绿色
        const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16).padStart(2, '0'); // 计算反转的蓝色

        return `#${r}${g}${b}`;
    }
}