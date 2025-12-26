package controllers

import (
	"net/http"
	"pledge-backend/api/models/ws"
	"pledge-backend/log"
	"pledge-backend/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// PriceController 是价格控制器，包含一个 NewPrice 方法，用于处理 WebSocket 连接以提供价格更新服务。
type PriceController struct {
}

func (c *PriceController) NewPrice(ctx *gin.Context) {

	// 错误恢复机制 使用 defer 和 recover() 捕获并记录运行时恐慌
	defer func() {
		recoverRes := recover()
		if recoverRes != nil {
			log.Logger.Sugar().Error("new price recover ", recoverRes)
		}
	}()
	//WebSocket 升级
	conn, err := (&websocket.Upgrader{
		ReadBufferSize:   1024,
		WriteBufferSize:  1024,
		HandshakeTimeout: 5 * time.Second,
		CheckOrigin: func(r *http.Request) bool { //Cross domain
			return true
		},
	}).Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Logger.Sugar().Error("websocket request err:", err)
		return
	}
	//从远程IP生成唯一ID：将IP地址的点号替换为下划线，加上23位随机字符串
	randomId := ""
	remoteIP, ok := ctx.RemoteIP()
	if ok {
		randomId = strings.Replace(remoteIP.String(), ".", "_", -1) + "_" + utils.GetRandomString(23)
	} else {
		randomId = utils.GetRandomString(32)
	}

	server := &ws.Server{
		Id:       randomId,
		Socket:   conn,                   // WebSocket 连接
		Send:     make(chan []byte, 800), //  发送通道，缓冲区大小800
		LastTime: time.Now().Unix(),      // 最后活动时间戳
	}

	go server.ReadAndWrite()
}
