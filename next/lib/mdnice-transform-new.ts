/**
 * mdnice HTML 格式转换工具 (全新实现)
 * 完全使用 DOM 操作，不使用正则表达式
 * 参考 target.html 的实际结构
 */

import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export function transformToMdniceFormat(htmlContent: string): string {
  const $ = cheerio.load(htmlContent);

  // 1. 转换外层容器 <div id="nice"> -> <section id="nice" data-tool="mdnice编辑器" data-website="https://www.mdnice.com">
  const $niceDiv = $('#nice');
  if ($niceDiv.length > 0 && $niceDiv[0].tagName === 'div') {
    // 创建新的 section 元素
    const $newSection = $('<section>');
    
    // 复制所有属性（除了 id）
    const attrs = ($niceDiv[0] as Element).attribs || {};
    Object.keys(attrs).forEach(key => {
      if (key !== 'id') {
        $newSection.attr(key, attrs[key]);
      }
    });
    
    // 设置必需的属性
    $newSection.attr('id', 'nice');
    $newSection.attr('data-tool', 'mdnice编辑器');
    $newSection.attr('data-website', 'https://www.mdnice.com');
    
    // 复制内容
    $newSection.html($niceDiv.html() || '');
    
    // 替换原元素
    $niceDiv.replaceWith($newSection);
  }

  // 2. 处理标题（h1-h6）- 添加 prefix/content/suffix 结构
  for (let level = 1; level <= 6; level++) {
    $(`h${level}`).each((_, element) => {
      const $heading = $(element);
      
      // 如果已经有 content span，跳过
      if ($heading.find('span.content').length > 0) {
        return;
      }
      
      // 获取标题内容（保留 HTML 结构）
      const headingContent = $heading.html() || '';
      
      // 提取纯文本（用于 content span）
      const textContent = $heading.text().trim();
      
      // 添加 data-tool 属性
      if (!$heading.attr('data-tool')) {
        $heading.attr('data-tool', 'mdnice编辑器');
      }
      
      // 创建新的结构
      const $prefix = $('<span>').addClass('prefix').attr('style', 'display: none;');
      const $content = $('<span>').addClass('content').text(textContent);
      const $suffix = $('<span>').addClass('suffix').attr('style', 'display: none;');
      
      // 清空标题内容，添加新的结构
      $heading.empty().append($prefix).append($content).append($suffix);
    });
  }

  // 3. 处理代码块 - 转换为 pre.custom 格式
  $('pre').each((_, element) => {
    const $pre = $(element);
    const $code = $pre.find('code').first();
    
    if ($code.length === 0) {
      return;
    }
    
    // 确保 pre 有 class="custom"
    $pre.addClass('custom');
    
    // 移除 pre 上的 data-tool（如果有）
    $pre.removeAttr('data-tool');
    
    // 添加 pre.custom 的默认样式
    const defaultPreStyle = 'border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.55) 0px 2px 10px; text-align: left;';
    const existingPreStyle = $pre.attr('style') || '';
    $pre.attr('style', existingPreStyle ? `${existingPreStyle}; ${defaultPreStyle}` : defaultPreStyle);
    
    // 确保 code 有 class="hljs"，移除其他类
    $code.removeClass().addClass('hljs');
    
    // 添加 code.hljs 的默认样式
    const defaultCodeStyle = 'overflow-x: auto; padding: 16px; color: #abb2bf; background-attachment: scroll; background-clip: border-box; background-color: rgba(27, 31, 35, 0.05); background-image: none; background-origin: padding-box; background-position-x: 0%; background-position-y: 0%; background-repeat: no-repeat; background-size: auto; width: auto; margin-top: 0px; margin-bottom: 0px; margin-left: 2px; margin-right: 2px; padding-bottom: 2px; padding-left: 4px; padding-right: 4px; border-top-style: none; border-bottom-style: none; border-left-style: none; border-right-style: none; border-top-width: 3px; border-bottom-width: 3px; border-left-width: 3px; border-right-width: 3px; border-top-color: rgb(0, 0, 0); border-bottom-color: rgba(0, 0, 0, 0.4); border-left-color: rgba(0, 0, 0, 0.4); border-right-color: rgba(0, 0, 0, 0.4); border-top-left-radius: 4px; border-top-right-radius: 4px; border-bottom-right-radius: 4px; border-bottom-left-radius: 4px; overflow-wrap: break-word; word-break: break-all; padding-top: 15px; background: #282c34; border-radius: 5px; display: -webkit-box; font-family: Consolas, Monaco, Menlo, monospace; font-size: 12px;';
    
    // 清理现有样式中的错误值
    let existingCodeStyle = $code.attr('style') || '';
    existingCodeStyle = existingCodeStyle
      .replace(/color:\s*(?!#|rgb|rgba|hsl|hsla|inherit|initial|unset)[^;]+;/gi, '')
      .replace(/background(?:-color)?:\s*(?!#|rgb|rgba|hsl|hsla|inherit|initial|unset)[^;]+;/gi, '');
    
    $code.attr('style', existingCodeStyle ? `${existingCodeStyle}; ${defaultCodeStyle}` : defaultCodeStyle);
    
    // 处理代码内容：将换行转换为 <br>，空格转换为 &nbsp;
    const codeText = $code.text();
    const processedText = codeText
      .split('\n')
      .map((line: string) => {
        // 计算前导空格数
        const leadingSpaces = line.length - line.trimStart().length;
        if (leadingSpaces > 0) {
          return '&nbsp;'.repeat(leadingSpaces) + line.substring(leadingSpaces);
        }
        return line;
      })
      .join('<br>')
      .replace(/ /g, '&nbsp;');
    
    $code.html(processedText);
    
    // 添加顶部装饰条
    const $decorator = $('<span>').attr('style', 'display: block; background: url(https://files.mdnice.com/user/3441/876cad08-0422-409d-bb5a-08afec5da8ee.svg); height: 30px; width: 100%; background-size: 40px; background-repeat: no-repeat; background-color: #282c34; margin-bottom: -7px; border-radius: 5px; background-position: 10px 10px;');
    $pre.prepend($decorator);
  });

  // 4. 处理列表项 - 用 <section> 包裹内容
  $('li').each((_, element) => {
    const $li = $(element);
    
    // 如果已经有 section，跳过
    if ($li.find('section').length > 0) {
      return;
    }
    
    // 检查内容是否为空
    const textContent = $li.text().trim();
    const hasChildren = $li.children().length > 0;
    const htmlContent = ($li.html() || '').trim();
    
    // 如果内容为空，跳过（不创建空的 section）
    if (!textContent && !hasChildren && !htmlContent) {
      return;
    }
    
    // 获取列表项的所有内容
    const content = $li.html() || '';
    
    // 创建 section 包裹内容
    const $section = $('<section>').html(content);
    $li.empty().append($section);
  });
  
  // 4.1 移除所有空的 section 标签
  const emptySections: Element[] = [];
  $('section').each((_, element) => {
    const $section = $(element);
    const textContent = $section.text().trim();
    const hasChildren = $section.children().length > 0;
    const htmlContent = ($section.html() || '').trim();
    
    if (!textContent && !hasChildren && !htmlContent) {
      emptySections.push(element);
    }
  });
  emptySections.forEach(section => {
    $(section).remove();
  });
  
  // 4.2 移除空的列表项
  const emptyListItems: Element[] = [];
  $('li').each((_, element) => {
    const $li = $(element);
    const textContent = $li.text().trim();
    const hasChildren = $li.children().length > 0;
    const htmlContent = ($li.html() || '').trim();
    
    if (!textContent && !hasChildren && !htmlContent) {
      emptyListItems.push(element);
    }
  });
  emptyListItems.forEach(li => {
    $(li).remove();
  });

  // 5. 为其他元素添加 data-tool 属性
  $('p, ul, ol, blockquote, hr').each((_, element) => {
    const $el = $(element);
    if (!$el.attr('data-tool')) {
      $el.attr('data-tool', 'mdnice编辑器');
    }
  });

  // 6. 替换所有 <br/> 为 <br>
  $('br').each((_, element) => {
    const $br = $(element);
    // cheerio 会自动处理，但确保格式一致
  });

  // 获取结果
  let result = $.html();
  
  // 修复 cheerio 可能添加的额外标签
  if (result.includes('<html>')) {
    const bodyMatch = result.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      result = bodyMatch[1];
    }
  }
  
  // 确保 section#nice 在最外层
  const sectionMatch = result.match(/<section[^>]*id=["']nice["'][^>]*>([\s\S]*)<\/section>/i);
  if (sectionMatch) {
    result = sectionMatch[0];
  }
  
  // 修复 cheerio 可能转义的 HTML 实体（在代码块中）
  result = result.replace(/(<pre[^>]*>)([\s\S]*?)(<\/pre>)/gi, (match, preOpen, preContent, preClose) => {
    const codeMatch = preContent.match(/(<code[^>]*>)([\s\S]*?)(<\/code>)/i);
    if (codeMatch) {
      const [, codeOpen, codeContent, codeClose] = codeMatch;
      let fixedCodeContent = codeContent
        .replace(/&amp;nbsp;/g, '&nbsp;')
        .replace(/&amp;lt;br&amp;gt;/g, '<br>')
        .replace(/&lt;br&gt;/g, '<br>')
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;quot;/g, '"');
      const fixedPreContent = preContent.replace(/(<code[^>]*>)([\s\S]*?)(<\/code>)/i, codeOpen + fixedCodeContent + codeClose);
      return preOpen + fixedPreContent + preClose;
    }
    return match;
  });
  
  // 替换 <br/> 为 <br>
  result = result.replace(/<br\s*\/>/gi, '<br>');
  
  // 7. 移除 <ol> 和 <ul> 标签后的换行符，确保第一个 <li> 紧跟在 <ol> 或 <ul> 后面
  // 这样可以避免微信公众号将换行符解析为空白列表项
  result = result.replace(/(<(?:ol|ul)[^>]*>)\s+(<li)/gi, '$1$2');
  result = result.replace(/(<\/li>)\s+(<li)/gi, '$1$2');
  
  return result;
}

