package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/mitchellh/go-homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

// 使用 Cobra 库（Go 语言中最流行的 CLI 框架）来定义一个命令行工具的根命令（root command）。
// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "sync",         // 指定命令的使用名称，也就是在终端中敲的命令名。
	Short: "root server.", // 命令的简短描述。
	Long:  `root server.`, //命令的详细描述（多行描述）
	// Uncomment the following line if your bare application
	// has an action associated with it:
	// Run: func(cmd *cobra.Command, args []string) { },
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	fmt.Println("cfgFile=", cfgFile)
}

func init() {
	// 设置initConfig在调用rootCmd的Execute()方法时运行
	//告诉 Cobra，在调用 rootCmd.Execute()（即正式开始解析命令行参数和执行命令）之前，先执行 initConfig 这个函数。
	cobra.OnInitialize(initConfig)
	flags := rootCmd.PersistentFlags()
	/*
			&cfgFile 将标志的值绑定到全局变量 cfgFile（通常是一个 string 类型变量）
			"config"长选项名：--config
		   "c"短选项名：-c
			"./config/config_import.toml"默认值：如果用户不指定，则使用这个路径
			"config file (default is $HOME/.config_import.toml)"帮助信息：在 --help 中显示的描述


	*/
	flags.StringVarP(&cfgFile, "config", "c", "./config/config_import.toml", "config file (default is $HOME/.config_import.toml)")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// 从flag中获取配置文件
		viper.SetConfigFile(cfgFile)
	} else {
		// 主目录 /Users/$HOME$
		home, err := homedir.Dir()
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}

		// 从主目录下搜索后缀名为 ".toml" 文件 (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigName("config_import")
	}
	viper.AutomaticEnv() // 读取匹配的环境变量
	viper.SetConfigType("toml")
	viper.SetEnvPrefix("EasySwap")
	replacer := strings.NewReplacer(".", "_")
	viper.SetEnvKeyReplacer(replacer)
	// 读取找到的配置文件
	if err := viper.ReadInConfig(); err == nil {
		fmt.Println("Using config file:", viper.ConfigFileUsed())
	} else {
		panic(err)
	}

}
