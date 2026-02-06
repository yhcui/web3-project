package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"

	"meta-node-dex-sync/pkg/config"
	"meta-node-dex-sync/pkg/scanner"

	_ "github.com/lib/pq"
	"gopkg.in/yaml.v3"
)

func main() {
	// 命令行参数
	configPath := flag.String("config", "../config.yaml", "配置文件路径")
	flag.Parse()

	// 1. Read config
	configData, err := os.ReadFile(*configPath)
	if err != nil {
		log.Fatalf("Failed to read config.yaml: %v", err)
	}

	var cfg config.Config
	if err := yaml.Unmarshal(configData, &cfg); err != nil {
		log.Fatalf("Failed to parse config.yaml: %v", err)
	}

	// 2. Connect to Database
	sslMode := "require"
	if cfg.Database.Host == "localhost" || cfg.Database.Host == "127.0.0.1" {
		sslMode = "disable"
	}
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.Name, sslMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	fmt.Println("Successfully connected to the database!")

	// 3. Create Scanner instance
	s, err := scanner.NewScanner(cfg, db)
	if err != nil {
		log.Fatalf("Failed to initialize scanner: %v", err)
	}

	// 4. Update all pool states (including reserves, sqrt_price_x96, tick, liquidity)
	fmt.Println("Starting to update full state for all pools...")
	if err := s.UpdateAllPoolStates(); err != nil {
		log.Fatalf("Failed to update pool states: %v", err)
	}

	fmt.Println("✅ All pool states updated successfully!")
}
