#!/usr/bin/env node

/**
 * 随机检查页面SEO信息和翻译的脚本
 */

const pages = [
  { path: '/', name: '首页' },
  { path: '/pricing', name: '定价页' },
  { path: '/image-handwriting-remover', name: '上传页' },
  { path: '/blog', name: '博客列表' },
  { path: '/api-doc', name: 'API文档' },
  { path: '/about-us', name: '关于我们' },
  { path: '/help', name: '帮助中心' },
  { path: '/contact-us', name: '联系我们' },
  { path: '/privacy-policy', name: '隐私政策' },
  { path: '/terms-conditions', name: '服务条款' },
  { path: '/refund-policy', name: '退款政策' },
  { path: '/bulk-handwriting-remover', name: '批量处理' },
  { path: '/pdf-handwriting-remover', name: 'PDF处理' },
  { path: '/download', name: '下载页' },
];

const languages = [
  { code: 'en', name: '英语' },
  { code: 'zh', name: '简体中文' },
  { code: 'zh-tw', name: '繁体中文' },
  { code: 'es', name: '西班牙语' },
  { code: 'ja', name: '日语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'ko', name: '韩语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'ru', name: '俄语' },
  { code: 'hi', name: '印地语' },
  { code: 'it', name: '意大利语' },
  { code: 'tr', name: '土耳其语' },
  { code: 'uk', name: '乌克兰语' },
  { code: 'sv', name: '瑞典语' },
  { code: 'ro', name: '罗马尼亚语' },
  { code: 'da', name: '丹麦语' },
  { code: 'nl', name: '荷兰语' },
  { code: 'bn', name: '孟加拉语' },
  { code: 'no', name: '挪威语' },
  { code: 'fi', name: '芬兰语' },
  { code: 'pl', name: '波兰语' },
  { code: 'el', name: '希腊语' },
  { code: 'he', name: '希伯来语' },
  { code: 'cs', name: '捷克语' },
  { code: 'is', name: '冰岛语' },
  { code: 'hu', name: '匈牙利语' },
];

// 随机选择5个页面和5种语言
function randomSelect(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const selectedPages = randomSelect(pages, 5);
const selectedLanguages = randomSelect(languages, 5);

console.log('='.repeat(80));
console.log('随机SEO和翻译检查报告');
console.log('='.repeat(80));
console.log(`\n检查时间: ${new Date().toLocaleString('zh-CN')}`);
console.log(`\n选择的页面 (${selectedPages.length}个):`);
selectedPages.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.path})`));
console.log(`\n选择的语言 (${selectedLanguages.length}种):`);
selectedLanguages.forEach((l, i) => console.log(`  ${i + 1}. ${l.name} (${l.code})`));
console.log('\n' + '='.repeat(80) + '\n');

const BASE_URL = 'https://removehandwriting.com';

async function checkPage(lang, page) {
  const langPath = lang.code === 'en' ? '' : `/${lang.code}`;
  const url = `${BASE_URL}${langPath}${page.path}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        url,
        status: 'error',
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    
    // 提取SEO信息
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const ogLocaleMatch = html.match(/<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']+)["']/i);
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    
    // 检查翻译 - 查找一些关键元素
    const hasNav = html.includes('nav') || html.includes('navigation');
    const hasContent = html.length > 10000; // 基本内容检查
    
    return {
      url,
      status: 'ok',
      seo: {
        title: titleMatch ? titleMatch[1] : '未找到',
        description: descMatch ? descMatch[1] : '未找到',
        ogTitle: ogTitleMatch ? ogTitleMatch[1] : '未找到',
        ogDescription: ogDescMatch ? ogDescMatch[1] : '未找到',
        ogLocale: ogLocaleMatch ? ogLocaleMatch[1] : '未找到',
        htmlLang: langMatch ? langMatch[1] : '未找到',
      },
      translation: {
        hasNav,
        hasContent,
        contentLength: html.length,
      },
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      error: error.message,
    };
  }
}

async function runChecks() {
  const results = [];
  
  for (const lang of selectedLanguages) {
    for (const page of selectedPages) {
      console.log(`检查: ${lang.name} - ${page.name}...`);
      const result = await checkPage(lang, page);
      results.push({
        language: lang,
        page: page,
        ...result,
      });
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // 生成报告
  console.log('\n' + '='.repeat(80));
  console.log('检查结果报告');
  console.log('='.repeat(80) + '\n');
  
  for (const result of results) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`页面: ${result.page.name} | 语言: ${result.language.name} (${result.language.code})`);
    console.log(`URL: ${result.url}`);
    
    if (result.status === 'error') {
      console.log(`❌ 错误: ${result.error}`);
      continue;
    }
    
    console.log('\n📊 SEO信息:');
    console.log(`  Title: ${result.seo.title}`);
    console.log(`  Description: ${result.seo.description.substring(0, 100)}${result.seo.description.length > 100 ? '...' : ''}`);
    console.log(`  OG Title: ${result.seo.ogTitle}`);
    console.log(`  OG Description: ${result.seo.ogDescription.substring(0, 100)}${result.seo.ogDescription.length > 100 ? '...' : ''}`);
    console.log(`  OG Locale: ${result.seo.ogLocale}`);
    console.log(`  HTML Lang: ${result.seo.htmlLang}`);
    
    // SEO检查
    const seoIssues = [];
    if (result.seo.title === '未找到') seoIssues.push('缺少Title');
    if (result.seo.description === '未找到') seoIssues.push('缺少Description');
    if (result.seo.ogTitle === '未找到') seoIssues.push('缺少OG Title');
    if (result.seo.ogDescription === '未找到') seoIssues.push('缺少OG Description');
    
    // 语言检查
    const expectedLang = result.language.code === 'zh-tw' ? 'zh-TW' : result.language.code;
    if (result.seo.htmlLang !== expectedLang && result.seo.htmlLang !== '未找到') {
      seoIssues.push(`HTML lang属性不匹配 (期望: ${expectedLang}, 实际: ${result.seo.htmlLang})`);
    }
    
    console.log('\n🌐 翻译信息:');
    console.log(`  内容长度: ${result.translation.contentLength} 字符`);
    console.log(`  包含导航: ${result.translation.hasNav ? '✅' : '❌'}`);
    console.log(`  包含内容: ${result.translation.hasContent ? '✅' : '❌'}`);
    
    if (seoIssues.length > 0) {
      console.log('\n⚠️  SEO问题:');
      seoIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ SEO信息完整');
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('检查完成');
  console.log('='.repeat(80));
}

runChecks().catch(console.error);
