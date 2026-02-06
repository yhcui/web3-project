package config

import (
	"os"

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
}

// LoadConfig 从文件加载配置
func LoadConfig(configPath string) (*Config, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}
