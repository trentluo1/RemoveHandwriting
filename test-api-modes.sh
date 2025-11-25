#!/bin/bash

# 测试阿里云API的两种模式：直接调用和代理调用
# 使用现有的测试图片

set -e

echo "🧪 测试阿里云API的两种调用模式"
echo "================================"

# 检查测试图片是否存在
if [ ! -f "1.jpg" ]; then
    echo "❌ 测试图片 1.jpg 不存在"
    exit 1
fi

echo "✅ 找到测试图片: 1.jpg"

# 获取当前时间戳
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# 创建临时目录存储测试结果
TEST_DIR="test_results_${TIMESTAMP}"
mkdir -p "$TEST_DIR"

echo "📁 测试结果将保存到: $TEST_DIR"

# 测试用户ID（使用固定的测试ID）
USER_ID="test-user-api-modes"

# Web项目的本地API端点
API_ENDPOINT="http://localhost:3000/api/process-image"

echo ""
echo "🔧 准备测试环境..."

# 检查Web项目是否运行
if ! curl -s "$API_ENDPOINT" > /dev/null 2>&1; then
    echo "❌ Web项目未运行，请先启动开发服务器："
    echo "   cd removehandwriting-web && npm run dev"
    exit 1
fi

echo "✅ Web项目正在运行"

# 函数：测试API调用
test_api_mode() {
    local mode_name="$1"
    local use_proxy="$2"
    local test_file="$3"
    
    echo ""
    echo "🧪 测试 $mode_name 模式..."
    echo "USE_ALIYUN_PROXY=$use_proxy"
    
    # 创建临时环境变量文件
    local env_file="$TEST_DIR/.env.test"
    cat > "$env_file" << EOF
USE_ALIYUN_PROXY=$use_proxy
ALIYUN_API_HOST=https://sjccup.market.alicloudapi.com
ALIYUN_API_PATH=/sjccup
ALIYUN_APPCODE=aa9157d940e349cfae2eb81093780d79
ALIYUN_PROXY_HOST=https://sjccup-proxy-tuaquaselb.cn-hangzhou.fcapp.run
ALIYUN_PROXY_TOKEN=token-1e3g26488cba301b1ghcg2917i4e
IMAGE_PROCESSING_PROVIDER=aliyun
EOF
    
    # 设置环境变量
    export $(cat "$env_file" | xargs)
    
    local start_time=$(date +%s)
    
    # 调用API
    local response_file="$TEST_DIR/response_${mode_name,,}_${start_time}.json"
    local curl_info_file="$TEST_DIR/curl_info_${mode_name,,}_${start_time}.txt"
    
    echo "📤 发送请求..."
    
    # 使用curl调用API
    local http_code
    http_code=$(curl -X POST "$API_ENDPOINT" \
        -F "image=@$test_file" \
        -F "userId=$USER_ID" \
        -w "%{http_code}" \
        -s \
        -o "$response_file" \
        --max-time 60 \
        --connect-timeout 10 \
        2>"$curl_info_file")
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "📊 测试结果:"
    echo "   HTTP状态码: $http_code"
    echo "   响应时间: ${duration}秒"
    echo "   响应文件: $response_file"
    
    # 检查响应
    if [ "$http_code" = "200" ]; then
        echo "   ✅ 请求成功"
        
        # 检查响应内容
        if [ -f "$response_file" ]; then
            local has_data=$(jq -r '.data.mediaId // empty' "$response_file" 2>/dev/null)
            if [ -n "$has_data" ]; then
                echo "   ✅ 响应包含处理后的图片数据"
                echo "   📄 响应摘要: $(jq -c '{success: (.data.mediaId != null), hasData: (.data.mediaId | length > 0)}' "$response_file" 2>/dev/null || echo "无法解析JSON")"
            else
                echo "   ⚠️  响应不包含图片数据"
                echo "   📄 响应内容: $(head -c 200 "$response_file")..."
            fi
        fi
    else
        echo "   ❌ 请求失败"
        if [ -f "$response_file" ]; then
            echo "   📄 错误响应: $(head -c 300 "$response_file")..."
        fi
        if [ -f "$curl_info_file" ]; then
            echo "   🔍 Curl错误信息: $(cat "$curl_info_file")"
        fi
    fi
    
    # 清理环境变量
    unset USE_ALIYUN_PROXY ALIYUN_API_HOST ALIYUN_API_PATH ALIYUN_APPCODE
    unset ALIYUN_PROXY_HOST ALIYUN_PROXY_TOKEN IMAGE_PROCESSING_PROVIDER
    
    return $([ "$http_code" = "200" ] && echo 0 || echo 1)
}

# 测试直接调用模式
echo ""
echo "🎯 开始测试..."

direct_success=0
proxy_success=0

# 测试1: 直接调用模式
if test_api_mode "直接调用" "false" "1.jpg"; then
    direct_success=1
fi

# 等待一下再测试下一个模式
sleep 2

# 测试2: 代理调用模式
if test_api_mode "代理调用" "true" "1.jpg"; then
    proxy_success=1
fi

# 生成测试报告
echo ""
echo "📋 测试报告"
echo "============"
echo "测试时间: $(date)"
echo "测试图片: 1.jpg"
echo "结果目录: $TEST_DIR"
echo ""
echo "模式测试结果:"
echo "  直接调用模式: $([ $direct_success -eq 1 ] && echo "✅ 成功" || echo "❌ 失败")"
echo "  代理调用模式: $([ $proxy_success -eq 1 ] && echo "✅ 成功" || echo "❌ 失败")"
echo ""

# 生成JSON格式的测试报告
cat > "$TEST_DIR/test_report.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test_image": "1.jpg",
  "results": {
    "direct_mode": {
      "success": $([ $direct_success -eq 1 ] && echo "true" || echo "false"),
      "mode": "direct_call"
    },
    "proxy_mode": {
      "success": $([ $proxy_success -eq 1 ] && echo "true" || echo "false"),
      "mode": "proxy_call"
    }
  },
  "summary": {
    "total_tests": 2,
    "passed": $((direct_success + proxy_success)),
    "failed": $((2 - direct_success - proxy_success))
  }
}
EOF

echo "📄 详细测试报告已保存到: $TEST_DIR/test_report.json"

# 总结
if [ $direct_success -eq 1 ] && [ $proxy_success -eq 1 ]; then
    echo ""
    echo "🎉 所有测试通过！两种模式都工作正常。"
    exit 0
elif [ $direct_success -eq 1 ] || [ $proxy_success -eq 1 ]; then
    echo ""
    echo "⚠️  部分测试通过。请检查失败的模式配置。"
    exit 1
else
    echo ""
    echo "❌ 所有测试失败。请检查API配置和网络连接。"
    exit 1
fi
