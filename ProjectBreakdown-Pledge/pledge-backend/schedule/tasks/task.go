package tasks

import (
	"pledge-backend/db"
	"pledge-backend/schedule/common"
	"pledge-backend/schedule/services"
	"time"

	"github.com/jasonlvhit/gocron"
)

// 基于 gocron 的任务调度系统，负责定期更新区块链相关数据。
func Task() {

	// get environment variables
	common.GetEnv()

	// flush redis db
	err := db.RedisFlushDB()
	if err != nil {
		panic("clear redis error " + err.Error())
	}

	//init task
	services.NewPool().UpdateAllPoolInfo()           // 管理借贷池信息
	services.NewTokenPrice().UpdateContractPrice()   // 处理代币价格相关
	services.NewTokenSymbol().UpdateContractSymbol() // 管理代币符号
	services.NewTokenLogo().UpdateTokenLogo()        // 管理代币Logo
	services.NewBalanceMonitor().Monitor()           // 控余额变化
	// services.NewTokenPrice().SavePlgrPrice()
	services.NewTokenPrice().SavePlgrPriceTestNet() // 处理代币价格相关

	//run pool task
	s := gocron.NewScheduler()
	//使用 s.ChangeLoc(time.UTC) 统一使用UTC时区
	s.ChangeLoc(time.UTC)
	//每2分钟 更新所有借贷池信息
	_ = s.Every(2).Minutes().From(gocron.NextTick()).Do(services.NewPool().UpdateAllPoolInfo)

	//每1分钟 更新合约代币价格
	_ = s.Every(1).Minute().From(gocron.NextTick()).Do(services.NewTokenPrice().UpdateContractPrice)

	//每2小时 更新合约代币符号
	_ = s.Every(2).Hours().From(gocron.NextTick()).Do(services.NewTokenSymbol().UpdateContractSymbol)

	//每2小时 更新代币Logo
	_ = s.Every(2).Hours().From(gocron.NextTick()).Do(services.NewTokenLogo().UpdateTokenLogo)

	//每30分钟 监控余额
	_ = s.Every(30).Minutes().From(gocron.NextTick()).Do(services.NewBalanceMonitor().Monitor)
	//_ = s.Every(30).Minutes().From(gocron.NextTick()).Do(services.NewTokenPrice().SavePlgrPrice)
	//每30分钟 保存测试网PLGR价格
	_ = s.Every(30).Minutes().From(gocron.NextTick()).Do(services.NewTokenPrice().SavePlgrPriceTestNet)

	// 阻塞主线程，持续运行调度任务
	<-s.Start() // Start all the pending jobs

}
