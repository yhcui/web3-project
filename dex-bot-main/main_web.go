package main

import (
	"dex-bot/api"
	_ "dex-bot/docs" // Swagger 文档
	"flag"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

// @title DEX Bot API
// @version 1.0
// @description DEX 流动性池和交易路由查询 API
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@dexbot.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /
// @schemes http https

func main() {
	// 命令行参数 在 Go 语言中，flag 是一个标准库包，用于解析命令行参数
	dbPath := flag.String("db", "./db.db", "数据库文件路径")
	port := flag.String("port", "8080", "服务端口")
	mode := flag.String("mode", "release", "运行模式: debug, release")
	initData := flag.Bool("init", false, "是否初始化示例数据")
	/*
		 flag.Parse() 会：
			扫描命令行参数 - 查找所有以 - 开头的参数
			匹配已定义的 flag - 将传入的参数与之前用 flag.String、flag.Bool 等定义的变量进行匹配
			赋值 - 将用户传入的值赋给对应的变量
			使用默认值 - 如果某个参数没有传入，就使用定义时的默认值
	*/
	flag.Parse()

	// 设置 Gin 模式
	gin.SetMode(*mode)

	// 初始化 DexBot
	bot, err := api.NewDexBot(*dbPath)
	if err != nil {
		log.Fatalf("初始化 DexBot 失败: %v", err)
	}
	defer bot.Close()

	// 初始化数据库
	if err := bot.InitDB(); err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}

	// 如果需要，初始化示例数据
	if *initData {
		log.Println("正在初始化示例数据...")
		if err := initSampleData(bot); err != nil {
			log.Printf("初始化示例数据失败: %v", err)
		} else {
			log.Println("示例数据初始化成功")
		}
	}

	// 创建 Gin 引擎
	r := gin.Default()

	// 添加 CORS 中间件
	r.Use(CORSMiddleware())

	// 创建 Handler
	handler := api.NewHandler(bot)

	// 设置路由
	api.SetupRoutes(r, handler)

	// 启动服务器
	addr := fmt.Sprintf(":%s", *port)
	log.Printf("🚀 DEX Bot API 服务启动成功！")
	log.Printf("📝 Swagger 文档: http://localhost:%s/swagger/index.html", *port)

	if err := r.Run(addr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}

// CORSMiddleware CORS 中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// initSampleData 初始化示例数据
func initSampleData(bot *api.DexBot) error {
	// 这里可以添加初始化示例数据的逻辑
	// 由于 UpsertPool 方法在 api 包中没有暴露，这里只是示例
	log.Println("示例数据初始化功能暂未实现，请使用原 main.go 初始化数据")
	return nil
}
