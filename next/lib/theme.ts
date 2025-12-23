import fs from "fs";
import path from "path";

type ThemeConfig = any;

// 始终固定读取 Next.js 项目（next 目录）下的 theme，而不是外层 FastAPI 项目的 theme
const THEME_DIR = path.join(__dirname, "..", "theme");

// 缓存主题配置
const themeConfigCache: Record<string, ThemeConfig> = {};
const themeStyleCache: Record<string, string> = {};
const customCssCache: Record<string, string> = {};

export function listThemeNames(): string[] {
  if (!fs.existsSync(THEME_DIR)) {
    return [];
  }

  const files = fs.readdirSync(THEME_DIR, { withFileTypes: true });
  const names = files
    .filter((f) => f.isFile() && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/i, ""))
    .sort();

  return names;
}

export function getDefaultThemeName(): string | null {
  const names = listThemeNames();
  return names.length > 0 ? names[0] : null;
}

function getThemePath(themeName: string): string {
  return path.join(THEME_DIR, `${themeName}.json`);
}

function loadThemeConfig(themeName: string): ThemeConfig {
  if (themeName in themeConfigCache) {
    return themeConfigCache[themeName];
  }

  const themePath = getThemePath(themeName);
  if (!fs.existsSync(themePath)) {
    throw new Error(`主题配置文件不存在: ${themePath}`);
  }

  const content = fs.readFileSync(themePath, "utf-8");
  const config = JSON.parse(content);
  themeConfigCache[themeName] = config;
  return config;
}

export function getThemeStyle(themeName: string): string {
  if (themeName in themeStyleCache) {
    return themeStyleCache[themeName];
  }

  const config = loadThemeConfig(themeName);
  const style = config?.data?.style ?? "";
  themeStyleCache[themeName] = style;
  return style;
}

export function getCustomCss(themeName: string): string {
  if (themeName in customCssCache) {
    return customCssCache[themeName];
  }

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

  customCssCache[themeName] = customCss || "";
  return customCssCache[themeName];
}


