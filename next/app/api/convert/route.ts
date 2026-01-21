export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import MarkdownIt from "markdown-it";
// highlight.js 的正确导入方式
// highlight.js 11.x 可能使用 CommonJS 导出
// @ts-ignore
const hljs = require("highlight.js");
// 尝试获取实际的 highlight.js 对象
const hljsInstance = hljs.default || hljs;
import {
  getCustomCss,
  getDefaultThemeName,
  getThemeStyle,
} from "../../../lib/theme";
import { transformToMdniceFormat } from "../../../lib/mdnice-transform-new";
import { applyInlineStyles } from "../../../lib/mdnice-inline-styles";

// 简单的 HTML 转义函数
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 创建 markdown-it 实例，配置语法高亮
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  highlight: function (str: string, lang: string) {
    // 按照 markdown 中声明的语言做高亮；如果不支持则优雅回退
    if (hljsInstance) {
      // 1. 优先使用显式声明的语言
      if (lang) {
        try {
          const hasGetLanguage = typeof hljsInstance.getLanguage === "function";
          if (!hasGetLanguage || hljsInstance.getLanguage(lang)) {
            if (typeof hljsInstance.highlight === "function") {
              const result: any = hljsInstance.highlight(str, { language: lang, ignoreIllegals: true } as any);
              if (result && result.value) {
                return result.value;
              }
            }
          }
        } catch {
          // 忽略单次高亮错误，后面继续尝试自动检测或转义
        }
      }

      // 2. 如果没有语言或失败，尝试自动检测
      try {
        if (typeof hljsInstance.highlightAuto === "function") {
          const autoResult: any = hljsInstance.highlightAuto(str);
          if (autoResult && autoResult.value) {
            return autoResult.value;
          }
        }
      } catch {
        // 忽略自动检测错误，落回纯文本
      }
    }

    // 3. 最后回退到纯文本转义
    return escapeHtml(str);
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const markdown: string = body.markdown ?? "";
    const theme: string | null = body.theme ?? null;

    const themeName = theme || getDefaultThemeName();
    if (!themeName) {
      return NextResponse.json(
        {
          success: false,
          error: "未找到任何主题，请先在 theme/ 目录中放置主题配置。",
        },
        { status: 400 }
      );
    }

    let htmlContent = md.render(markdown);

    // 转换为 mdnice 格式
    // 注意：代码块修复逻辑已在 transformToMdniceFormat 函数内部处理
    htmlContent = transformToMdniceFormat(`<div id="nice">${htmlContent}</div>`);

    // 获取主题样式
    const themeStyle = getThemeStyle(themeName);
    const customCss = getCustomCss(themeName);
    
    // 将 CSS 样式内联到元素上
    const combinedCss = `${themeStyle}\n${customCss}`;
    htmlContent = applyInlineStyles(htmlContent, combinedCss);

    // 组合完整的HTML（不再需要 style 标签，样式已内联）
    const fullHtml = htmlContent;

    return NextResponse.json({
      success: true,
      html: fullHtml,
      style: themeStyle,
      customCss,
      theme: themeName,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}


