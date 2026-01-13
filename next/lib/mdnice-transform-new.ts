import * as cheerio from "cheerio";

/**
 * 将 HTML 转换为 mdnice 编辑器格式
 * 使用 DOM 操作而不是正则表达式，确保更可靠的转换
 */
export function transformToMdniceFormat(htmlContent: string): string {
  const $ = cheerio.load(htmlContent);

  // 1. 转换容器：<div id="nice"> -> <section id="nice" data-tool="mdnice编辑器" data-website="https://www.mdnice.com">
  $("#nice").each((_, element) => {
    const $el = $(element);
    if ($el.is("div")) {
      const $section = $("<section>");
      $section.attr("id", "nice");
      $section.attr("data-tool", "mdnice编辑器");
      $section.attr("data-website", "https://www.mdnice.com");
      $section.html($el.html() || "");
      $el.replaceWith($section);
    } else if ($el.is("section")) {
      $el.attr("data-tool", "mdnice编辑器");
      $el.attr("data-website", "https://www.mdnice.com");
    }
  });

  // 2. 处理标题：添加 prefix, content, suffix 结构
  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const $heading = $(element);
    const text = $heading.text();
    const existingPrefix = $heading.find(".prefix");
    const existingContent = $heading.find(".content");
    const existingSuffix = $heading.find(".suffix");

    if (existingPrefix.length === 0 && existingContent.length === 0 && existingSuffix.length === 0) {
      $heading.empty();
      $heading.append('<span class="prefix" style="display: none;"></span>');
      $heading.append(`<span class="content">${text}</span>`);
      $heading.append('<span class="suffix" style="display: none;"></span>');
    }
    $heading.attr("data-tool", "mdnice编辑器");
  });

  // 3. 处理代码块
  $("pre").each((_, element) => {
    const $pre = $(element);
    const $firstCode = $pre.find("code").first();

    // 检查并修复代码块：如果 <pre> 中包含无效的块级元素（在 <code> 之后），需要修复
    let foundInvalidAfterCode = false;
    let foundCode = false;
    const invalidTags = ["h1", "h2", "h3", "h4", "h5", "h6", "ol", "ul", "table", "blockquote", "hr", "p"];

    $pre.contents().each((_, node: any) => {
      if (node === $firstCode[0]) {
        foundCode = true;
      } else if (foundCode && node.type === "tag") {
        const tagName = node.tagName?.toLowerCase();
        if (tagName && invalidTags.includes(tagName)) {
          foundInvalidAfterCode = true;
          return false; // 中断遍历
        }
      }
    });

    if (foundInvalidAfterCode && $firstCode.length > 0) {
      // 代码块包含了后续内容，需要修复
      // 只保留到第一个 code 标签结束的内容
      const $codeClone = $firstCode.clone();
      $pre.empty();
      $pre.append($codeClone);
    }

    // 添加 custom 类和 data-tool 属性
    $pre.addClass("custom");
    $pre.attr("data-tool", "mdnice编辑器");

    // 确保 code 元素有 hljs 类
    $pre.find("code").addClass("hljs");

    // 设置代码块的默认样式
    if (!$pre.attr("style")) {
      $pre.attr(
        "style",
        "border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.55) 0px 2px 10px; text-align: left; margin-top: 10px; margin-bottom: 10px; margin-left: 0px; margin-right: 0px; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;"
      );
    }

    // 处理代码内容：处理换行、空格、特殊字符
    $pre.find("code").each((_, codeElement) => {
      processCodeContent($(codeElement));
    });

    // 在代码块顶部添加装饰器 span（mac 风格）
    if ($pre.find("span").first().length === 0 || !$pre.find("span").first().attr("style")?.includes("background:")) {
      const $decorator = $(
        '<span style="display: block; background: url(https://files.mdnice.com/user/3441/876cad08-0422-409d-bb5a-08afec5da8ee.svg); height: 30px; width: 100%; background-size: 40px; background-repeat: no-repeat; background-color: #282c34; margin-bottom: -7px; border-radius: 5px; background-position: 10px 10px;"></span>'
      );
      $pre.prepend($decorator);
    }
  });

  // 4. 处理列表项：用 <section> 包裹内容
  $("li").each((_, element) => {
    const $li = $(element);
    const $section = $li.find("section").first();

    if ($section.length === 0) {
      const content = $li.html() || "";
      if (content.trim()) {
        $li.empty();
        $li.append(`<section>${content}</section>`);
      }
    }

    // 清理空的 section 和 li
    $li.find("section").each((_, sectionEl) => {
      const $section = $(sectionEl);
      if (!$section.text().trim() && !$section.html()?.trim()) {
        $section.remove();
      }
    });
  });

  // 清理空的 li
  $("li").each((_, element) => {
    const $li = $(element);
    if (!$li.text().trim() && !$li.html()?.trim()) {
      $li.remove();
    }
  });

  // 5. 为其他元素添加 data-tool 属性
  $("p, ul, ol, blockquote, hr").each((_, element) => {
    const $el = $(element);
    if (!$el.attr("data-tool")) {
      $el.attr("data-tool", "mdnice编辑器");
    }
  });

  // 6. 格式化列表：移除多余的空白
  $("ol, ul").each((_, element) => {
    const $list = $(element);
    // 移除紧跟在 <ol>/<ul> 后的空白
    const html = $list.html() || "";
    $list.html(html.replace(/^\s+/, "").replace(/>\s+</g, "><"));
  });

  // 7. 修复 HTML 实体（在代码块中）
  $("code").each((_, element) => {
    const $code = $(element);
    let html = $code.html() || "";
    // 修复双重转义的实体
    html = html.replace(/&amp;nbsp;/g, "&nbsp;");
    html = html.replace(/&amp;lt;br&amp;gt;/g, "<br>");
    html = html.replace(/&lt;br&gt;/g, "<br>");
    html = html.replace(/&amp;#39;/g, "'");
    html = html.replace(/&amp;quot;/g, '"');
    $code.html(html);
  });

  // 8. 统一 <br/> 为 <br>
  $("br").each((_, element) => {
    const $br = $(element);
    if ($br[0].tagName.toLowerCase() === "br") {
      $br.replaceWith("<br>");
    }
  });

  // 提取最终内容
  let result = $.html();

  // 移除 cheerio 添加的额外标签
  if (result.includes("<html>")) {
    const bodyMatch = result.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      result = bodyMatch[1];
    }
  }

  // 提取 section#nice 的内容
  const $final = cheerio.load(result);
  const $nice = $final("#nice");
  if ($nice.length > 0) {
    result = $nice.parent().html() || result;
  }

  return result;
}

/**
 * 处理代码块内容
 * 处理换行、空格、特殊字符
 */
function processCodeContent($code: cheerio.Cheerio<any>): void {
  const originalHtml = $code.html() || "";

  // 如果代码块包含 HTML 标签（语法高亮），需要递归处理文本节点
  if (originalHtml.includes("<")) {
    // 重新加载以处理嵌套的 HTML
    const $temp = cheerio.load(originalHtml);
    processTextNodes($temp.root()[0], $temp);
    $code.html($temp.html());
  } else {
    // 纯文本，直接处理
    const processed = processCodeText(originalHtml);
    $code.text(processed);
  }
}

/**
 * 递归处理文本节点
 */
function processTextNodes(node: any, $: cheerio.CheerioAPI): void {
  if (node.type === "text") {
    const processed = processCodeText(node.data || "");
    if (processed.includes("<") || processed.includes("&nbsp;")) {
      // 包含 HTML 标签或实体，需要替换为 HTML
      const $parent = $(node.parent);
      if ($parent.length > 0) {
        const $newNode = cheerio.load(processed);
        $(node).replaceWith($newNode.root().contents());
      } else {
        node.data = processed;
      }
    } else {
      // 纯文本，直接更新
      node.data = processed;
    }
  } else if (node.children) {
    // 递归处理子节点
    node.children.forEach((child: any) => {
      processTextNodes(child, $);
    });
  }
}

/**
 * 处理代码文本
 * - 实际的换行符转换为 <br>
 * - 空格转换为 &nbsp;
 * - 字面量的 \n 保持不变（使用占位符）
 */
function processCodeText(text: string): string {
  // 先处理字面量的 \n（在 markdown 源码中写的是 \n）
  // 使用占位符保护它们
  const literalNewlinePlaceholder = "___LITERAL_NEWLINE___";
  text = text.replace(/\\n/g, literalNewlinePlaceholder);

  // 处理实际的换行符
  text = text.replace(/\n/g, "<br>");

  // 恢复字面量的 \n
  text = text.replace(new RegExp(literalNewlinePlaceholder, "g"), "\\n");

  // 处理空格：转换为 &nbsp;
  text = text.replace(/ /g, "&nbsp;");

  return text;
}

