package user

import (
	"net/http"

	"github.com/meme-launchpad/api/internal/logic/user"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetSignMsgHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GetSignMsgRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := user.NewGetSignMsgLogic(r.Context(), svcCtx)
		resp, err := l.GetSignMsg(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

