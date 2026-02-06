package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/meme-launchpad/indexer/internal/config"
	"go.uber.org/zap"
)

// DB PostgreSQL 数据库连接池
type DB struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

// New 创建数据库连接
func New(cfg *config.DatabaseConfig, logger *zap.Logger) (*DB, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	poolConfig.MaxConns = int32(cfg.MaxOpenConns)
	poolConfig.MinConns = int32(cfg.MaxIdleConns)
	poolConfig.MaxConnLifetime = time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// 测试连接
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connected successfully",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
		zap.String("database", cfg.Name),
	)

	return &DB{pool: pool, logger: logger}, nil
}

// Close 关闭数据库连接
func (db *DB) Close() {
	db.pool.Close()
}

// Pool 返回连接池
func (db *DB) Pool() *pgxpool.Pool {
	return db.pool
}

// InitSchema 初始化数据库表结构
func (db *DB) InitSchema(ctx context.Context) error {
	schema := `
	-- Token creation events table
	CREATE TABLE IF NOT EXISTS token_created_events (
		id SERIAL PRIMARY KEY,
		token_address VARCHAR(42) NOT NULL,
		creator_address VARCHAR(42) NOT NULL,
		name VARCHAR(255) NOT NULL,
		symbol VARCHAR(50) NOT NULL,
		total_supply NUMERIC(78, 0) NOT NULL,
		request_id VARCHAR(66) NOT NULL,
		transaction_hash VARCHAR(66) NOT NULL,
		block_number BIGINT NOT NULL,
		block_timestamp TIMESTAMP NOT NULL,
		log_index INTEGER NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(transaction_hash, log_index)
	);

	-- Token buy events table
	CREATE TABLE IF NOT EXISTS token_bought_events (
		id SERIAL PRIMARY KEY,
		token_address VARCHAR(42) NOT NULL,
		buyer_address VARCHAR(42) NOT NULL,
		bnb_amount NUMERIC(78, 0) NOT NULL,
		token_amount NUMERIC(78, 0) NOT NULL,
		trading_fee NUMERIC(78, 0) NOT NULL DEFAULT 0,
		virtual_bnb_reserve NUMERIC(78, 0) NOT NULL DEFAULT 0,
		virtual_token_reserve NUMERIC(78, 0) NOT NULL DEFAULT 0,
		available_tokens NUMERIC(78, 0) NOT NULL DEFAULT 0,
		collected_bnb NUMERIC(78, 0) NOT NULL DEFAULT 0,
		transaction_hash VARCHAR(66) NOT NULL,
		block_number BIGINT NOT NULL,
		block_timestamp TIMESTAMP NOT NULL,
		log_index INTEGER NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(transaction_hash, log_index)
	);

	-- Token sell events table
	CREATE TABLE IF NOT EXISTS token_sold_events (
		id SERIAL PRIMARY KEY,
		token_address VARCHAR(42) NOT NULL,
		seller_address VARCHAR(42) NOT NULL,
		token_amount NUMERIC(78, 0) NOT NULL,
		bnb_amount NUMERIC(78, 0) NOT NULL,
		trading_fee NUMERIC(78, 0) NOT NULL DEFAULT 0,
		virtual_bnb_reserve NUMERIC(78, 0) NOT NULL DEFAULT 0,
		virtual_token_reserve NUMERIC(78, 0) NOT NULL DEFAULT 0,
		available_tokens NUMERIC(78, 0) NOT NULL DEFAULT 0,
		collected_bnb NUMERIC(78, 0) NOT NULL DEFAULT 0,
		transaction_hash VARCHAR(66) NOT NULL,
		block_number BIGINT NOT NULL,
		block_timestamp TIMESTAMP NOT NULL,
		log_index INTEGER NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(transaction_hash, log_index)
	);

	-- Token graduated events table
	CREATE TABLE IF NOT EXISTS token_graduated_events (
		id SERIAL PRIMARY KEY,
		token_address VARCHAR(42) NOT NULL,
		liquidity_bnb NUMERIC(78, 0) NOT NULL,
		liquidity_tokens NUMERIC(78, 0) NOT NULL,
		liquidity_result NUMERIC(78, 0) NOT NULL,
		transaction_hash VARCHAR(66) NOT NULL,
		block_number BIGINT NOT NULL,
		block_timestamp TIMESTAMP NOT NULL,
		log_index INTEGER NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(transaction_hash, log_index)
	);

	-- Indexer state table (to track last synced block)
	CREATE TABLE IF NOT EXISTS indexer_state (
		id SERIAL PRIMARY KEY,
		contract_address VARCHAR(42) NOT NULL,
		last_block_number BIGINT NOT NULL,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(contract_address)
	);

	-- Indexes for better query performance
	CREATE INDEX IF NOT EXISTS idx_token_created_token_address ON token_created_events(token_address);
	CREATE INDEX IF NOT EXISTS idx_token_created_creator ON token_created_events(creator_address);
	CREATE INDEX IF NOT EXISTS idx_token_created_block ON token_created_events(block_number);

	CREATE INDEX IF NOT EXISTS idx_token_bought_token_address ON token_bought_events(token_address);
	CREATE INDEX IF NOT EXISTS idx_token_bought_buyer ON token_bought_events(buyer_address);
	CREATE INDEX IF NOT EXISTS idx_token_bought_block ON token_bought_events(block_number);

	CREATE INDEX IF NOT EXISTS idx_token_sold_token_address ON token_sold_events(token_address);
	CREATE INDEX IF NOT EXISTS idx_token_sold_seller ON token_sold_events(seller_address);
	CREATE INDEX IF NOT EXISTS idx_token_sold_block ON token_sold_events(block_number);

	CREATE INDEX IF NOT EXISTS idx_token_graduated_token_address ON token_graduated_events(token_address);
	CREATE INDEX IF NOT EXISTS idx_token_graduated_block ON token_graduated_events(block_number);

	-- K线数据表
	CREATE TABLE IF NOT EXISTS klines (
		id SERIAL,
		token_address VARCHAR(42) NOT NULL,
		interval VARCHAR(10) NOT NULL, -- 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
		open_time TIMESTAMP NOT NULL,
		open_price NUMERIC(78, 18) NOT NULL,
		high_price NUMERIC(78, 18) NOT NULL,
		low_price NUMERIC(78, 18) NOT NULL,
		close_price NUMERIC(78, 18) NOT NULL,
		volume NUMERIC(78, 0) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id, open_time),
		UNIQUE(token_address, interval, open_time)
	);

	CREATE INDEX IF NOT EXISTS idx_klines_token_interval ON klines(LOWER(token_address), interval, open_time DESC);
	`

	_, err := db.pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	db.logger.Info("Database schema initialized successfully")
	return nil
}

// GetLastSyncedBlock 获取最后同步的区块号
func (db *DB) GetLastSyncedBlock(ctx context.Context, contractAddress string) (uint64, error) {
	var blockNumber uint64
	err := db.pool.QueryRow(ctx,
		"SELECT last_block_number FROM indexer_state WHERE contract_address = $1",
		contractAddress,
	).Scan(&blockNumber)

	if err != nil {
		return 0, nil // 没有记录，返回0
	}
	return blockNumber, nil
}

// UpdateLastSyncedBlock 更新最后同步的区块号
func (db *DB) UpdateLastSyncedBlock(ctx context.Context, contractAddress string, blockNumber uint64) error {
	_, err := db.pool.Exec(ctx, `
		INSERT INTO indexer_state (contract_address, last_block_number, updated_at) 
		VALUES ($1, $2, NOW()) 
		ON CONFLICT (contract_address) 
		DO UPDATE SET last_block_number = $2, updated_at = NOW()
	`, contractAddress, blockNumber)
	return err
}
