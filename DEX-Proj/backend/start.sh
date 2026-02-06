#!/bin/bash

# DEX Bot 启动脚本

echo "🚀 启动 DEX Bot Web Service..."
echo ""

# 检查数据库是否存在
if [ ! -f "db.db" ]; then
    echo "⚠️  数据库不存在，正在初始化..."
    echo "运行: go run main.go"
    go run main.go
    echo ""
fi

# 检查可执行文件是否存在
if [ ! -f "dex-bot-web" ]; then
    echo "📦 编译 Web 服务..."
    go build -o dex-bot-web main_web.go
    if [ $? -ne 0 ]; then
        echo "❌ 编译失败"
        exit 1
    fi
    echo "✅ 编译成功"
    echo ""
fi

# 启动服务
PORT=${1:-8080}
MODE=${2:-release}

echo "🎯 启动参数:"
echo "  - 端口: $PORT"
echo "  - 模式: $MODE"
echo ""

./dex-bot-web -port $PORT -mode $MODE

# 说明
echo ""
echo "📝 使用说明:"
echo "  ./start.sh [端口] [模式]"
echo ""
echo "示例:"
echo "  ./start.sh           # 默认端口 8080，release 模式"
echo "  ./start.sh 8000      # 端口 8000，release 模式"  
echo "  ./start.sh 8080 debug # 端口 8080，debug 模式"

