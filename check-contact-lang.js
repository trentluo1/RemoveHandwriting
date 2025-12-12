#!/usr/bin/env node

/**
 * 检查联系页面HTML lang属性缺失问题
 * 验证图片中提到的6个联系页面是否缺少lang属性
 */

const pages = [
  { path: '/contact', name: '英语联系页', locale: 'en', expectedLang: 'en' },
  { path: '/es/contact', name: '西班牙语联系页', locale: 'es', expectedLang: 'es' },
  { path: '/zh/contact', name: '简体中文联系页', locale: 'zh', expectedLang: 'zh' },
  { path: '/ru/contact', name: '俄语联系页', locale: 'ru', expectedLang: 'ru' },
  { path: '/pt/contact', name: '葡萄牙语联系页', locale: 'pt', expectedLang: 'pt' },
  { path: '/ko/contact', name: '韩语联系页', locale: 'ko', expectedLang: 'ko' },
];

const BASE_URL = 'https://removehandwriting.com';

async function checkPage(page) {
  const url = `${BASE_URL}${page.path}`;
  
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
        finalUrl: response.url,
        status: 'error',
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    const finalUrl = response.url;
    
    // 检查HTML lang属性
    const htmlLangMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const htmlDirMatch = html.match(/<html[^>]*dir=["']([^"']+)["']/i);
    
    const hasLang = htmlLangMatch !== null;
    const langValue = htmlLangMatch ? htmlLangMatch[1] : null;
    const dirValue = htmlDirMatch ? htmlDirMatch[1] : null;
    
    // 检查是否重定向
    const isRedirect = finalUrl !== url;
    
    // 检查其他元数据
    const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
    const hasDescription = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.test(html);
    
    const langCorrect = hasLang && langValue === page.expectedLang;
    const missingLang = !hasLang;
    
    return {
      url,
      finalUrl,
      isRedirect,
      status: 'ok',
      page: page.name,
      hasLang,
      langValue,
      dirValue,
      expectedLang: page.expectedLang,
      langCorrect,
      missingLang,
      hasTitle,
      hasDescription,
      hasProblems: missingLang || !langCorrect
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
  console.log('='.repeat(80));
  console.log('检查联系页面HTML lang属性缺失问题');
  console.log('='.repeat(80));
  console.log(`\n检查时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`检查范围: ${pages.length}个联系页面\n`);
  
  const results = [];
  
  for (const page of pages) {
    console.log(`检查: ${page.name} (${page.locale})...`);
    const result = await checkPage(page);
    results.push(result);
    
    if (result.status === 'error') {
      console.log(`  ❌ 错误: ${result.error}\n`);
    } else if (result.isRedirect) {
      console.log(`  ⚠️  重定向: ${result.url} → ${result.finalUrl}`);
      if (result.hasLang) {
        console.log(`     Lang属性: ${result.langValue} ${result.langCorrect ? '✅' : '❌ (期望: ' + result.expectedLang + ')'}\n`);
      } else {
        console.log(`     Lang属性: NOT FOUND ❌\n`);
      }
    } else if (result.hasProblems) {
      console.log(`  ❌ 发现问题:`);
      if (result.missingLang) {
        console.log(`     Lang属性: NOT FOUND ❌`);
      } else if (!result.langCorrect) {
        console.log(`     Lang属性值不正确: "${result.langValue}" (期望: "${result.expectedLang}")`);
      }
      console.log('');
    } else {
      console.log(`  ✅ 通过: Lang属性="${result.langValue}" ✅\n`);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 汇总报告
  console.log('='.repeat(80));
  console.log('检查结果汇总');
  console.log('='.repeat(80));
  
  const problems = results.filter(r => r.status === 'ok' && r.hasProblems);
  const passed = results.filter(r => r.status === 'ok' && !r.hasProblems);
  const redirects = results.filter(r => r.status === 'ok' && r.isRedirect);
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`\n总检查数: ${results.length}`);
  console.log(`✅ 通过: ${passed.length}`);
  console.log(`❌ 有问题: ${problems.length}`);
  console.log(`⚠️  重定向: ${redirects.length}`);
  console.log(`⚠️  错误: ${errors.length}`);
  
  if (problems.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('问题详情');
    console.log('='.repeat(80));
    
    problems.forEach(({ page, url, finalUrl, isRedirect, missingLang, langValue, expectedLang }) => {
      console.log(`\n${page} (${url}):`);
      if (isRedirect) {
        console.log(`  重定向到: ${finalUrl}`);
      }
      if (missingLang) {
        console.log(`  ❌ Lang属性: NOT FOUND`);
      } else {
        console.log(`  ❌ Lang属性值不正确: "${langValue}" (期望: "${expectedLang}")`);
      }
    });
  }
  
  if (redirects.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('重定向页面详情');
    console.log('='.repeat(80));
    
    redirects.forEach(({ page, url, finalUrl, hasLang, langValue, langCorrect, expectedLang }) => {
      console.log(`\n${page}:`);
      console.log(`  ${url} → ${finalUrl}`);
      if (hasLang) {
        console.log(`  Lang属性: ${langValue} ${langCorrect ? '✅' : '❌ (期望: ' + expectedLang + ')'}`);
      } else {
        console.log(`  Lang属性: NOT FOUND ❌`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('检查完成');
  console.log('='.repeat(80));
  
  // 与图片中的报告对比
  if (problems.length > 0) {
    console.log('\n⚠️  确认: 图片中描述的问题确实存在！');
    console.log('   需要检查联系页面的布局实现。');
  } else {
    console.log('\n✅ 确认: 图片中描述的问题已解决或不存在。');
  }
}

runChecks().catch(console.error);
