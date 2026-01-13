import * as cheerio from "cheerio";

/**
 * 将 CSS 样式内联到 HTML 元素上
 * 解析 CSS 规则并应用到对应的元素
 */
export function applyInlineStyles(htmlContent: string, cssContent: string): string {
  const $ = cheerio.load(htmlContent);

  // 解析 CSS 规则
  const rules = parseCSS(cssContent);

  // 应用样式规则
  rules.forEach((rule) => {
    try {
      const $elements = $(rule.selector);
      $elements.each((_, element) => {
        const $el = $(element);
        const existingStyle = $el.attr("style") || "";
        const newStyle = rule.declarations
          .map((decl) => `${decl.property}: ${decl.value}`)
          .join("; ");

        // 合并样式
        if (existingStyle) {
          $el.attr("style", `${existingStyle}; ${newStyle}`);
        } else {
          $el.attr("style", newStyle);
        }
      });
    } catch (e) {
      // 忽略无法解析的选择器
      console.warn(`无法应用样式规则: ${rule.selector}`, e);
    }
  });

  // 后处理：特殊处理某些元素
  postProcessStyles($);

  // 提取内容
  let result = $.html();
  if (result.includes("<html>")) {
    const bodyMatch = result.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      result = bodyMatch[1];
    }
  }

  return result;
}

/**
 * 解析 CSS 内容为规则数组
 */
function parseCSS(css: string): CSSRule[] {
  const rules: CSSRule[] = [];
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const declarationsStr = match[2].trim();
    const declarations: CSSDeclaration[] = [];

    // 解析声明
    declarationsStr.split(";").forEach((decl) => {
      const colonIndex = decl.indexOf(":");
      if (colonIndex > 0) {
        const property = decl.substring(0, colonIndex).trim();
        const value = decl.substring(colonIndex + 1).trim();
        if (property && value) {
          declarations.push({ property, value });
        }
      }
    });

    if (declarations.length > 0) {
      rules.push({ selector, declarations });
    }
  }

  return rules;
}

/**
 * 后处理样式
 */
function postProcessStyles($: cheerio.CheerioAPI): void {
  // 移除代码块装饰器 span 的 line-height
  $("pre.custom > span").first().each((_, element) => {
    const $span = $(element);
    let style = $span.attr("style") || "";
    style = style.replace(/line-height:\s*[^;]+;?/gi, "");
    $span.attr("style", style);
  });

  // 确保代码块有正确的默认样式
  $("code.hljs").each((_, element) => {
    const $code = $(element);
    let style = $code.attr("style") || "";

    // 如果没有 color，设置默认颜色
    if (!style.includes("color:")) {
      style = `color: #abb2bf; ${style}`;
    }

    // 确保有 padding-top
    if (!style.includes("padding-top:")) {
      style = `padding-top: 15px; ${style}`;
    }

    $code.attr("style", style.trim());
  });
}

interface CSSRule {
  selector: string;
  declarations: CSSDeclaration[];
}

interface CSSDeclaration {
  property: string;
  value: string;
}

