package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config 应用配置
type Config struct {
	Server   ServerConfig   `mapstructure:"Server"`
	Database DatabaseConfig `mapstructure:"Database"`
	Chain    ChainConfig    `mapstructure:"Chain"`
	Log      LogConfig      `mapstructure:"Log"`
}

// ServerConfig 服务配置
type ServerConfig struct {
	Name string `mapstructure:"Name"`
	Host string `mapstructure:"Host"`
	Port int    `mapstructure:"Port"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host         string `mapstructure:"Host"`
	Port         int    `mapstructure:"Port"`
	User         string `mapstructure:"User"`
	Password     string `mapstructure:"Password"`
	Name         string `mapstructure:"Name"`
	SSLMode      string `mapstructure:"SSLMode"`
	MaxOpenConns int    `mapstructure:"MaxOpenConns"`
	MaxIdleConns int    `mapstructure:"MaxIdleConns"`
}

// ChainConfig 链配置
type ChainConfig struct {
	Name           string `mapstructure:"Name"`
	ChainID        int64  `mapstructure:"ChainID"`
	RPC            string `mapstructure:"RPC"`
	WSS            string `mapstructure:"WSS"`
	CoreContract   string `mapstructure:"CoreContract"`
	StartBlock     uint64 `mapstructure:"StartBlock"`
	BlockBatchSize int    `mapstructure:"BlockBatchSize"`
	PollInterval   int    `mapstructure:"PollInterval"` // 轮询间隔(秒)
}

// LogConfig 日志配置
type LogConfig struct {
	Level  string `mapstructure:"Level"`
	Format string `mapstructure:"Format"`
}

// DSN 返回数据库连接字符串
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.Name, c.SSLMode,
	)
}

// Load 加载配置
func Load(configPath string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(configPath)
	v.SetConfigType("yaml")

	// 支持环境变量覆盖
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// 设置默认值
	if cfg.Database.SSLMode == "" {
		cfg.Database.SSLMode = "disable"
	}
	if cfg.Database.MaxOpenConns == 0 {
		cfg.Database.MaxOpenConns = 25
	}
	if cfg.Database.MaxIdleConns == 0 {
		cfg.Database.MaxIdleConns = 5
	}
	if cfg.Chain.BlockBatchSize == 0 {
		cfg.Chain.BlockBatchSize = 1000
	}
	if cfg.Chain.PollInterval == 0 {
		cfg.Chain.PollInterval = 3
	}

	return &cfg, nil
}
