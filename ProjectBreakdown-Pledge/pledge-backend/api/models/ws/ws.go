package ws

import (
	"encoding/json"
	"errors"
	"pledge-backend/api/models/kucoin"
	"pledge-backend/config"
	"pledge-backend/log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const SuccessCode = 0
const PongCode = 1
const ErrorCode = -1

type Server struct {
	sync.Mutex
	Id       string
	Socket   *websocket.Conn
	Send     chan []byte
	LastTime int64 // last send time
}

type ServerManager struct {
	Servers    sync.Map
	Broadcast  chan []byte
	Register   chan *Server
	Unregister chan *Server
}

type Message struct {
	Code int    `json:"code"`
	Data string `json:"data"`
}

var Manager = ServerManager{}
var UserPingPongDurTime = config.Config.Env.WssTimeoutDuration // seconds

func (s *Server) SendToClient(data string, code int) {
	s.Lock()
	defer s.Unlock()

	dataBytes, err := json.Marshal(Message{
		Code: code,
		Data: data,
	})
	err = s.Socket.WriteMessage(websocket.TextMessage, dataBytes)
	if err != nil {
		log.Logger.Sugar().Error(s.Id+" SendToClient err ", err)
	}
}

func (s *Server) ReadAndWrite() {

	errChan := make(chan error)

	// 将当前服务器实例存储到 Manager.Servers 中
	Manager.Servers.Store(s.Id, s)

	//延迟清理: 在方法结束时：1、从服务器管理器中删除当前实例 2、关闭 WebSocket连接 3、关闭发送通道
	defer func() {
		Manager.Servers.Delete(s)
		_ = s.Socket.Close()
		close(s.Send)
	}()

	/*
		并发写操作 (goroutine 1)
			通道监听: 持续监听 s.Send 通道
			消息发送: 将接收到的消息通过 SendToClient 方法发送给客户端
			错误处理: 当通道关闭时发送错误信号到 errChan

	*/
	//write
	go func() {
		for {
			select {
			case message, ok := <-s.Send:
				if !ok {
					errChan <- errors.New("write message error")
					return
				}
				s.SendToClient(string(message), SuccessCode)
			}
		}
	}()

	/*
	   并发读操作 (goroutine 2)
	   消息读取: 持续从 WebSocket 连接读取消息
	   心跳处理: 检测 "ping" 消息并回复 "pong"，更新 LastTime 时间戳
	   错误处理: 读取错误时发送错误信号到 errChan
	*/
	//read
	go func() {
		for {

			_, message, err := s.Socket.ReadMessage()
			if err != nil {
				log.Logger.Sugar().Error(s.Id+" ReadMessage err ", err)
				errChan <- err
				return
			}

			//update heartbeat time
			if string(message) == "ping" || string(message) == `"ping"` || string(message) == "'ping'" {
				s.LastTime = time.Now().Unix()
				s.SendToClient("pong", PongCode)
			}
			continue

		}
	}()

	/*
		心跳检测主循环
			定时检查: 每秒检查一次连接状态
			超时判断: 如果最后活动时间超过 UserPingPongDurTime 配置值，发送错误代码并返回
			错误响应: 监听错误通道，收到错误时记录日志并返回
	*/
	//check heartbeat
	for {
		select {
		case <-time.After(time.Second):
			if time.Now().Unix()-s.LastTime >= UserPingPongDurTime {
				s.SendToClient("heartbeat timeout", ErrorCode)
				return
			}
		case err := <-errChan:
			log.Logger.Sugar().Error(s.Id, " ReadAndWrite returned ", err)
			return
		}
	}
}

func StartServer() {
	log.Logger.Info("WsServer start")
	for {
		select {
		case price, ok := <-kucoin.PlgrPriceChan:
			if ok {
				Manager.Servers.Range(func(key, value interface{}) bool {
					value.(*Server).SendToClient(price, SuccessCode)
					return true
				})
			}
		}
	}
}
