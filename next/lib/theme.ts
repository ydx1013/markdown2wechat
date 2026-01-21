/**
 * 适配 Cloudflare Pages Edge Runtime 的主题管理
 * 移除了 fs 和 path 依赖，改为静态导入
 */

// 1. 手动导入所有主题文件（根据您 theme 目录下的实际文件名添加）
// 注意：如果主题很多，建议将常用的列在这里
import Obsidian from "../theme/Obsidian.json";
import Pornhub黄 from "../theme/Pornhub黄.json";
import WeFormat from "../theme/WeFormat.json";
import 丘比特忙 from "../theme/丘比特忙.json";
import 全栈蓝 from "../theme/全栈蓝.json";
import 兰青 from "../theme/兰青.json";
import 凝夜紫 from "../theme/凝夜紫.json";
import 前端之巅同款 from "../theme/前端之巅同款.json";
import 奇点 from "../theme/奇点.json";
import 姹紫 from "../theme/姹紫.json";
import 嫩青 from "../theme/嫩青.json";
import 山吹 from "../theme/山吹.json";
import 极客黑 from "../theme/极客黑.json";
import 极简黑 from "../theme/极简黑.json";
import 柠檬黄 from "../theme/柠檬黄.json";
import 橙心 from "../theme/橙心.json";
import 橙蓝风 from "../theme/橙蓝风.json";
import 灵动蓝 from "../theme/灵动蓝.json";
import 科技蓝 from "../theme/科技蓝.json";
import 简 from "../theme/简.json";
import 红绯 from "../theme/红绯.json";
import 绿意 from "../theme/绿意.json";
import 草原绿 from "../theme/草原绿.json";
import 萌粉 from "../theme/萌粉.json";
import 萌绿 from "../theme/萌绿.json";
import 蓝莹 from "../theme/蓝莹.json";
import 蔷薇紫 from "../theme/蔷薇紫.json";
import 重影 from "../theme/重影.json";
import 锤子便签主题第2版 from "../theme/锤子便签主题第2版.json";
import 雁栖湖 from "../theme/雁栖湖.json";

// 2. 建立名称与配置的映射表
const themesMap: Record<string, any> = {
  Obsidian, "Pornhub黄": Pornhub黄, WeFormat, "丘比特忙": 丘比特忙, 
  "全栈蓝": 全栈蓝, "兰青": 兰青, "凝夜紫": 凝夜紫, "前端之巅同款": 前端之巅同款,
  "奇点": 奇点, "姹紫": 姹紫, "嫩青": 嫩青, "山吹": 山吹, 
  "极客黑": 极客黑, "极简黑": 极简黑, "柠檬黄": 柠檬黄, "橙心": 橙心, 
  "橙蓝风": 橙蓝风, "灵动蓝": 灵动蓝, "科技蓝": 科技蓝, "简": 简, 
  "红绯": 红绯, "绿意": 绿意, "草原绿": 草原绿, "萌粉": 萌粉, 
  "萌绿": 萌绿, "蓝莹": 蓝莹, "蔷薇紫": 蔷薇紫, "重影": 重影, 
  "锤子便签主题第2版": 锤子便签主题第2版, "雁栖湖": 雁栖湖
};

export function listThemeNames(): string[] {
  return Object.keys(themesMap).sort();
}

export function getDefaultThemeName(): string {
  return themesMap["兰青"] ? "兰青" : listThemeNames()[0];
}

function loadThemeConfig(themeName: string): any {
  const config = themesMap[themeName];
  if (!config) {
    throw new Error(`主题配置不存在: ${themeName}`);
  }
  return config;
}

export function getThemeStyle(themeName: string): string {
  const config = loadThemeConfig(themeName);
  return config?.data?.style ?? "";
}

export function getCustomCss(themeName: string): string {
  const config = loadThemeConfig(themeName);
  const styleModelList: any[] = config?.data?.styleModelList ?? [];

  let customCss = "";
  for (const model of styleModelList) {
    if (model?.id === "customStyle") {
      const styles: any[] = model.styles ?? [];
      for (const styleItem of styles) {
        if (styleItem?.id === "customCss") {
          customCss = styleItem.value ?? "";
          break;
        }
      }
      break;
    }
  }
  return customCss || "";
}
