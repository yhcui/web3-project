package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf

	Auth struct {
		AccessSecret  string
		AccessExpire  int64
		RefreshExpire int64
	}

	Database struct {
		Host         string
		Port         int
		User         string
		Password     string
		Name         string
		SSLMode      string
		MaxOpenConns int
		MaxIdleConns int
	}

	Redis struct {
		Host string
		Pass string
		DB   int
	}

	Chain struct {
		Name            string
		ChainID         int64
		RPC             string
		CoreContract    string
		FactoryContract string
		HelperContract  string
		VestingContract string
		TokenBytecode   string `json:",optional"` // MEMEToken 合约字节码（用于 CREATE2 地址计算）
	}

	Storage struct {
		Type      string
		Bucket    string
		Region    string
		AccessKey string `json:",optional"`
		SecretKey string `json:",optional"`
		Endpoint  string `json:",optional"`
		CDNDomain string
	}

	// 腾讯云 COS 配置
	Cos struct {
		SecretID  string `json:",optional"`
		SecretKey string `json:",optional"`
		Bucket    string `json:",optional"`
		Region    string `json:",optional"`
		AppID     string `json:",optional"`
		Domain    string `json:",optional"` // 自定义域名
	}

	SignerPrivateKey string `json:",optional"`
}
