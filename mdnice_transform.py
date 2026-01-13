"""
mdnice HTML 格式转换工具 (完全重构版本)
完全使用 DOM 操作，不使用正则表达式

转换流程：
1. Markdown -> markdown -> HTML (基础 HTML)
2. HTML -> transform_to_mdnice_format -> mdnice 格式 HTML (添加 data-tool, 结构转换)
3. HTML -> apply_inline_styles -> 内联样式 HTML (将 CSS 内联到元素)
"""

from bs4 import BeautifulSoup, NavigableString, Tag
from typing import List


def transform_to_mdnice_format(html_content: str) -> str:
    """
    将标准 Markdown 转换的 HTML 转换为 mdnice 格式
    完全使用 DOM 操作，不使用正则表达式
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. 转换外层容器 <div id="nice"> -> <section id="nice" data-tool="mdnice编辑器" data-website="https://www.mdnice.com">
    nice_div = soup.find('div', id='nice')
    if nice_div:
        nice_div.name = 'section'
        nice_div['data-tool'] = 'mdnice编辑器'
        nice_div['data-website'] = 'https://www.mdnice.com'
    else:
        # 如果没有找到，查找 section#nice
        nice_section = soup.find('section', id='nice')
        if nice_section:
            if not nice_section.get('data-tool'):
                nice_section['data-tool'] = 'mdnice编辑器'
            if not nice_section.get('data-website'):
                nice_section['data-website'] = 'https://www.mdnice.com'
    
    # 2. 处理标题（h1-h6）- 添加 prefix/content/suffix 结构
    for level in range(1, 7):
        for heading in soup.find_all(f'h{level}'):
            # 如果已经有 content span，跳过
            if heading.find('span', class_='content'):
                continue
            
            # 添加 data-tool 属性
            if not heading.get('data-tool'):
                heading['data-tool'] = 'mdnice编辑器'
            
            # 提取纯文本内容（去除 HTML 标签）
            text_content = heading.get_text(strip=True)
            
            # 创建新的结构
            heading.clear()
            
            prefix_span = soup.new_tag('span', class_='prefix', style='display: none;')
            content_span = soup.new_tag('span', class_='content')
            content_span.string = text_content
            suffix_span = soup.new_tag('span', class_='suffix', style='display: none;')
            
            heading.append(prefix_span)
            heading.append(content_span)
            heading.append(suffix_span)
    
    # 3. 处理代码块 - 转换为 pre.custom 格式
    # 重要：使用 DOM 操作，确保只处理正确的代码块内容
    for pre in soup.find_all('pre'):
        # 如果已经是 custom，跳过
        if 'custom' in pre.get('class', []):
            continue
        
        # 重要：使用 DOM 操作检查代码块是否包含不应该在代码块中的元素
        first_code = pre.find('code')
        invalid_elements = pre.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'table', 'blockquote', 'hr', 'p'])
        
        if invalid_elements and first_code:
            # 检查第一个无效元素是否在第一个 code 标签之后
            found_invalid_after_code = False
            found_code = False
            
            # 遍历所有子节点
            for child in pre.children:
                if child == first_code:
                    found_code = True
                elif found_code and isinstance(child, Tag):
                    tag_name = child.name.lower()
                    if tag_name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'table', 'blockquote', 'hr', 'p']:
                        found_invalid_after_code = True
                        break
            
            if found_invalid_after_code:
                # 代码块包含了后续内容，需要修复
                # 只保留到第一个 code 标签结束的内容
                # 克隆 code 标签及其所有内容
                code_clone = first_code.__copy__()
                pre.clear()
                pre.append(code_clone)
        elif invalid_elements and not first_code:
            # 如果没有 <code> 标签但有无效元素，尝试提取纯文本
            text_content = pre.get_text()
            pre.clear()
            new_code = soup.new_tag('code', class_='hljs')
            new_code.string = text_content
            pre.append(new_code)
        
        # 添加 custom 类
        classes = pre.get('class', [])
        if 'custom' not in classes:
            classes.append('custom')
        pre['class'] = classes
        
        # 添加 data-tool 属性
        if not pre.get('data-tool'):
            pre['data-tool'] = 'mdnice编辑器'
        
        # 添加 pre.custom 的默认样式
        default_pre_style = 'border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.55) 0px 2px 10px; text-align: left;'
        existing_pre_style = pre.get('style', '')
        pre['style'] = f'{existing_pre_style}; {default_pre_style}' if existing_pre_style else default_pre_style
        
        # 查找 code 标签（只查找直接子元素）
        code = None
        for child in pre.children:
            if isinstance(child, Tag) and child.name == 'code':
                code = child
                break
        
        if not code:
            # 如果没有直接子元素 code，尝试查找所有 code
            code = pre.find('code')
            if not code:
                # 如果完全没有 code 标签，创建一个
                # 重要：使用 html 而不是 text，以保留所有内容（包括可能的 HTML 标签）
                code_html = ''
                for child in pre.children:
                    if isinstance(child, Tag):
                        code_html += str(child)
                    elif isinstance(child, NavigableString):
                        code_html += str(child)
                if not code_html:
                    code_html = pre.get_text()
                pre.clear()
                new_code = soup.new_tag('code', class_='hljs')
                # 先设置 HTML 内容，然后再处理
                if code_html:
                    new_code.append(BeautifulSoup(code_html, 'html.parser'))
                pre.append(new_code)
                process_code_content(new_code, soup)
            else:
                # 使用找到的 code 标签
                code['class'] = ['hljs']
                default_code_style = 'overflow-x: auto; padding: 16px; color: #abb2bf; padding-top: 15px; background: #282c34; border-radius: 5px; display: -webkit-box; font-family: Consolas, Monaco, Menlo, monospace; font-size: 12px;'
                existing_code_style = code.get('style', '')
                # 清理现有样式中的错误值
                cleaned_style = existing_code_style
                # 移除 color: <数字>px 和 background: <数字>px 的错误值
                import re
                cleaned_style = re.sub(r'color:\s*\d+px[^;]*;', '', cleaned_style, flags=re.IGNORECASE)
                cleaned_style = re.sub(r'background:\s*\d+px[^;]*;', '', cleaned_style, flags=re.IGNORECASE)
                code['style'] = f'{cleaned_style}; {default_code_style}' if cleaned_style else default_code_style
                process_code_content(code, soup)
                # 添加顶部装饰条
                decorator_span = soup.new_tag('span', style=(
                    'display: block; '
                    'background: url(https://files.mdnice.com/user/3441/876cad08-0422-409d-bb5a-08afec5da8ee.svg); '
                    'height: 30px; '
                    'width: 100%; '
                    'background-size: 40px; '
                    'background-repeat: no-repeat; '
                    'background-color: #282c34; '
                    'margin-bottom: -7px; '
                    'border-radius: 5px; '
                    'background-position: 10px 10px;'
                ))
                pre.insert(0, decorator_span)
        else:
            # 确保 code 有 hljs 类
            code['class'] = ['hljs']
            
            # 添加 code.hljs 的默认样式
            default_code_style = 'overflow-x: auto; padding: 16px; color: #abb2bf; padding-top: 15px; background: #282c34; border-radius: 5px; display: -webkit-box; font-family: Consolas, Monaco, Menlo, monospace; font-size: 12px;'
            existing_code_style = code.get('style', '')
            
            # 清理现有样式中的错误值
            import re
            cleaned_style = existing_code_style
            cleaned_style = re.sub(r'color:\s*\d+px[^;]*;', '', cleaned_style, flags=re.IGNORECASE)
            cleaned_style = re.sub(r'background:\s*\d+px[^;]*;', '', cleaned_style, flags=re.IGNORECASE)
            
            code['style'] = f'{cleaned_style}; {default_code_style}' if cleaned_style else default_code_style
            
            # 处理代码内容（只处理 <code> 标签内的内容）
            process_code_content(code, soup)
            
            # 添加顶部装饰条
            decorator_span = soup.new_tag('span', style=(
                'display: block; '
                'background: url(https://files.mdnice.com/user/3441/876cad08-0422-409d-bb5a-08afec5da8ee.svg); '
                'height: 30px; '
                'width: 100%; '
                'background-size: 40px; '
                'background-repeat: no-repeat; '
                'background-color: #282c34; '
                'margin-bottom: -7px; '
                'border-radius: 5px; '
                'background-position: 10px 10px;'
            ))
            pre.insert(0, decorator_span)
    
    # 4. 处理列表项 - 用 <section> 包裹内容
    for li in soup.find_all('li'):
        # 如果已经有 section，跳过
        if li.find('section'):
            continue
        
        # 检查内容是否为空或只有空白字符
        text_content = li.get_text(strip=True)
        has_children = len(list(li.children)) > 0
        html_content = (str(li.decode_contents()) if hasattr(li, 'decode_contents') else '').strip()
        
        # 如果内容为空，跳过处理
        if not text_content and not has_children and not html_content:
            continue
        
        # 用 section 包裹内容
        # 获取列表项的所有子节点
        li_contents = list(li.children)
        section = soup.new_tag('section')
        # 将原始内容添加到 section 中
        for content in li_contents:
            if hasattr(content, '__copy__'):
                section.append(content.__copy__())
            else:
                section.append(content)
        li.clear()
        li.append(section)
    
    # 4.1 移除所有空的 section 标签
    empty_sections = []
    for section in soup.find_all('section'):
        text_content = section.get_text(strip=True)
        has_children = len(list(section.children)) > 0
        html_content = ''
        for child in section.children:
            if isinstance(child, Tag):
                html_content += str(child)
            elif isinstance(child, NavigableString) and str(child).strip():
                html_content += str(child)
        html_content = html_content.strip()
        
        if not text_content and not has_children and not html_content:
            empty_sections.append(section)
    
    for section in empty_sections:
        section.decompose()
    
    # 4.2 移除空的列表项
    empty_list_items = []
    for li in soup.find_all('li'):
        text_content = li.get_text(strip=True)
        has_children = len(list(li.children)) > 0
        html_content = ''
        for child in li.children:
            if isinstance(child, Tag):
                html_content += str(child)
            elif isinstance(child, NavigableString) and str(child).strip():
                html_content += str(child)
        html_content = html_content.strip()
        
        if not text_content and not has_children and not html_content:
            empty_list_items.append(li)
    
    for li in empty_list_items:
        li.decompose()
    
    # 5. 为其他元素添加 data-tool 属性
    for tag in soup.find_all(['p', 'ul', 'ol', 'blockquote', 'hr']):
        if not tag.get('data-tool'):
            tag['data-tool'] = 'mdnice编辑器'
    
    # 6. 处理列表格式 - 移除 <ol> 和 <ul> 标签后的空白
    for list_tag in soup.find_all(['ol', 'ul']):
        children = list(list_tag.children)
        
        # 移除开头的文本节点（空白字符）
        if children and isinstance(children[0], NavigableString):
            text_node = children[0]
            text = str(text_node)
            # 检查是否只包含空白字符
            is_only_whitespace = True
            for char in text:
                if char not in [' ', '\n', '\r', '\t']:
                    is_only_whitespace = False
                    break
            if is_only_whitespace:
                text_node.extract()
    
    # 移除 </li> 和下一个 <li> 之间的空白
    for li in soup.find_all('li'):
        next_sibling = li.next_sibling
        if next_sibling and isinstance(next_sibling, NavigableString):
            text = str(next_sibling)
            # 检查是否只包含空白字符
            is_only_whitespace = True
            for char in text:
                if char not in [' ', '\n', '\r', '\t']:
                    is_only_whitespace = False
                    break
            if is_only_whitespace:
                next_sibling.extract()
    
    # 修复 BeautifulSoup 可能转义的 HTML 实体（在代码块中）
    for code_tag in soup.select('pre.custom code.hljs'):
        html = ''
        for child in code_tag.children:
            if isinstance(child, Tag):
                html += str(child)
            elif isinstance(child, NavigableString):
                html += str(child)
        if not html:
            html = code_tag.get_text()
        
        # 修复被转义的 HTML 实体（使用字符串替换，不使用正则表达式）
        html = html.replace('&amp;nbsp;', '&nbsp;')
        html = html.replace('&amp;lt;br&amp;gt;', '<br>')
        html = html.replace('&lt;br&gt;', '<br>')
        html = html.replace('&amp;#39;', "'")
        html = html.replace('&amp;quot;', '"')
        
        code_tag.clear()
        if html:
            code_tag.append(BeautifulSoup(html, 'html.parser'))
    
    # 获取结果
    result = str(soup)
    
    # 修复 BeautifulSoup 可能添加的额外标签（如 <html><head><body>）
    # 提取 body 内容
    result_soup = BeautifulSoup(result, 'html.parser')
    body_match = result_soup.find('body')
    if body_match:
        body_content = ''
        for child in body_match.children:
            if isinstance(child, Tag):
                body_content += str(child)
            elif isinstance(child, NavigableString):
                body_content += str(child)
        if body_content:
            result = body_content
    
    # 确保 section#nice 在最外层
    result_soup2 = BeautifulSoup(result, 'html.parser')
    nice_section = result_soup2.find('section', id='nice')
    if nice_section:
        result = str(nice_section)
    
    return result


def process_code_content(code: Tag, soup: BeautifulSoup) -> None:
    """
    处理代码块内容
    关键：代码块中的 \n 字面量应该保持为字面量，不应该转换为换行符
    只有实际的换行符才应该转换为 <br>
    """
    # 重要：只处理 <code> 标签内的直接内容
    # 获取代码的原始 HTML 内容（可能包含语法高亮标签）
    original_html = ''
    for child in code.children:
        if isinstance(child, Tag):
            original_html += str(child)
        elif isinstance(child, NavigableString):
            original_html += str(child)
    if not original_html:
        original_html = code.get_text()
    
    # 如果 original_html 为空，尝试获取文本内容
    if not original_html or not original_html.strip():
        text = code.get_text()
        if text:
            processed = process_code_text(text)
            code.clear()
            code.append(BeautifulSoup(processed, 'html.parser'))
        return
    
    # 检查是否包含 HTML 标签（语法高亮）
    # 注意：我们需要区分真正的 HTML 标签和转义的字符（&lt; 和 &gt;）
    has_html_tags = '<' in original_html and '>' in original_html and '&lt;' not in original_html and '&gt;' not in original_html
    
    if has_html_tags:
        # 如果已经有 HTML 标签（语法高亮），需要保护它们
        # 使用 BeautifulSoup 来解析，这样可以正确处理嵌套的 HTML 标签
        temp_soup = BeautifulSoup(original_html, 'html.parser')
        
        # 递归处理所有文本节点
        def process_text_nodes(element):
            for child in element.children:
                if isinstance(child, NavigableString):
                    text = str(child)
                    if text:
                        # 处理文本：将换行转换为 <br>，空格转换为 &nbsp;
                        processed = process_code_text(text)
                        # 替换文本节点
                        new_soup = BeautifulSoup(processed, 'html.parser')
                        child.replace_with(new_soup)
                elif isinstance(child, Tag):
                    # 递归处理子节点
                    process_text_nodes(child)
        
        process_text_nodes(temp_soup)
        
        # 获取处理后的 HTML
        original_html = str(temp_soup.decode_contents()) if hasattr(temp_soup, 'decode_contents') else str(temp_soup)
    else:
        # 如果没有 HTML 标签，直接处理文本
        # 但需要先检查是否有转义的字符
        text = original_html
        
        # 解码转义的字符（但保留 &nbsp; 等）
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&amp;', '&')
        
        # 处理文本
        processed = process_code_text(text)
        
        # 重新编码特殊字符（但保留 <br> 和 &nbsp;）
        final_html = processed
        # 将 < 和 > 转义（但保留 <br> 标签）
        final_html = final_html.replace('<br>', '__BR_TAG__')
        final_html = final_html.replace('<', '&lt;')
        final_html = final_html.replace('>', '&gt;')
        final_html = final_html.replace('__BR_TAG__', '<br>')
        # 将 & 转义（但保留 &nbsp;、&lt;、&gt;）
        final_html = final_html.replace('&nbsp;', '__NBSP__')
        final_html = final_html.replace('&lt;', '__LT__')
        final_html = final_html.replace('&gt;', '__GT__')
        final_html = final_html.replace('&', '&amp;')
        final_html = final_html.replace('__NBSP__', '&nbsp;')
        final_html = final_html.replace('__LT__', '&lt;')
        final_html = final_html.replace('__GT__', '&gt;')
        
        original_html = final_html
    
    # 直接设置 HTML 内容
    code.clear()
    code.append(BeautifulSoup(original_html, 'html.parser'))


def process_code_text(text: str) -> str:
    """
    处理代码文本
    关键点：
    1. \n 字面量（字符串中的 \n，即反斜杠+n）应该保持为字面量，显示为 \n
    2. 实际的换行符（字符码 10，即真正的换行）应该转换为 <br>
    3. 空格应该转换为 &nbsp;
    """
    # 使用占位符临时替换 \n 字面量
    literal_newline_placeholder = '__LITERAL_NEWLINE__'
    literal_newlines: List[str] = []
    literal_index = 0
    
    # 匹配转义序列字面量：\n, \r, \t（但不匹配实际的换行符）
    # 不使用正则表达式，使用字符串查找
    protected_text = text
    i = 0
    while i < len(protected_text) - 1:
        if protected_text[i] == '\\':
            next_char = protected_text[i + 1]
            if next_char in ['n', 'r', 't', '\\']:
                match = protected_text[i:i+2]
                placeholder = f'{literal_newline_placeholder}_{literal_index}__'
                literal_newlines.append(match)
                protected_text = protected_text[:i] + placeholder + protected_text[i+2:]
                i += len(placeholder)
                literal_index += 1
                continue
        i += 1
    
    # 现在处理实际的换行符（字符码 10）
    # 按行分割（不使用正则表达式）
    lines: List[str] = []
    current_line = ''
    i = 0
    while i < len(protected_text):
        char = protected_text[i]
        if char == '\n' or (char == '\r' and i + 1 < len(protected_text) and protected_text[i + 1] == '\n'):
            lines.append(current_line)
            current_line = ''
            if char == '\r' and i + 1 < len(protected_text) and protected_text[i + 1] == '\n':
                i += 1  # 跳过 \n
        else:
            current_line += char
        i += 1
    
    if current_line:
        lines.append(current_line)
    
    processed_lines = []
    for line in lines:
        # 恢复转义序列字面量
        for index, literal in enumerate(literal_newlines):
            placeholder = f'{literal_newline_placeholder}_{index}__'
            line = line.replace(placeholder, literal)
        
        # 计算前导空格数（不使用 lstrip）
        leading_spaces = 0
        for char in line:
            if char in [' ', '\t']:
                leading_spaces += 1
            else:
                break
        
        # 处理前导空格
        processed_line = '&nbsp;' * leading_spaces + line[leading_spaces:]
        
        # 处理行内的其他空格（不使用正则表达式）
        processed_line = processed_line.replace(' ', '&nbsp;')
        
        processed_lines.append(processed_line)
    
    # 重新组合，行间用 <br> 连接
    return '<br>'.join(processed_lines)
