package handler

import (
	"net/http"
	"strconv"

	"github.com/meme-launchpad/api/internal/handler/token"
	"github.com/meme-launchpad/api/internal/handler/user"
	"github.com/meme-launchpad/api/internal/logic/kline"
	"github.com/meme-launchpad/api/internal/middleware"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func RegisterHandlers(server *rest.Server, svcCtx *svc.ServiceContext) {
	// 创建认证中间件
	authMiddleware := middleware.NewAuthMiddleware(svcCtx.Config.Auth.AccessSecret)

	// ==================== 无需认证的接口 ====================

	// User 相关 - 无需认证
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/user/sign-msg",
				Handler: user.GetSignMsgHandler(svcCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/user/wallet-login",
				Handler: user.WalletLoginHandler(svcCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/user/refresh-token",
				Handler: user.RefreshTokenHandler(svcCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
	)

	// Token 相关 - 无需认证
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/token/token-list",
				Handler: token.GetTokenListHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/detail",
				Handler: token.GetTokenDetailHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/hot-pick",
				Handler: token.GetHotPickHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/trending-token",
				Handler: token.GetTrendingTokenHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/holders",
				Handler: token.GetTokenHoldersHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/ranking-token-list",
				Handler: token.GetRankingTokenListHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/overview-rankings",
				Handler: token.GetOverviewRankingsHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/token/advanced-token-list",
				Handler: token.GetAdvancedTokenListHandler(svcCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
	)

	// Comment 相关 - 无需认证
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/comment/list",
				Handler: commentListHandler(svcCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
	)

	// Trade 相关 - 无需认证
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/trade/list",
				Handler: tradeListHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/trade/upcoming-token",
				Handler: upcomingTokenHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/trade/almost-full-token",
				Handler: almostFullTokenHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/trade/today-launching-token",
				Handler: todayLaunchingTokenHandler(svcCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
	)

	// Kline 相关 - 无需认证
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/kline/history",
				Handler: klineHistoryHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/kline/history-with-cursor",
				Handler: klineHistoryWithCursorHandler(svcCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
	)

	// Invite 相关 - 无需认证
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/back/user-status",
				Handler: userStatusHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/back/user-commission",
				Handler: userCommissionHandler(svcCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/back/user-invites",
				Handler: userInvitesHandler(svcCtx),
			},
		},
		rest.WithPrefix("/api/v1"),
	)

	// ==================== 需要认证的接口 ====================

	// User 相关 - 需要认证
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{authMiddleware.Handle},
			[]rest.Route{
				{
					Method:  http.MethodGet,
					Path:    "/user/overview-stats",
					Handler: user.GetOverviewStatsHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/user/following-list",
					Handler: followingListHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/user/followers-list",
					Handler: followersListHandler(svcCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/v1"),
	)

	// Token 相关 - 需要认证
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{authMiddleware.Handle},
			[]rest.Route{
				{
					Method:  http.MethodPost,
					Path:    "/token/create-token",
					Handler: token.CreateTokenHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/token/calculate-address",
					Handler: token.CalculateAddressHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/token/favorite",
					Handler: token.FavoriteTokenHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/token/unfavorite",
					Handler: token.UnfavoriteTokenHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/token/my-ido-list",
					Handler: token.GetMyIdoListHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/token/my-created-token-list",
					Handler: token.GetMyCreatedTokenListHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/token/my-owned-token-list",
					Handler: token.GetMyOwnedTokenListHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/token/my-favorite-tokens",
					Handler: token.GetMyFavoriteTokensHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/token/trade-rankings-list",
					Handler: token.GetTradeRankingsListHandler(svcCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/v1"),
	)

	// Comment 相关 - 需要认证
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{authMiddleware.Handle},
			[]rest.Route{
				{
					Method:  http.MethodGet,
					Path:    "/comment/get-upload-url",
					Handler: commentUploadUrlHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/comment/post-comment",
					Handler: postCommentHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/comment/post-img-comment",
					Handler: postImgCommentHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/comment/delete",
					Handler: deleteCommentHandler(svcCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/v1"),
	)

	// File 相关 - 需要认证
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{authMiddleware.Handle},
			[]rest.Route{
				{
					Method:  http.MethodGet,
					Path:    "/file/token-logo-presign",
					Handler: tokenLogoPresignHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/file/token-banner-presign",
					Handler: tokenBannerPresignHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/file/activity-image-presign",
					Handler: activityImagePresignHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/file/upload-confirm",
					Handler: uploadConfirmHandler(svcCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/v1"),
	)

	// Activity 相关 - 需要认证
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{authMiddleware.Handle},
			[]rest.Route{
				{
					Method:  http.MethodGet,
					Path:    "/act/user-participated",
					Handler: userParticipatedHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/act/user-created",
					Handler: userCreatedHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/act/create",
					Handler: createActivityHandler(svcCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/v1"),
	)

	// Invite 相关 - 需要认证
	server.AddRoutes(
		rest.WithMiddlewares(
			[]rest.Middleware{authMiddleware.Handle},
			[]rest.Route{
				{
					Method:  http.MethodGet,
					Path:    "/back/agent-detail",
					Handler: agentDetailHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/back/agent-daily-commission",
					Handler: agentDailyCommissionHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/back/agent-daily-new-agents",
					Handler: agentDailyNewAgentsHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/back/agent-daily-trade-amount",
					Handler: agentDailyTradeAmountHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/back/agent-descendant-stats",
					Handler: agentDescendantStatsHandler(svcCtx),
				},
				{
					Method:  http.MethodPost,
					Path:    "/front/rebate_record",
					Handler: createRebateRecordHandler(svcCtx),
				},
				{
					Method:  http.MethodGet,
					Path:    "/front/rebate_record/check-status",
					Handler: checkRebateRecordStatusHandler(svcCtx),
				},
			}...,
		),
		rest.WithPrefix("/api/v1"),
	)
}

// ==================== 简化的 Handler 实现 ====================

// Comment handlers
func commentListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CommentListRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		comments, total, hasMore, err := svcCtx.CommentModel.FindList(r.Context(), req.TokenID, req.PageNo, req.PageSize, req.StartTime)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to get comments"))
			return
		}

		var result []map[string]interface{}
		for _, c := range comments {
			item := map[string]interface{}{
				"id":            c.ID,
				"holdingAmount": c.HoldingAmount,
				"walletAddress": c.WalletAddress,
				"createdAt":     c.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			}
			if c.Content.Valid {
				item["content"] = c.Content.String
			}
			if c.Img.Valid {
				item["img"] = c.Img.String
			}
			result = append(result, item)
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(map[string]interface{}{
			"comments": result,
			"total":    total,
			"hasMore":  hasMore,
		}))
	}
}

func commentUploadUrlHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(map[string]interface{}{
			"uploadUrl": "",
			"imageUrl":  "",
			"expiresAt": 0,
		}))
	}
}

func postCommentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(map[string]interface{}{"commentId": 0}))
	}
}

func postImgCommentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(nil))
	}
}

func deleteCommentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(nil))
	}
}

// Trade handlers
func tradeListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.TradeListRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		params := map[string]interface{}{
			"tokenAddress": req.TokenAddress,
			"pageNo":       req.PageNo,
			"pageSize":     req.PageSize,
			"orderBy":      req.OrderBy,
			"orderDesc":    req.OrderDesc,
		}

		trades, total, err := svcCtx.TradeModel.FindList(r.Context(), params)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to get trades"))
			return
		}

		var result []map[string]interface{}
		for _, t := range trades {
			result = append(result, map[string]interface{}{
				"blockNumber":     t.BlockNumber,
				"blockTimestamp":  t.BlockTimestamp.Format("2006-01-02T15:04:05Z07:00"),
				"bnbAmount":       t.BnbAmount,
				"tokenAmount":     t.TokenAmount,
				"price":           t.Price,
				"usdAmount":       t.UsdAmount,
				"tradeType":       t.TradeType,
				"transactionHash": t.TransactionHash,
				"userAddress":     t.UserAddress,
				"tokenAddress":    t.TokenAddress,
				"createdAt":       t.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(req.PageNo, req.PageSize, total, result)))
	}
}

func upcomingTokenHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

func almostFullTokenHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

func todayLaunchingTokenHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

// Kline handlers
func klineHistoryHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.KlineHistoryRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(400, "invalid request parameters"))
			return
		}

		l := kline.NewGetKlineHistoryLogic(r.Context(), svcCtx)
		resp, err := l.GetKlineHistory(&req)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, err.Error()))
			return
		}
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}

func klineHistoryWithCursorHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.KlineHistoryWithCursorRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(400, "invalid request parameters"))
			return
		}

		l := kline.NewGetKlineHistoryWithCursorLogic(r.Context(), svcCtx)
		resp, err := l.GetKlineHistoryWithCursor(&req)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, err.Error()))
			return
		}
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}

// File handlers
func tokenLogoPresignHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mimeType := r.URL.Query().Get("mimeType")
		chainIdStr := r.URL.Query().Get("chainId")
		if mimeType == "" {
			mimeType = "png"
		}
		chainId := 97 // 默认 BSC testnet
		if chainIdStr != "" {
			if id, err := strconv.Atoi(chainIdStr); err == nil {
				chainId = id
			}
		}

		if svcCtx.CosService == nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "COS service not configured"))
			return
		}

		result, err := svcCtx.CosService.GeneratePresignedUrl("token-logo", mimeType, chainId)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to generate presigned url"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(result))
	}
}

func tokenBannerPresignHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mimeType := r.URL.Query().Get("mimeType")
		chainIdStr := r.URL.Query().Get("chainId")
		if mimeType == "" {
			mimeType = "png"
		}
		chainId := 97
		if chainIdStr != "" {
			if id, err := strconv.Atoi(chainIdStr); err == nil {
				chainId = id
			}
		}

		if svcCtx.CosService == nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "COS service not configured"))
			return
		}

		result, err := svcCtx.CosService.GeneratePresignedUrl("token-banner", mimeType, chainId)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to generate presigned url"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(result))
	}
}

func activityImagePresignHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		mimeType := r.URL.Query().Get("mimeType")
		chainIdStr := r.URL.Query().Get("chainId")
		if mimeType == "" {
			mimeType = "png"
		}
		chainId := 97
		if chainIdStr != "" {
			if id, err := strconv.Atoi(chainIdStr); err == nil {
				chainId = id
			}
		}

		if svcCtx.CosService == nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "COS service not configured"))
			return
		}

		result, err := svcCtx.CosService.GeneratePresignedUrl("activity-image", mimeType, chainId)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to generate presigned url"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(result))
	}
}

func uploadConfirmHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(nil))
	}
}

// Activity handlers
func userParticipatedHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

func userCreatedHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

func createActivityHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(map[string]interface{}{
			"activityId": 0,
			"status":     1,
		}))
	}
}

// User handlers
func followingListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

func followersListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

// Invite handlers
func userStatusHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UserStatusRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		status, err := svcCtx.InviteModel.GetUserStatus(r.Context(), req.Address)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to get user status"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(status))
	}
}

func userCommissionHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UserStatusRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		commission, err := svcCtx.InviteModel.GetUserCommission(r.Context(), req.Address)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to get commission"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(commission))
	}
}

func userInvitesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UserInvitesRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		invites, total, err := svcCtx.InviteModel.GetUserInvites(r.Context(), req.Address, req.Page, req.Size)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to get invites"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(map[string]interface{}{
			"list":  invites,
			"total": total,
		}))
	}
}

func agentDetailHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(map[string]interface{}{}))
	}
}

func agentDailyCommissionHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success([]interface{}{}))
	}
}

func agentDailyNewAgentsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success([]interface{}{}))
	}
}

func agentDailyTradeAmountHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success([]interface{}{}))
	}
}

func agentDescendantStatsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(types.NewPageResponse(1, 10, 0, []interface{}{})))
	}
}

func createRebateRecordHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		httpx.OkJsonCtx(r.Context(), w, types.Success(nil))
	}
}

func checkRebateRecordStatusHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UserStatusRequest
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		hasPending, err := svcCtx.InviteModel.CheckRebateRecordStatus(r.Context(), req.Address)
		if err != nil {
			httpx.OkJsonCtx(r.Context(), w, types.Error(500, "failed to check status"))
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.Success(hasPending))
	}
}
