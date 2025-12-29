#!/usr/bin/env node

/**
 * 测试HTML lang属性修复的脚本
 * 验证所有语言的页面HTML lang属性是否正确设置
 */

const languages = [
  { code: 'en', expected: 'en', dir: 'ltr', name: '英语' },
  { code: 'zh', expected: 'zh', dir: 'ltr', name: '简体中文' },
  { code: 'zh-tw', expected: 'zh-TW', dir: 'ltr', name: '繁体中文' },
  { code: 'es', expected: 'es', dir: 'ltr', name: '西班牙语' },
  { code: 'ja', expected: 'ja', dir: 'ltr', name: '日语' },
  { code: 'fr', expected: 'fr', dir: 'ltr', name: '法语' },
  { code: 'de', expected: 'de', dir: 'ltr', name: '德语' },
  { code: 'ko', expected: 'ko', dir: 'ltr', name: '韩语' },
  { code: 'ar', expected: 'ar', dir: 'rtl', name: '阿拉伯语' },
  { code: 'pt', expected: 'pt', dir: 'ltr', name: '葡萄牙语' },
  { code: 'ru', expected: 'ru', dir: 'ltr', name: '俄语' },
  { code: 'hi', expected: 'hi', dir: 'ltr', name: '印地语' },
  { code: 'it', expected: 'it', dir: 'ltr', name: '意大利语' },
  { code: 'tr', expected: 'tr', dir: 'ltr', name: '土耳其语' },
  { code: 'uk', expected: 'uk', dir: 'ltr', name: '乌克兰语' },
  { code: 'sv', expected: 'sv', dir: 'ltr', name: '瑞典语' },
  { code: 'ro', expected: 'ro', dir: 'ltr', name: '罗马尼亚语' },
  { code: 'da', expected: 'da', dir: 'ltr', name: '丹麦语' },
  { code: 'nl', expected: 'nl', dir: 'ltr', name: '荷兰语' },
  { code: 'bn', expected: 'bn', dir: 'ltr', name: '孟加拉语' },
  { code: 'no', expected: 'no', dir: 'ltr', name: '挪威语' },
  { code: 'fi', expected: 'fi', dir: 'ltr', name: '芬兰语' },
  { code: 'pl', expected: 'pl', dir: 'ltr', name: '波兰语' },
  { code: 'el', expected: 'el', dir: 'ltr', name: '希腊语' },
  { code: 'he', expected: 'he', dir: 'rtl', name: '希伯来语' },
  { code: 'cs', expected: 'cs', dir: 'ltr', name: '捷克语' },
  { code: 'is', expected: 'is', dir: 'ltr', name: '冰岛语' },
  { code: 'hu', expected: 'hu', dir: 'ltr', name: '匈牙利语' },
];

const pages = ['/', '/pricing', '/upload'];

const BASE_URL = 'https://removehandwriting.com';

async function checkPage(lang, page) {
  const langPath = lang.code === 'en' ? '' : `/${lang.code}`;
  const url = `${BASE_URL}${langPath}${page}`;
  
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
    
    // 提取HTML lang和dir属性
    const htmlLangMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const htmlDirMatch = html.match(/<html[^>]*dir=["']([^"']+)["']/i);
    
    const actualLang = htmlLangMatch ? htmlLangMatch[1] : '未找到';
    const actualDir = htmlDirMatch ? htmlDirMatch[1] : '未找到';
    
    const langCorrect = actualLang === lang.expected;
    const dirCorrect = actualDir === lang.dir;
    
    return {
      url,
      status: 'ok',
      expectedLang: lang.expected,
      actualLang,
      expectedDir: lang.dir,
      actualDir,
      langCorrect,
      dirCorrect,
      allCorrect: langCorrect && dirCorrect,
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('HTML lang属性修复验证测试');
  console.log('='.repeat(80));
  console.log(`\n测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`测试范围: ${languages.length}种语言 × ${pages.length}个页面 = ${languages.length * pages.length}个测试\n`);
  
  const results = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const lang of languages) {
    for (const page of pages) {
      totalTests++;
      console.log(`测试: ${lang.name} (${lang.code}) - ${page}...`);
      const result = await checkPage(lang, page);
      results.push({ lang, page, ...result });
      
      if (result.status === 'ok') {
        if (result.allCorrect) {
          passedTests++;
          console.log(`  ✅ 通过: lang="${result.actualLang}" dir="${result.actualDir}"`);
        } else {
          failedTests++;
          console.log(`  ❌ 失败:`);
          if (!result.langCorrect) {
            console.log(`     lang: 期望 "${result.expectedLang}", 实际 "${result.actualLang}"`);
          }
          if (!result.dirCorrect) {
            console.log(`     dir: 期望 "${result.expectedDir}", 实际 "${result.actualDir}"`);
          }
        }
      } else {
        failedTests++;
        console.log(`  ❌ 错误: ${result.error}`);
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('测试结果汇总');
  console.log('='.repeat(80));
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`失败: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
  
  // 显示失败的测试
  const failed = results.filter(r => r.status === 'ok' && !r.allCorrect);
  if (failed.length > 0) {
    console.log('\n失败的测试:');
    failed.forEach(({ lang, page, url, expectedLang, actualLang, expectedDir, actualDir }) => {
      console.log(`  ${lang.name} (${lang.code}) - ${page}`);
      console.log(`    URL: ${url}`);
      if (actualLang !== expectedLang) {
        console.log(`    lang: 期望 "${expectedLang}", 实际 "${actualLang}"`);
      }
      if (actualDir !== expectedDir) {
        console.log(`    dir: 期望 "${expectedDir}", 实际 "${actualDir}"`);
      }
    });
  }
  
  // 特别检查zh-tw和RTL语言
  console.log('\n' + '='.repeat(80));
  console.log('特殊语言检查');
  console.log('='.repeat(80));
  
  const zhTwResults = results.filter(r => r.lang.code === 'zh-tw');
  const rtlResults = results.filter(r => r.lang.dir === 'rtl');
  
  console.log('\n繁体中文 (zh-tw → zh-TW):');
  zhTwResults.forEach(({ page, langCorrect, actualLang }) => {
    const status = langCorrect ? '✅' : '❌';
    console.log(`  ${status} ${page}: ${actualLang}`);
  });
  
  console.log('\nRTL语言 (dir="rtl"):');
  rtlResults.forEach(({ lang, page, dirCorrect, actualDir }) => {
    const status = dirCorrect ? '✅' : '❌';
    console.log(`  ${status} ${lang.name} (${lang.code}) - ${page}: ${actualDir}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('测试完成');
  console.log('='.repeat(80));
  
  return { totalTests, passedTests, failedTests, results };
}

runTests().catch(console.error);
