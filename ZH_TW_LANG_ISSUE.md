# zh-tw 页面 lang 属性问题报告

**检查日期**: 2025-12-12  
**问题**: `/zh-tw/` 首页显示 `lang="en"` 而不是 `lang="zh-TW"`

## 问题确认

✅ **问题确实存在！**

检查结果：
- `/zh-tw/` 首页: `lang="en"` ❌ (期望: `lang="zh-TW"`)
- `/zh-tw/pricing`: `lang="zh-TW"` ✅
- `/zh-tw/upload`: `lang="zh-TW"` ✅

## 问题分析

### 可能的原因

1. **根布局问题**: 根布局 `src/app/layout.tsx` 在服务端渲染时，可能没有正确读取中间件设置的 `x-locale` header
2. **中间件header传递**: 中间件可能在某些情况下没有正确设置或传递 `x-locale` header
3. **路由优先级**: `/zh-tw/` 可能使用了不同的路由处理逻辑

### 代码检查

1. **中间件逻辑**: ✅ `extractLocaleFromPath('/zh-tw/')` 正确返回 `'zh-tw'`
2. **工具函数**: ✅ `getHtmlLang('zh-tw')` 正确返回 `'zh-TW'`
3. **布局组件**: ✅ `[locale]/layout.tsx` 中有 `HtmlLangSetter` 组件

### 问题定位

根布局 `src/app/layout.tsx` 在服务端渲染时：
```typescript
const locale = headersList.get('x-locale') || 'en'  // 如果header不存在，默认为'en'
```

如果中间件的 `x-locale` header 没有正确传递到根布局，就会使用默认值 `'en'`。

## 解决方案

### 方案1: 确保中间件正确设置header（推荐）

检查中间件在处理 `/zh-tw/` 时是否正确设置了 header。中间件代码看起来是正确的，但可能需要验证。

### 方案2: 在根布局中添加fallback逻辑

如果 header 不存在，尝试从请求路径中提取 locale。

### 方案3: 确保 [locale]/layout 正确覆盖

确保 `[locale]/layout.tsx` 中的 `HtmlLangSetter` 能正确覆盖根布局的设置。

## 建议的修复

由于其他页面（如 `/zh-tw/pricing`）工作正常，问题可能特定于首页路由。需要检查：

1. 首页是否有特殊的路由处理
2. 中间件在处理首页时是否正确设置 header
3. 根布局是否能正确读取 header

## 验证方法

部署修复后，使用以下命令验证：

```bash
node check-zh-tw-lang.js
```

期望结果：
- `/zh-tw/` 应该显示 `lang="zh-TW"` ✅






