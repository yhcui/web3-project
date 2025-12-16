package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Database struct {
		Host     string `yaml:"Host"`
		Port     int    `yaml:"Port"`
		User     string `yaml:"User"`
		Password string `yaml:"Password"`
		Name     string `yaml:"Name"`
	} `yaml:"Database"`
	Infura struct {
		Url        string `yaml:"Url"`
		StartBlock int64  `yaml:"StartBlock"`
	} `yaml:"Infura"`
	Contracts struct {
		PoolManager     string `yaml:"PoolManager"`
		PositionManager string `yaml:"PositionManager"`
		SwapRouter      string `yaml:"SwapRouter"`
	} `yaml:"Contracts"`
	Tokens struct {
		MNTokenA string `yaml:"MNTokenA"`
		MNTokenB string `yaml:"MNTokenB"`
		MNTokenC string `yaml:"MNTokenC"`
		MNTokenD string `yaml:"MNTokenD"`
	} `yaml:"Tokens"`
}

func main() {
	// 1. Read config
	configData, err := os.ReadFile("config.yaml")
	if err != nil {
		log.Fatalf("Failed to read config.yaml: %v", err)
	}

	var config Config
	if err := yaml.Unmarshal(configData, &config); err != nil {
		log.Fatalf("Failed to parse config.yaml: %v", err)
	}

	// 2. Connect to Database
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=require",
		config.Database.Host, config.Database.Port, config.Database.User, config.Database.Password, config.Database.Name)

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
	schema, err := os.ReadFile("schema.sql")
	if err == nil {
		_, err = db.Exec(string(schema))
		if err != nil {
			log.Printf("Warning: failed to re-apply schema: %v", err)
		} else {
			fmt.Println("Database schema checked.")
		}
	}

	// 4. Start Scanner
	scanner, err := NewScanner(config, db)
	if err != nil {
		log.Fatalf("Failed to initialize scanner: %v", err)
	}

	fmt.Println("Starting blockchain scanner...")
	scanner.Run()
}
