package config

type Config struct {
	Database struct {
		Host     string `yaml:"Host"`
		Port     int    `yaml:"Port"`
		User     string `yaml:"User"`
		Password string `yaml:"Password"`
		Name     string `yaml:"Name"`
	} `yaml:"Database"`
	RPC struct {
		Url        string `yaml:"Url"`
		StartBlock int64  `yaml:"StartBlock"`
	} `yaml:"RPC"`
	Contracts struct {
		PoolManager     string `yaml:"PoolManager"`
		PositionManager string `yaml:"PositionManager"`
		SwapRouter      string `yaml:"SwapRouter"`
	} `yaml:"Contracts"`
}
