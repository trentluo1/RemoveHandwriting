#!/bin/bash

# SEO Verification Script using curl
# More reliable for Next.js streaming HTML

echo "🔍 Starting SEO and Translation Verification"
echo ""
echo "📊 Checking pages..."
echo "================================================================================"

PASSED=0
FAILED=0
TOTAL=0

check_page() {
    local url=$1
    local expected_lang=$2
    local page_name=$3
    
    TOTAL=$((TOTAL + 1))
    
    echo ""
    echo "🌐 Checking: $url"
    echo "   Expected lang: $expected_lang | Page: $page_name"
    
    # Fetch HTML and extract html tag
    HTML_TAG=$(curl -L -s "$url" 2>&1 | grep -o '<html[^>]*>' | head -1)
    
    if [ -z "$HTML_TAG" ]; then
        echo "   ❌ ERROR: Could not fetch page"
        FAILED=$((FAILED + 1))
        return
    fi
    
    # Extract lang attribute
    LANG=$(echo "$HTML_TAG" | grep -o 'lang="[^"]*"' | cut -d'"' -f2)
    
    # Extract dir attribute
    DIR=$(echo "$HTML_TAG" | grep -o 'dir="[^"]*"' | cut -d'"' -f2)
    [ -z "$DIR" ] && DIR="ltr"
    
    echo "   🌍 Found: lang=\"$LANG\" dir=\"$DIR\""
    
    # Check lang attribute
    ISSUES=0
    if [ "$LANG" != "$expected_lang" ]; then
        echo "   ❌ Lang mismatch: expected \"$expected_lang\", got \"$LANG\""
        ISSUES=$((ISSUES + 1))
    fi
    
    # Check RTL for Arabic
    if [ "$expected_lang" = "ar" ] && [ "$DIR" != "rtl" ]; then
        echo "   ❌ Missing RTL for Arabic"
        ISSUES=$((ISSUES + 1))
    fi
    
    # Check zh-tw capitalization
    if [ "$expected_lang" = "zh-tw" ] && [ "$LANG" != "zh-TW" ]; then
        echo "   ⚠️  Warning: zh-tw should be zh-TW (capitalized)"
    fi
    
    if [ $ISSUES -eq 0 ]; then
        echo "   ✅ All checks passed!"
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
    
    echo "--------------------------------------------------------------------------------"
}

# Test pages
check_page "http://localhost:3000/" "en" "homepage"
check_page "http://localhost:3000/es/" "es" "homepage"
check_page "http://localhost:3000/zh/" "zh" "homepage"
check_page "http://localhost:3000/zh-tw" "zh-TW" "homepage"
check_page "http://localhost:3000/ru/" "ru" "homepage"
check_page "http://localhost:3000/pt/" "pt" "homepage"
check_page "http://localhost:3000/ar/" "ar" "homepage"
check_page "http://localhost:3000/ja/" "ja" "homepage"
check_page "http://localhost:3000/fr/" "fr" "homepage"
check_page "http://localhost:3000/de/" "de" "homepage"

check_page "http://localhost:3000/pricing" "en" "pricing"
check_page "http://localhost:3000/es/pricing" "es" "pricing"
check_page "http://localhost:3000/zh/pricing" "zh" "pricing"
check_page "http://localhost:3000/ar/pricing" "ar" "pricing"
check_page "http://localhost:3000/fr/pricing" "fr" "pricing"
check_page "http://localhost:3000/de/pricing" "de" "pricing"

check_page "http://localhost:3000/contact-us" "en" "contact"
check_page "http://localhost:3000/es/contact-us" "es" "contact"
check_page "http://localhost:3000/zh/contact-us" "zh" "contact"
check_page "http://localhost:3000/ar/contact-us" "ar" "contact"
check_page "http://localhost:3000/ko/contact-us" "ko" "contact"

echo ""
echo "================================================================================"
echo ""
echo "📊 VERIFICATION SUMMARY"
echo ""
echo "✅ Passed: $PASSED/$TOTAL"
echo "❌ Failed: $FAILED/$TOTAL"
echo ""
echo "================================================================================"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "⚠️  Some tests failed"
    exit 1
else
    echo "🎉 All tests passed!"
    exit 0
fi
