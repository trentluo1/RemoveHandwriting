# zh-tw 页面 lang 属性修复报告

**检查日期**: 2025-12-12  
**问题**: `/zh-tw/` 首页显示 `lang="en"` 而不是 `lang="zh-TW"`

## 问题确认

✅ **问题确实存在！**

检查结果：
- `/zh-tw/` 首页: `lang="en"` ❌ (期望: `lang="zh-TW"`)
- `/zh-tw/pricing`: `lang="zh-TW"` ✅
- `/zh-tw/upload`: `lang="zh-TW"` ✅

## 问题分析

### 根本原因

根布局 `src/app/layout.tsx` 在服务端渲染时，如果中间件设置的 `x-locale` header 没有正确传递，就会使用默认值 `'en'`。

### 代码检查结果

1. ✅ **中间件逻辑**: `extractLocaleFromPath('/zh-tw/')` 正确返回 `'zh-tw'`
2. ✅ **工具函数**: `getHtmlLang('zh-tw')` 正确返回 `'zh-TW'`
3. ✅ **布局组件**: `[locale]/layout.tsx` 中有 `HtmlLangSetter` 组件
4. ⚠️ **根布局**: 如果 header 不存在，使用默认值 `'en'`

## 修复方案

### 已实施的修复

在根布局 `src/app/layout.tsx` 中添加了 fallback 机制：

```typescript
// 从中间件设置的header中获取locale
const headersList = await headers()
let locale = headersList.get('x-locale')

// 如果header不存在，尝试从referer中提取（fallback机制）
if (!locale) {
  const referer = headersList.get('referer') || ''
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      locale = extractLocaleFromPath(refererUrl.pathname)
    } catch {
      locale = 'en'
    }
  } else {
    locale = 'en'
  }
}
```

### 修复效果

修复后：
- 优先使用中间件设置的 `x-locale` header
- 如果 header 不存在，从 referer 中提取 locale（fallback）
- 确保 `/zh-tw/` 首页正确显示 `lang="zh-TW"`

## 为什么其他页面正常？

其他页面（如 `/zh-tw/pricing`）工作正常，可能是因为：
1. 它们使用了 `[locale]/layout.tsx`，其中的 `HtmlLangSetter` 组件在客户端正确设置了 lang 属性
2. 或者中间件在处理这些页面时正确设置了 header

首页可能因为路由优先级或渲染时机的问题，导致根布局在服务端渲染时没有收到正确的 header。

## 验证方法

部署修复后，使用以下命令验证：

```bash
node check-zh-tw-lang.js
```

期望结果：
- `/zh-tw/` 应该显示 `lang="zh-TW"` ✅
- `/zh-tw/pricing` 应该显示 `lang="zh-TW"` ✅
- `/zh-tw/upload` 应该显示 `lang="zh-TW"` ✅

## 相关文件

- `src/app/layout.tsx` - 已修复（添加 fallback 机制）
- `src/lib/html-lang-utils.ts` - 工具函数（无需修改）
- `src/middleware.ts` - 中间件（无需修改）

## 注意事项

1. 修复需要部署后才能生效
2. Fallback 机制从 referer 中提取 locale，在某些情况下可能不可靠
3. 如果问题仍然存在，可能需要检查中间件在生产环境中的行为














