package v1

import (
	"github.com/ProjectsTask/EasySwapBase/errcode"
	"github.com/ProjectsTask/EasySwapBase/kit/validator"
	"github.com/ProjectsTask/EasySwapBase/xhttp"
	"github.com/gin-gonic/gin"

	"github.com/ProjectsTask/EasySwapBackend/src/service/svc"
	"github.com/ProjectsTask/EasySwapBackend/src/service/v1"
	"github.com/ProjectsTask/EasySwapBackend/src/types/v1"
)

func UserLoginHandler(svcCtx *svc.ServerCtx) gin.HandlerFunc {
	return func(c *gin.Context) {
		req := types.LoginReq{}
		if err := c.BindJSON(&req); err != nil {
			xhttp.Error(c, err)
			return
		}

		if err := validator.Verify(&req); err != nil {
			xhttp.Error(c, errcode.NewCustomErr(err.Error()))
			return
		}

		res, err := service.UserLogin(c.Request.Context(), svcCtx, req)
		if err != nil {
			xhttp.Error(c, errcode.NewCustomErr(err.Error()))
			return
		}

		xhttp.OkJson(c, types.UserLoginResp{
			Result: res,
		})
	}
}

// 此函数用于Web3登录流程中的消息生成环节，为用户生成一个唯一的、有时效性的登录消息，用于后续的签名验证过程。
func GetLoginMessageHandler(svcCtx *svc.ServerCtx) gin.HandlerFunc {
	return func(c *gin.Context) {
		//从URL路径参数中获取"address"参数值
		address := c.Params.ByName("address")
		//检查address是否为空
		if address == "" {
			xhttp.Error(c, errcode.NewCustomErr("user addr is null"))
			return
		}

		res, err := service.GetUserLoginMsg(c.Request.Context(), svcCtx, address)
		if err != nil {
			xhttp.Error(c, errcode.NewCustomErr(err.Error()))
			return
		}

		xhttp.OkJson(c, res)
	}
}

func GetSigStatusHandler(svcCtx *svc.ServerCtx) gin.HandlerFunc {
	return func(c *gin.Context) {
		userAddr := c.Params.ByName("address")
		if userAddr == "" {
			xhttp.Error(c, errcode.NewCustomErr("user addr is null"))
			return
		}

		res, err := service.GetSigStatusMsg(c.Request.Context(), svcCtx, userAddr)
		if err != nil {
			xhttp.Error(c, errcode.NewCustomErr(err.Error()))
			return
		}

		xhttp.OkJson(c, res)
	}
}
