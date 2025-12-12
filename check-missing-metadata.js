#!/usr/bin/env node

/**
 * 检查图片中描述的元数据缺失问题
 * 验证6个语言版本的首页是否缺少title, description, lang, canonical
 */

const pages = [
  { path: '/es/', name: '西班牙语', locale: 'es' },
  { path: '/zh/', name: '简体中文', locale: 'zh' },
  { path: '/ru/', name: '俄语', locale: 'ru' },
  { path: '/pt/', name: '葡萄牙语', locale: 'pt' },
  { path: '/ar/', name: '阿拉伯语', locale: 'ar' },
  { path: '/ja/', name: '日语', locale: 'ja' },
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
        status: 'error',
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    
    // 检查各种元数据
    const checks = {
      title: {
        found: /<title[^>]*>([^<]+)<\/title>/i.test(html),
        value: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || null,
        expected: '应该有title标签'
      },
      description: {
        found: /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i.test(html),
        value: html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || null,
        expected: '应该有description meta标签'
      },
      lang: {
        found: /<html[^>]*lang=["']([^"']+)["']/i.test(html),
        value: html.match(/<html[^>]*lang=["']([^"']+)["']/i)?.[1] || null,
        expected: page.locale === 'zh-tw' ? 'zh-TW' : page.locale
      },
      canonical: {
        found: /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.test(html),
        value: html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || null,
        expected: url
      },
      dir: {
        found: /<html[^>]*dir=["']([^"']+)["']/i.test(html),
        value: html.match(/<html[^>]*dir=["']([^"']+)["']/i)?.[1] || null,
        expected: page.locale === 'ar' ? 'rtl' : 'ltr',
        required: page.locale === 'ar' // 只有阿拉伯语需要检查dir
      }
    };
    
    const missing = [];
    const issues = [];
    
    if (!checks.title.found) missing.push('title');
    if (!checks.description.found) missing.push('description');
    if (!checks.lang.found) missing.push('lang');
    if (!checks.canonical.found) missing.push('canonical');
    if (checks.dir.required && !checks.dir.found) missing.push('RTL (dir)');
    
    // 检查值是否正确
    if (checks.lang.found && checks.lang.value !== checks.lang.expected) {
      issues.push(`lang值不正确: 期望 "${checks.lang.expected}", 实际 "${checks.lang.value}"`);
    }
    if (checks.dir.required && checks.dir.found && checks.dir.value !== checks.dir.expected) {
      issues.push(`dir值不正确: 期望 "${checks.dir.expected}", 实际 "${checks.dir.value}"`);
    }
    
    return {
      url,
      status: 'ok',
      page: page.name,
      checks,
      missing,
      issues,
      hasProblems: missing.length > 0 || issues.length > 0
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
  console.log('检查首页变体元数据缺失问题');
  console.log('='.repeat(80));
  console.log(`\n检查时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`检查范围: ${pages.length}个语言版本的首页\n`);
  
  const results = [];
  
  for (const page of pages) {
    console.log(`检查: ${page.name} (${page.locale})...`);
    const result = await checkPage(page);
    results.push(result);
    
    if (result.status === 'error') {
      console.log(`  ❌ 错误: ${result.error}\n`);
    } else if (result.hasProblems) {
      console.log(`  ❌ 发现问题:`);
      if (result.missing.length > 0) {
        console.log(`     缺少: ${result.missing.join(', ')}`);
      }
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`     ${issue}`));
      }
      console.log('');
    } else {
      console.log(`  ✅ 通过: 所有元数据完整且正确\n`);
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
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`\n总检查数: ${results.length}`);
  console.log(`✅ 通过: ${passed.length}`);
  console.log(`❌ 有问题: ${problems.length}`);
  console.log(`⚠️  错误: ${errors.length}`);
  
  if (problems.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('问题详情');
    console.log('='.repeat(80));
    
    problems.forEach(({ page, url, missing, issues, checks }) => {
      console.log(`\n${page} (${url}):`);
      if (missing.length > 0) {
        console.log(`  缺少: ${missing.join(', ')}`);
      }
      if (issues.length > 0) {
        issues.forEach(issue => console.log(`  ${issue}`));
      }
      console.log(`  当前值:`);
      if (checks.title.found) console.log(`    title: ${checks.title.value?.substring(0, 60)}...`);
      if (checks.description.found) console.log(`    description: ${checks.description.value?.substring(0, 60)}...`);
      if (checks.lang.found) console.log(`    lang: ${checks.lang.value}`);
      if (checks.canonical.found) console.log(`    canonical: ${checks.canonical.value}`);
      if (checks.dir.found) console.log(`    dir: ${checks.dir.value}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('检查完成');
  console.log('='.repeat(80));
  
  // 与图片中的报告对比
  if (problems.length > 0) {
    console.log('\n⚠️  确认: 图片中描述的问题确实存在！');
    console.log('   需要检查代码实现或部署状态。');
  } else {
    console.log('\n✅ 确认: 图片中描述的问题已解决或不存在。');
  }
}

runChecks().catch(console.error);
