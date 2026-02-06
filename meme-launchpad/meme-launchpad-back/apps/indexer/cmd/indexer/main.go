package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/meme-launchpad/indexer/internal/config"
	"github.com/meme-launchpad/indexer/internal/database"
	"github.com/meme-launchpad/indexer/internal/indexer"
	"github.com/meme-launchpad/indexer/internal/logger"
	"go.uber.org/zap"
)

func main() {
	// 解析命令行参数
	configPath := flag.String("config", "config/config.yaml", "配置文件路径")
	flag.Parse()

	// 加载配置
	cfg, err := config.Load(*configPath)
	if err != nil {
		panic("Failed to load config: " + err.Error())
	}

	// 初始化日志
	log, err := logger.New(&cfg.Log)
	if err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer log.Sync()

	log.Info("Starting MEME Launchpad Indexer",
		zap.String("name", cfg.Server.Name),
		zap.String("chain", cfg.Chain.Name),
	)

	// 连接数据库
	db, err := database.New(&cfg.Database, log)
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// 初始化数据库表结构
	ctx := context.Background()
	if err := db.InitSchema(ctx); err != nil {
		log.Fatal("Failed to initialize database schema", zap.Error(err))
	}

	// 创建索引器
	idx, err := indexer.New(&cfg.Chain, db, log)
	if err != nil {
		log.Fatal("Failed to create indexer", zap.Error(err))
	}

	// 创建上下文，用于优雅关闭
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 启动索引器
	if err := idx.Start(ctx); err != nil {
		log.Fatal("Failed to start indexer", zap.Error(err))
	}

	log.Info("Indexer started successfully")

	// 等待退出信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down indexer...")
	cancel()
	idx.Stop()
	log.Info("Indexer stopped gracefully")
}
