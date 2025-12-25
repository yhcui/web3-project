package common

import (
	"os"
	"pledge-backend/log"
)

var PlgrAdminPrivateKey string

func GetEnv() {

	var ok bool
	/*
		os.Getenv 只返回值，如果环境变量不存在会返回空字符串
		os.LookupEnv 可以明确知道环境变量是否存在，提供了更好的错误处理能力
	*/
	// 获取环境变量的值：从操作系统的环境变量中查找指定名称的变量
	PlgrAdminPrivateKey, ok = os.LookupEnv("plgr_admin_private_key")
	if !ok {
		log.Logger.Error("environment variable is not set")
		panic("environment variable is not set")
	}

}
