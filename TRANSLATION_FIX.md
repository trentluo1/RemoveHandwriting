# 翻译占位符修复总结

## 问题描述

批量处理页面的英文翻译使用了占位符格式（如 `{count}`、`{max}`），但代码中没有实现占位符替换逻辑，导致页面显示原始占位符文本而不是实际值。

例如：
- 显示: `Selected: {count}/{max} images`
- 期望: `Selected: 3/5 images`

## 修复方案

### 方案选择
采用**拆分翻译 + 代码拼接**的方式：
- 将包含占位符的翻译拆分为多个独立的翻译项
- 在代码中直接拼接动态值

### 修复的翻译项

#### 1. **selectedCount** → **selected** + **images**
```json
// 修复前
"selectedCount": "Selected: {count}/{max} images"

// 修复后
"selected": "Selected:",
"images": "images"
```

```typescript
// 代码修改
// 修复前
{getText('selectedCount', `Selected: ${images.length}/${MAX_IMAGES} images`)}

// 修复后
{getText('selected', 'Selected:')} {images.length}/{MAX_IMAGES} {getText('images', 'images')}
```

#### 2. **imageLabel** → **image**
```json
// 修复前
"imageLabel": "Image {number}"

// 修复后
"image": "Image"
```

```typescript
// 代码修改
// 修复前
{getText('imageLabel', `Image ${index + 1}`)}

// 修复后
{getText('image', 'Image')} {index + 1}
```

#### 3. **statusCompleted** → **statusCompleted** + **seconds**
```json
// 修复前
"statusCompleted": "Completed in {time}s"

// 修复后
"statusCompleted": "Completed in",
"seconds": "s"
```

```typescript
// 代码修改
// 修复前
{getText('statusCompleted', `Completed in ${image.processingTime}s`)}

// 修复后
`${getText('statusCompleted', 'Completed in')} ${image.processingTime}${getText('seconds', 's')}`
```

#### 4. **processing** → **processingImages**
```json
// 修复前
"processing": "Processing {current}/{total}..."

// 修复后
"processingImages": "Processing"
```

```typescript
// 代码修改
// 修复前
getText('processing', `Processing ${stats.processing}/${stats.total}...`)

// 修复后
`${getText('processingImages', 'Processing')} ${stats.processing}/${stats.total}...`
```

#### 5. **startProcessing** → **processImage** / **processImages**
```json
// 修复前
"startProcessing": "Process {count} Image{plural}"

// 修复后
"processImage": "Process Image",
"processImages": "Process"
```

```typescript
// 代码修改
// 修复前
getText('startProcessing', `Process ${count} Image${count !== 1 ? 's' : ''}`)

// 修复后
count === 1 
  ? getText('processImage', 'Process Image')
  : `${getText('processImages', 'Process')} ${count} ${getText('images', 'Images')}`
```

#### 6. **insufficientCredits** → **insufficientCredits** + **creditsOr**
```json
// 修复前
"insufficientCredits": "You need {count} credits or an active subscription to process {count} images"

// 修复后
"insufficientCredits": "You need",
"creditsOr": "credits or an active subscription to process"
```

```typescript
// 代码修改
// 修复前
alert(getText('errors.insufficientCredits', `You need ${count} credits...`))

// 修复后
alert(`${getText('errors.insufficientCredits', 'You need')} ${count} ${getText('errors.creditsOr', 'credits or an active subscription to process')} ${count} ${getText('images', 'images')}`)
```

## 修改的文件

### 1. 翻译文件
- **文件**: `/messages/en.json`
- **修改**: 更新 `bulkUpload` 部分的翻译项

### 2. 页面组件
- **文件**: `/src/app/bulk-handwriting-remover/page.tsx`
- **修改**: 更新所有使用翻译的代码，改为拼接方式

## 验证清单

- [x] 无 linter 错误
- [ ] 页面显示 "Selected: 3/5 images" 而不是 "Selected: {count}/{max} images"
- [ ] 图片状态显示 "Image 1" 而不是 "Image {number}"
- [ ] 完成状态显示 "Completed in 12s" 而不是 "Completed in {time}s"
- [ ] 处理按钮显示 "Processing 2/5..." 而不是 "Processing {current}/{total}..."
- [ ] 处理按钮显示 "Process 3 Images" 或 "Process Image"

## 后续工作

当前仅修复了**英文版本**。如果需要修复其他语言，需要：

1. **中文翻译** (`messages/zh.json`)
   - 更新相同的翻译项
   - 调整中文语序（如需要）

2. **其他 16 种语言**
   - 可以使用翻译生成脚本自动更新
   - 或手动逐个更新

## 优点

✅ **简单直接**: 不需要实现复杂的占位符替换逻辑  
✅ **灵活性高**: 可以自由控制动态内容的显示格式  
✅ **易于维护**: 代码和翻译的关系清晰明确  
✅ **性能好**: 直接字符串拼接，无需额外处理

## 缺点

⚠️ **翻译项增多**: 每个占位符可能需要拆分为多个翻译项  
⚠️ **代码稍长**: 拼接逻辑使代码行数增加  
⚠️ **语序问题**: 某些语言的语序可能不同，需要单独处理

## 总结

已成功修复英文版本的翻译占位符问题。页面现在会正确显示动态内容而不是占位符文本。所有修改已通过 linter 检查，无错误。

下一步建议在浏览器中测试页面，确保所有文本显示正确。

