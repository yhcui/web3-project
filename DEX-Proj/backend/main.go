package main

import (
	"database/sql"
	"dex-bot/api"
	_ "dex-bot/docs" // Swagger 文档
	"dex-bot/pkg/config"
	"flag"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

// @title Quote API
// @version 1.0
// @description DEX 交易报价计算 API（Uniswap V3 模型）
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@dexbot.io

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /
// @schemes http https

func main() {
	// 命令行参数
	configPath := flag.String("config", "../sync/config.yaml", "配置文件路径")
	dbPath := flag.String("db", "", "SQLite 数据库文件路径（如果使用 SQLite）")
	port := flag.String("port", "8080", "服务端口")
	mode := flag.String("mode", "release", "运行模式: debug, release")
	flag.Parse()

	// 设置 Gin 模式
	gin.SetMode(*mode)

	var db *sql.DB
	var err error

	// 优先使用 PostgreSQL（从配置文件读取）
	if *dbPath == "" {
		// 尝试从配置文件读取 PostgreSQL 配置
		cfg, err := config.LoadConfig(*configPath)
		if err != nil {
			log.Printf("无法读取配置文件 %s，尝试使用 SQLite: %v", *configPath, err)
			// 回退到 SQLite
			*dbPath = "./db.db"
			db, err = sql.Open("sqlite3", *dbPath)
			if err != nil {
				log.Fatalf("打开数据库失败: %v", err)
			}
		} else {
			// 使用 PostgreSQL
			log.Printf("使用 PostgreSQL 数据库: %s:%d/%s", cfg.Database.Host, cfg.Database.Port, cfg.Database.Name)
			sslMode := "require"
			if cfg.Database.Host == "localhost" || cfg.Database.Host == "127.0.0.1" {
				sslMode = "disable"
			}
			connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
				cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.Name, sslMode)
			db, err = sql.Open("postgres", connStr)
			if err != nil {
				log.Fatalf("打开数据库失败: %v", err)
			}
		}
	} else {
		// 使用 SQLite
		db, err = sql.Open("sqlite3", *dbPath)
		if err != nil {
			log.Fatalf("打开数据库失败: %v", err)
		}
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 创建 Gin 引擎
	r := gin.Default()

	// 添加 CORS 中间件
	r.Use(CORSMiddleware())

	// 创建 Quote 和 Handler
	quote := api.NewQuote(db)
	handler := api.NewHandler(quote)

	// 设置路由
	api.SetupRoutes(r, handler)

	// 启动服务器
	addr := fmt.Sprintf(":%s", *port)
	log.Printf("🚀 Quote API 服务启动成功！")
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

