package kucoin

import (
	"pledge-backend/db"
	"pledge-backend/log"

	"github.com/Kucoin/kucoin-go-sdk"
)

// ApiKeyVersionV2 is v2 api key version
const ApiKeyVersionV2 = "2"

var PlgrPrice = "0.0027"                 // 存储当前 PLGR 价格的字符串变量，默认值为 "0.0027"
var PlgrPriceChan = make(chan string, 2) // 用于异步传递价格的通道，缓冲区大小为 2

// 这个文件实现了一个用于获取 PLGR-USDT 交易对实时价格的 KuCoin 交易所 API 客户端，通过 WebSocket 订阅实时价格更新。
func GetExchangePrice() {

	log.Logger.Sugar().Info("GetExchangePrice ")

	// get plgr price from redis
	// 从 Redis 获取已存储的价格作为初始值
	price, err := db.RedisGetString("plgr_price")
	if err != nil {
		log.Logger.Sugar().Error("get plgr price from redis err ", err)
	} else {
		PlgrPrice = price
	}
	// 使用 KuCoin SDK 创建 API 服务实例
	s := kucoin.NewApiService(
		kucoin.ApiKeyOption("key"),
		kucoin.ApiSecretOption("secret"),
		kucoin.ApiPassPhraseOption("passphrase"),
		kucoin.ApiKeyVersionOption(ApiKeyVersionV2),
	)
	// 请求 KuCoin 的 WebSocket 连接令牌
	rsp, err := s.WebSocketPublicToken()
	if err != nil {
		log.Logger.Error(err.Error()) // Handle error
		return
	}

	tk := &kucoin.WebSocketTokenModel{}
	if err := rsp.ReadData(tk); err != nil {
		log.Logger.Error(err.Error())
		return
	}

	//创建 WebSocket 客户端并连接
	c := s.NewWebSocketClient(tk)

	//mc: 消息通道 (message channel)，用于接收 WebSocket 推送的消息
	//	类型为 chan *kucoin.WebSocketMessage
	//	用来接收从 KuCoin 交易所推送过来的实时价格数据
	//ec: 错误通道 (error channel)，用于接收连接或消息处理过程中的错误
	//	类型为 chan error
	//	用来接收连接断开、消息解析失败等错误信息
	//err: 连接建立时的错误信
	mc, ec, err := c.Connect()
	if err != nil {
		log.Logger.Sugar().Errorf("Error: %s", err.Error())
		return
	}

	ch := kucoin.NewSubscribeMessage("/market/ticker:PLGR-USDT", false)
	uch := kucoin.NewUnsubscribeMessage("/market/ticker:PLGR-USDT", false)

	if err := c.Subscribe(ch); err != nil {
		log.Logger.Error(err.Error()) // Handle error
		return
	}

	for {
		select {
		case err := <-ec:
			c.Stop() // Stop subscribing the WebSocket feed
			log.Logger.Sugar().Errorf("Error: %s", err.Error())
			_ = c.Unsubscribe(uch)
			return
		case msg := <-mc:
			t := &kucoin.TickerLevel1Model{}
			if err := msg.ReadData(t); err != nil {
				log.Logger.Sugar().Errorf("Failure to read: %s", err.Error())
				return
			}
			// 不断更新
			PlgrPriceChan <- t.Price
			PlgrPrice = t.Price
			//log.Logger.Sugar().Info("Price ", t.Price)
			_ = db.RedisSetString("plgr_price", PlgrPrice, 0)
		}
	}
}
