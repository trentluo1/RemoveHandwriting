#!/usr/bin/env node

/**
 * SEO and Translation Verification Script
 * Checks multiple pages for correct SEO metadata and translations
 */

const http = require('http');

const PAGES_TO_CHECK = [
    // Spanish
    { url: 'http://localhost:3000/es/', locale: 'es', page: 'homepage' },
    { url: 'http://localhost:3000/es/pricing', locale: 'es', page: 'pricing' },
    { url: 'http://localhost:3000/es/contact-us', locale: 'es', page: 'contact' },

    // Chinese
    { url: 'http://localhost:3000/zh/', locale: 'zh', page: 'homepage' },
    { url: 'http://localhost:3000/zh/pricing', locale: 'zh', page: 'pricing' },
    { url: 'http://localhost:3000/zh/contact-us', locale: 'zh', page: 'contact' },

    // Russian
    { url: 'http://localhost:3000/ru/', locale: 'ru', page: 'homepage' },
    { url: 'http://localhost:3000/ru/pricing', locale: 'ru', page: 'pricing' },
    { url: 'http://localhost:3000/ru/contact-us', locale: 'ru', page: 'contact' },

    // English (default)
    { url: 'http://localhost:3000/', locale: 'en', page: 'homepage' },
    { url: 'http://localhost:3000/pricing', locale: 'en', page: 'pricing' },
    { url: 'http://localhost:3000/contact-us', locale: 'en', page: 'contact' },

    // Portuguese
    { url: 'http://localhost:3000/pt/', locale: 'pt', page: 'homepage' },
    { url: 'http://localhost:3000/pt/pricing', locale: 'pt', page: 'pricing' },
    { url: 'http://localhost:3000/pt/contact-us', locale: 'pt', page: 'contact' },

    // Arabic (RTL check)
    { url: 'http://localhost:3000/ar/', locale: 'ar', page: 'homepage' },
    { url: 'http://localhost:3000/ar/pricing', locale: 'ar', page: 'pricing' },
    { url: 'http://localhost:3000/ar/contact-us', locale: 'ar', page: 'contact' },

    // French
    { url: 'http://localhost:3000/fr/pricing', locale: 'fr', page: 'pricing' },

    // German
    { url: 'http://localhost:3000/de/pricing', locale: 'de', page: 'pricing' },

    // Japanese
    { url: 'http://localhost:3000/ja/', locale: 'ja', page: 'homepage' },

    // Korean
    { url: 'http://localhost:3000/ko/contact-us', locale: 'ko', page: 'contact' },
];

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractMetadata(html) {
    const metadata = {};

    // For Next.js streaming HTML, we need to search in the entire response
    // including the JSON-encoded metadata in script tags

    // Extract title - check both regular HTML and JSON-encoded
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i) ||
        html.match(/\\"content\\":\\"([^"]*?)\\",\\"name\\":\\"title\\"/i);
    metadata.title = titleMatch ? titleMatch[1].replace(/\\"/g, '"').trim() : 'NOT FOUND';

    // Extract meta description - check both formats
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
        html.match(/\\"name\\":\\"description\\",\\"content\\":\\"([^"]*?)\\"/i);
    metadata.description = descMatch ? descMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '').trim() : 'NOT FOUND';

    // Extract OG title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
        html.match(/\\"property\\":\\"og:title\\",\\"content\\":\\"([^"]*?)\\"/i);
    metadata.ogTitle = ogTitleMatch ? ogTitleMatch[1].replace(/\\"/g, '"').trim() : 'NOT FOUND';

    // Extract OG description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) ||
        html.match(/\\"property\\":\\"og:description\\",\\"content\\":\\"([^"]*?)\\"/i);
    metadata.ogDescription = ogDescMatch ? ogDescMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '').trim() : 'NOT FOUND';

    // Extract lang attribute - look for html tag with lang
    // In Next.js streaming, it appears as: <html lang="xx" dir="xxx">
    // or in JSON as: \\"lang\\":\\"xx\\"
    const langMatch = html.match(/<html[^>]*\s+lang=["']([^"']*)["']/i) ||
        html.match(/\\"lang\\":\\"([^"]*?)\\"/i);
    metadata.lang = langMatch ? langMatch[1].trim() : 'NOT FOUND';

    // Extract dir attribute (for RTL)
    const dirMatch = html.match(/<html[^>]*\s+dir=["']([^"']*)["']/i) ||
        html.match(/\\"dir\\":\\"([^"]*?)\\"/i);
    metadata.dir = dirMatch ? dirMatch[1].trim() : 'NOT SET';

    // Extract H1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    metadata.h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : 'NOT FOUND';

    // Extract canonical URL
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i) ||
        html.match(/\\"rel\\":\\"canonical\\",\\"href\\":\\"([^"]*?)\\"/i);
    metadata.canonical = canonicalMatch ? canonicalMatch[1].replace(/\\\\/g, '').trim() : 'NOT FOUND';

    return metadata;
}

function checkTranslation(metadata, locale) {
    const issues = [];

    // Check if content contains English when it shouldn't
    if (locale !== 'en') {
        const englishPatterns = [
            /Remove Handwriting/i,
            /AI-Powered Handwriting Removal/i,
            /Free Trial Available/i,
        ];

        const hasEnglish = englishPatterns.some(pattern =>
            pattern.test(metadata.title) ||
            pattern.test(metadata.description) ||
            pattern.test(metadata.h1)
        );

        if (hasEnglish) {
            issues.push('⚠️  Contains English text (possible translation missing)');
        }
    }

    // Check RTL for Arabic
    if (locale === 'ar' && metadata.dir !== 'rtl') {
        issues.push('❌ Missing RTL direction for Arabic');
    }

    // Check lang attribute matches locale
    if (metadata.lang !== locale) {
        issues.push(`❌ Lang attribute mismatch: expected "${locale}", got "${metadata.lang}"`);
    }

    // Check for missing metadata
    if (metadata.title === 'NOT FOUND') issues.push('❌ Missing title tag');
    if (metadata.description === 'NOT FOUND') issues.push('❌ Missing meta description');
    if (metadata.h1 === 'NOT FOUND') issues.push('⚠️  Missing H1 tag');
    if (metadata.canonical === 'NOT FOUND') issues.push('⚠️  Missing canonical URL');

    return issues;
}

async function main() {
    console.log('🔍 Starting SEO and Translation Verification\n');
    console.log(`📊 Checking ${PAGES_TO_CHECK.length} pages...\n`);
    console.log('='.repeat(80));

    const results = [];
    let totalIssues = 0;

    for (const { url, locale, page } of PAGES_TO_CHECK) {
        try {
            console.log(`\n🌐 Checking: ${url}`);
            console.log(`   Locale: ${locale} | Page: ${page}`);

            const html = await fetchPage(url);
            const metadata = extractMetadata(html);
            const issues = checkTranslation(metadata, locale);

            console.log(`\n   📄 Title: ${metadata.title.substring(0, 80)}${metadata.title.length > 80 ? '...' : ''}`);
            console.log(`   📝 Description: ${metadata.description.substring(0, 80)}${metadata.description.length > 80 ? '...' : ''}`);
            console.log(`   🏷️  H1: ${metadata.h1.substring(0, 60)}${metadata.h1.length > 60 ? '...' : ''}`);
            console.log(`   🌍 Lang: ${metadata.lang} | Dir: ${metadata.dir}`);

            if (issues.length > 0) {
                console.log(`\n   ⚠️  Issues found:`);
                issues.forEach(issue => console.log(`      ${issue}`));
                totalIssues += issues.length;
            } else {
                console.log(`\n   ✅ All checks passed!`);
            }

            results.push({
                url,
                locale,
                page,
                metadata,
                issues,
                status: issues.length === 0 ? 'PASS' : 'ISSUES'
            });

            console.log('-'.repeat(80));

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`   ❌ Error fetching page: ${error.message}`);
            results.push({
                url,
                locale,
                page,
                error: error.message,
                status: 'ERROR'
            });
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 VERIFICATION SUMMARY\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const withIssues = results.filter(r => r.status === 'ISSUES').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    console.log(`✅ Passed: ${passed}/${PAGES_TO_CHECK.length}`);
    console.log(`⚠️  With Issues: ${withIssues}/${PAGES_TO_CHECK.length}`);
    console.log(`❌ Errors: ${errors}/${PAGES_TO_CHECK.length}`);
    console.log(`📋 Total Issues Found: ${totalIssues}`);

    if (withIssues > 0) {
        console.log('\n⚠️  Pages with issues:');
        results
            .filter(r => r.status === 'ISSUES')
            .forEach(r => {
                console.log(`\n   ${r.url}`);
                r.issues.forEach(issue => console.log(`      ${issue}`));
            });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Verification complete!\n');

    // Exit with error code if there are critical issues
    if (errors > 0 || totalIssues > 0) {
        process.exit(1);
    }
}

main().catch(console.error);
