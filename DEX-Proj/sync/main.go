package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"meta-node-dex-sync/pkg/config"
	"meta-node-dex-sync/pkg/scanner"

	_ "github.com/lib/pq"
	"gopkg.in/yaml.v3"
)

func main() {
	// 1. Read config
	configData, err := os.ReadFile("config.yaml")
	if err != nil {
		log.Fatalf("Failed to read config.yaml: %v", err)
	}

	var config config.Config
	if err := yaml.Unmarshal(configData, &config); err != nil {
		log.Fatalf("Failed to parse config.yaml: %v", err)
	}

	log.Println(config)

	// 2. Connect to Database
	// 根据数据库地址判断是否需要 SSL
	// 本地数据库（localhost/127.0.0.1）通常不需要 SSL，远程数据库需要 SSL
	sslMode := "require"
	if config.Database.Host == "localhost" || config.Database.Host == "127.0.0.1" {
		sslMode = "disable"
	}
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		config.Database.Host, config.Database.Port, config.Database.User, config.Database.Password, config.Database.Name, sslMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	fmt.Println("Successfully connected to the database!")

	// 3. Ensure Schema (Idempotent)
	// For production, use migrate tool. For now, rely on schema.sql having IF NOT EXISTS
	// or assume it's already applied. We can run it again just in case.
	schema, err := os.ReadFile(".sql/schema.sql")
	if err == nil {
		_, err = db.Exec(string(schema))
		if err != nil {
			log.Printf("Warning: failed to re-apply schema: %v", err)
		} else {
			fmt.Println("Database schema checked.")
		}
	}

	// 4. Start Scanner
	s, err := scanner.NewScanner(config, db)
	if err != nil {
		log.Fatalf("Failed to initialize scanner: %v", err)
	}

	fmt.Println("Starting blockchain scanner...")
	s.Run()
}
