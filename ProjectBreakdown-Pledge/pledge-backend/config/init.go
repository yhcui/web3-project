package config

import (
	"path"
	"path/filepath"
	"runtime"

	"github.com/BurntSushi/toml"
)

/*
Go 语言的初始化函数，程序启动时自动执行
*/
func init() {
	currentAbPath := getCurrentAbPathByCaller()
	tomlFile, err := filepath.Abs(currentAbPath + "/configV21.toml")
	//tomlFile, err := filepath.Abs(currentAbPath + "/configV22.toml")
	if err != nil {
		panic("read toml file err: " + err.Error())
		return
	}
	// 解析 TOML 配置文件内容到全局的 Config 变量中
	if _, err := toml.DecodeFile(tomlFile, &Config); err != nil {
		panic("read toml file err: " + err.Error())
		return
	}
}

/*
获取当前执行文件绝对路径
*/
func getCurrentAbPathByCaller() string {
	var abPath string

	// 获取当前函数调用栈信息0 表示获取当前函数的信息
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		//  获取文件所在目录
		abPath = path.Dir(filename)
	}
	return abPath
}
