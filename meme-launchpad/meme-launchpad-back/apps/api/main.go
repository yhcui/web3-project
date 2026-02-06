package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"

	"github.com/meme-launchpad/api/internal/config"
	"github.com/meme-launchpad/api/internal/handler"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// 确保 context 被使用
var _ = context.Background

var configFile = flag.String("f", "etc/api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	server := rest.MustNewServer(c.RestConf, rest.WithCors())
	defer server.Stop()

	// 自定义错误处理
	httpx.SetErrorHandlerCtx(func(ctx context.Context, err error) (int, any) {
		return http.StatusOK, map[string]interface{}{
			"code":    500,
			"message": err.Error(),
		}
	})

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}

