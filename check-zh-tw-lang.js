#!/usr/bin/env node

/**
 * 检查 zh-tw 页面的 lang 属性是否正确
 */

const BASE_URL = 'https://removehandwriting.com';
const testPages = [
  '/zh-tw/',
  '/zh-tw/pricing',
  '/zh-tw/upload',
];

async function checkPage(path) {
  const url = `${BASE_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Checker/1.0)'
      }
    });
    
    if (!response.ok) {
      return {
        url,
        status: 'error',
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    
    // 提取HTML lang属性
    const htmlLangMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const htmlDirMatch = html.match(/<html[^>]*dir=["']([^"']+)["']/i);
    
    const langValue = htmlLangMatch ? htmlLangMatch[1] : 'NOT FOUND';
    const dirValue = htmlDirMatch ? htmlDirMatch[1] : 'NOT FOUND';
    const expectedLang = 'zh-TW';
    const expectedDir = 'ltr';
    
    const langCorrect = langValue === expectedLang;
    const dirCorrect = dirValue === expectedDir;
    
    return {
      url,
      status: 'ok',
      langValue,
      expectedLang,
      langCorrect,
      dirValue,
      expectedDir,
      dirCorrect,
      hasProblem: !langCorrect || !dirCorrect
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      error: error.message,
    };
  }
}

async function runCheck() {
  console.log('='.repeat(80));
  console.log('检查 zh-tw 页面 lang 属性');
  console.log('='.repeat(80));
  console.log(`\n检查时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`期望值: lang="zh-TW" (不是 "en")\n`);
  
  const results = [];
  
  for (const path of testPages) {
    console.log(`检查: ${path}...`);
    const result = await checkPage(path);
    results.push(result);
    
    if (result.status === 'error') {
      console.log(`  ❌ 错误: ${result.error}\n`);
    } else if (result.hasProblem) {
      console.log(`  ❌ 发现问题:`);
      if (!result.langCorrect) {
        console.log(`    Lang属性: "${result.langValue}" (期望: "${result.expectedLang}")`);
        if (result.langValue === 'en') {
          console.log(`    ⚠️  确认问题: 显示 lang="en" 而不是 lang="zh-TW"`);
        }
      }
      if (!result.dirCorrect) {
        console.log(`    Dir属性: "${result.dirValue}" (期望: "${result.expectedDir}")`);
      }
      console.log('');
    } else {
      console.log(`  ✅ 通过: lang="${result.langValue}" ✅\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // 汇总
  console.log('='.repeat(80));
  console.log('检查结果汇总');
  console.log('='.repeat(80));
  
  const problems = results.filter(r => r.status === 'ok' && r.hasProblem);
  const passed = results.filter(r => r.status === 'ok' && !r.hasProblem);
  
  console.log(`\n总检查数: ${results.length}`);
  console.log(`✅ 通过: ${passed.length}`);
  console.log(`❌ 有问题: ${problems.length}`);
  
  if (problems.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('问题详情');
    console.log('='.repeat(80));
    
    problems.forEach(({ url, langValue, expectedLang }) => {
      console.log(`\n${url}:`);
      console.log(`  实际: lang="${langValue}"`);
      console.log(`  期望: lang="${expectedLang}"`);
      if (langValue === 'en') {
        console.log(`  ⚠️  确认: 问题存在！显示 lang="en" 而不是 lang="zh-TW"`);
      }
    });
    
    console.log('\n⚠️  确认: 问题确实存在！');
    console.log('   需要检查代码实现，确保 zh-tw 正确转换为 zh-TW');
  } else {
    console.log('\n✅ 确认: 问题不存在，所有页面 lang 属性正确。');
  }
  
  console.log('\n' + '='.repeat(80));
}

runCheck().catch(console.error);
















