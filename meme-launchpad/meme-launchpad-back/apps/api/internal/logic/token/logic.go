package token

import (
	"context"
	"math/big"
	"time"

	"github.com/meme-launchpad/api/internal/middleware"
	tokenservice "github.com/meme-launchpad/api/internal/service/token"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

// GetTokenListLogic
type GetTokenListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTokenListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTokenListLogic {
	return &GetTokenListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetTokenListLogic) GetTokenList(req *types.TokenListRequest) (*types.Response, error) {
	params := map[string]interface{}{
		"pageNo":     req.PageNo,
		"pageSize":   req.PageSize,
		"sort":       req.Sort,
		"launchMode": req.LaunchMode,
	}

	tokens, total, err := l.svcCtx.TokenModel.FindList(l.ctx, params)
	if err != nil {
		l.Logger.Errorf("failed to get token list: %v", err)
		return types.Error(500, "failed to get tokens"), nil
	}

	// 转换为响应格式
	var result []map[string]interface{}
	for _, t := range tokens {
		// 计算进度百分比: (bnb_current / bnb_target) * 100
		progressPct := "0"
		if t.BnbTarget != "" && t.BnbTarget != "0" {
			current, _, err := new(big.Float).SetPrec(256).Parse(t.BnbCurrent, 10)
			if err == nil {
				target, _, err := new(big.Float).SetPrec(256).Parse(t.BnbTarget, 10)
				if err == nil && target.Sign() > 0 {
					// 计算百分比: (current / target) * 100
					percent := new(big.Float).Quo(current, target)
					percent = percent.Mul(percent, big.NewFloat(100))
					// 限制最大值为100
					if percent.Cmp(big.NewFloat(100)) > 0 {
						percent = big.NewFloat(100)
					}
					progressPct = percent.Text('f', 2)
				}
			}
		}

		item := map[string]interface{}{
			"id":          t.ID,
			"name":        t.Name,
			"symbol":      t.Symbol,
			"logo":        t.Logo,
			"tokenAddr":   t.TokenContractAddress,
			"launchMode":  t.LaunchMode,
			"launchTime":  t.LaunchTime,
			"currentBnb":  t.BnbCurrent,
			"targetBnb":   t.BnbTarget,
			"progressPct": progressPct,
			"marketCap":   "0",
			"hot":         t.Hot,
			"tokenLv":     t.TokenLv,
			"tokenRank":   t.TokenRank,
			"createdAt":   t.CreatedAt.Format(time.RFC3339),
		}
		if t.Banner.Valid {
			item["banner"] = t.Banner.String
		}
		if t.Description.Valid {
			item["description"] = t.Description.String
		}
		result = append(result, item)
	}

	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, total, result)), nil
}

// GetTokenDetailLogic
type GetTokenDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTokenDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTokenDetailLogic {
	return &GetTokenDetailLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetTokenDetailLogic) GetTokenDetail(req *types.TokenDetailRequest) (*types.Response, error) {
	token, err := l.svcCtx.TokenModel.FindByAddress(l.ctx, req.TokenAddress)
	if err != nil {
		return types.Error(404, "token not found"), nil
	}

	// 获取24小时交易统计
	stats, _ := l.svcCtx.TradeModel.Get24HStats(l.ctx, req.TokenAddress)

	// 计算进度百分比: (bnb_current / bnb_target) * 100
	progressPct := "0"
	if token.BnbTarget != "" && token.BnbTarget != "0" {
		current, _, err := new(big.Float).SetPrec(256).Parse(token.BnbCurrent, 10)
		if err == nil {
			target, _, err := new(big.Float).SetPrec(256).Parse(token.BnbTarget, 10)
			if err == nil && target.Sign() > 0 {
				// 计算百分比: (current / target) * 100
				percent := new(big.Float).Quo(current, target)
				percent = percent.Mul(percent, big.NewFloat(100))
				// 限制最大值为100
				if percent.Cmp(big.NewFloat(100)) > 0 {
					percent = big.NewFloat(100)
				}
				progressPct = percent.Text('f', 2)
			}
		}
	}

	result := map[string]interface{}{
		"id":                   token.ID,
		"name":                 token.Name,
		"symbol":               token.Symbol,
		"logo":                 token.Logo,
		"tokenContractAddress": token.TokenContractAddress,
		"creatorAddress":       token.CreatorAddress,
		"launchMode":           token.LaunchMode,
		"launchTime":           token.LaunchTime,
		"bnbCurrent":           token.BnbCurrent,
		"bnbTarget":            token.BnbTarget,
		"progressPct":          progressPct,
		"totalSupply":          token.TotalSupply,
		"status":               token.Status,
		"buyCount24H":          stats["buyCount"],
		"sellCount24H":         stats["sellCount"],
		"totalVolume24H":       stats["totalVolume"],
		"nonce":                token.Nonce,
	}

	if token.Banner.Valid {
		result["banner"] = token.Banner.String
	}
	if token.Description.Valid {
		result["description"] = token.Description.String
	}
	if token.Website.Valid {
		result["website"] = token.Website.String
	}
	if token.Twitter.Valid {
		result["twitter"] = token.Twitter.String
	}
	if token.Telegram.Valid {
		result["telegram"] = token.Telegram.String
	}

	return types.Success(result), nil
}

// GetHotPickLogic
type GetHotPickLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetHotPickLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetHotPickLogic {
	return &GetHotPickLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetHotPickLogic) GetHotPick() (*types.Response, error) {
	tokens, err := l.svcCtx.TokenModel.GetHotPick(l.ctx, 10)
	if err != nil {
		return types.Error(500, "failed to get hot picks"), nil
	}

	var result []map[string]interface{}
	for _, t := range tokens {
		result = append(result, map[string]interface{}{
			"tokenID":     t.ID,
			"tokenName":   t.Name,
			"tokenSymbol": t.Symbol,
			"tokenAddr":   t.TokenContractAddress,
			"tokenLogo":   t.Logo,
			"tokenPrice":  "0",
			"priceChange": "0",
			"marketCap":   "0",
			"isFavorite":  false,
		})
	}

	return types.Success(result), nil
}

// GetTrendingTokenLogic
type GetTrendingTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTrendingTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTrendingTokenLogic {
	return &GetTrendingTokenLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetTrendingTokenLogic) GetTrendingToken(req *types.TokenListRequest) (*types.Response, error) {
	params := map[string]interface{}{
		"pageNo":   req.PageNo,
		"pageSize": req.PageSize,
		"sort":     "hot",
	}

	tokens, total, err := l.svcCtx.TokenModel.FindList(l.ctx, params)
	if err != nil {
		return types.Error(500, "failed to get trending tokens"), nil
	}

	var result []map[string]interface{}
	for _, t := range tokens {
		result = append(result, map[string]interface{}{
			"id":         t.ID,
			"name":       t.Name,
			"symbol":     t.Symbol,
			"logo":       t.Logo,
			"tokenAddr":  t.TokenContractAddress,
			"launchMode": t.LaunchMode,
			"hot":        t.Hot,
		})
	}

	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, total, result)), nil
}

// GetTokenHoldersLogic
type GetTokenHoldersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTokenHoldersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTokenHoldersLogic {
	return &GetTokenHoldersLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetTokenHoldersLogic) GetTokenHolders(req *types.TokenHoldersRequest) (*types.Response, error) {
	holders, total, err := l.svcCtx.TokenModel.GetTokenHolders(l.ctx, req.TokenAddress, req.PageNo, req.PageSize)
	if err != nil {
		return types.Error(500, "failed to get holders"), nil
	}

	return types.Success(map[string]interface{}{
		"holders": holders,
		"total":   total,
	}), nil
}

// CreateTokenLogic
type CreateTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateTokenLogic {
	return &CreateTokenLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *CreateTokenLogic) CreateToken(req *types.CreateTokenRequest) (*types.Response, error) {
	// 获取当前用户
	userID := middleware.GetUserIDFromCtx(l.ctx)
	address := middleware.GetAddressFromCtx(l.ctx)

	if userID == 0 || address == "" {
		return types.Error(401, "unauthorized"), nil
	}

	// 检查 TokenService 是否可用
	if l.svcCtx.TokenService == nil {
		l.Logger.Error("TokenService is not initialized")
		return types.Error(500, "service not available"), nil
	}

	// 调用 TokenService 创建代币
	resp, err := l.svcCtx.TokenService.CreateToken(l.ctx, &tokenservice.CreateTokenRequest{
		Name:                 req.Name,
		Symbol:               req.Symbol,
		Description:          req.Description,
		Logo:                 req.Logo,
		Banner:               req.Banner,
		Creator:              address,
		LaunchMode:           req.LaunchMode,
		LaunchTime:           req.LaunchTime,
		InitialBuyPercentage: int(req.PreBuyPercent * 10000), // 转换为 basis points
		Website:              req.Website,
		Twitter:              req.Twitter,
		Telegram:             req.Telegram,
		Discord:              req.Discord,
		Whitepaper:           req.Whitepaper,
		ContactEmail:         req.ContractEmail,
		ContactTg:            req.ContractTg,
		Tags:                 req.Tags,
		Digits:               req.Digits,
		PredictedAddress:     req.PredictedAddress,
	})

	if err != nil {
		l.Logger.Errorf("failed to create token: %v", err)
		return types.Error(500, "failed to create token: "+err.Error()), nil
	}

	return types.Success(types.CreateTokenResponse{
		Create2Salt:      resp.Create2Salt,
		CreateArg:        resp.CreateArg,
		Nonce:            int(resp.Nonce),
		PredictedAddress: resp.PredictedAddress,
		RequestID:        resp.RequestID,
		Signature:        resp.Signature,
		Timestamp:        resp.Timestamp,
	}), nil
}

// CalculateAddressLogic
type CalculateAddressLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCalculateAddressLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CalculateAddressLogic {
	return &CalculateAddressLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *CalculateAddressLogic) CalculateAddress(req *types.CalculateAddressRequest) (*types.Response, error) {
	// 检查 TokenService 是否可用
	if l.svcCtx.TokenService == nil {
		l.Logger.Error("TokenService is not initialized")
		return types.Error(500, "service not available"), nil
	}

	// 调用 TokenService 计算地址
	resp, err := l.svcCtx.TokenService.CalculateAddress(l.ctx, &tokenservice.CalculateAddressRequest{
		Name:   req.Name,
		Symbol: req.Symbol,
		Digits: req.Digits,
	})

	if err != nil {
		l.Logger.Errorf("failed to calculate address: %v", err)
		return types.Error(500, "failed to calculate address: "+err.Error()), nil
	}

	return types.Success(types.CalculateAddressResponse{
		PredictedAddress: resp.PredictedAddress,
		Salt:             resp.Salt,
	}), nil
}

// FavoriteTokenLogic
type FavoriteTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewFavoriteTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FavoriteTokenLogic {
	return &FavoriteTokenLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *FavoriteTokenLogic) FavoriteToken(req *types.FavoriteTokenRequest) (*types.Response, error) {
	userID := middleware.GetUserIDFromCtx(l.ctx)
	if userID == 0 {
		return types.Error(401, "unauthorized"), nil
	}

	if err := l.svcCtx.TokenModel.AddFavorite(l.ctx, userID, req.TokenID); err != nil {
		return types.Error(500, "failed to add favorite"), nil
	}

	return types.Success(nil), nil
}

// UnfavoriteTokenLogic
type UnfavoriteTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUnfavoriteTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UnfavoriteTokenLogic {
	return &UnfavoriteTokenLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *UnfavoriteTokenLogic) UnfavoriteToken(req *types.FavoriteTokenRequest) (*types.Response, error) {
	userID := middleware.GetUserIDFromCtx(l.ctx)
	if userID == 0 {
		return types.Error(401, "unauthorized"), nil
	}

	if err := l.svcCtx.TokenModel.RemoveFavorite(l.ctx, userID, req.TokenID); err != nil {
		return types.Error(500, "failed to remove favorite"), nil
	}

	return types.Success(nil), nil
}

// GetMyIdoListLogic
type GetMyIdoListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyIdoListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyIdoListLogic {
	return &GetMyIdoListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetMyIdoListLogic) GetMyIdoList(req *types.MyTokenListRequest) (*types.Response, error) {
	// TODO: 实现 IDO 列表查询
	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, 0, []interface{}{})), nil
}

// GetMyCreatedTokenListLogic
type GetMyCreatedTokenListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyCreatedTokenListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyCreatedTokenListLogic {
	return &GetMyCreatedTokenListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetMyCreatedTokenListLogic) GetMyCreatedTokenList(req *types.MyTokenListRequest) (*types.Response, error) {
	// TODO: 实现我创建的代币列表
	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, 0, []interface{}{})), nil
}

// GetMyOwnedTokenListLogic
type GetMyOwnedTokenListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyOwnedTokenListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyOwnedTokenListLogic {
	return &GetMyOwnedTokenListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetMyOwnedTokenListLogic) GetMyOwnedTokenList(req *types.MyTokenListRequest) (*types.Response, error) {
	// TODO: 实现我拥有的代币列表
	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, 0, []interface{}{})), nil
}

// GetMyFavoriteTokensLogic
type GetMyFavoriteTokensLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyFavoriteTokensLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyFavoriteTokensLogic {
	return &GetMyFavoriteTokensLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetMyFavoriteTokensLogic) GetMyFavoriteTokens(req *types.MyTokenListRequest) (*types.Response, error) {
	// 从 context 获取用户 ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		userIdFloat, ok := l.ctx.Value("userId").(float64)
		if ok {
			userId = int64(userIdFloat)
		}
	}
	if userId == 0 {
		return types.Error(401, "unauthorized"), nil
	}

	// 分页参数
	pageNo := req.PageNo
	pageSize := req.PageSize
	if pageNo < 1 {
		pageNo = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (pageNo - 1) * pageSize

	// 查询总数
	var total int
	err := l.svcCtx.DB.QueryRow(l.ctx, `
		SELECT COUNT(*) FROM user_favorites uf
		JOIN tokens t ON uf.token_id = t.id
		WHERE uf.user_id = $1
	`, userId).Scan(&total)
	if err != nil {
		l.Logger.Errorf("failed to count favorites: %v", err)
		return types.Error(500, "database error"), nil
	}

	// 查询收藏的代币
	rows, err := l.svcCtx.DB.Query(l.ctx, `
		SELECT t.id, t.name, t.symbol, COALESCE(t.logo, ''), t.token_contract_address,
			t.creator_address, t.launch_mode, t.launch_time,
			COALESCE(t.bnb_current, 0)::text, COALESCE(t.bnb_target, 0)::text, 
			COALESCE(t.total_supply, 0)::text, COALESCE(t.status, 1),
			t.created_at, uf.created_at as favorited_at
		FROM user_favorites uf
		JOIN tokens t ON uf.token_id = t.id
		WHERE uf.user_id = $1
		ORDER BY uf.created_at DESC
		LIMIT $2 OFFSET $3
	`, userId, pageSize, offset)
	if err != nil {
		l.Logger.Errorf("failed to query favorites: %v", err)
		return types.Error(500, "database error"), nil
	}
	defer rows.Close()

	var tokens []map[string]interface{}
	for rows.Next() {
		var id int64
		var name, symbol, logo, tokenAddress, creatorAddress string
		var launchMode, status int
		var launchTime int64
		var bnbCurrent, bnbTarget, totalSupply string
		var createdAt, favoritedAt interface{}

		if err := rows.Scan(&id, &name, &symbol, &logo, &tokenAddress,
			&creatorAddress, &launchMode, &launchTime,
			&bnbCurrent, &bnbTarget, &totalSupply, &status,
			&createdAt, &favoritedAt); err != nil {
			l.Logger.Errorf("failed to scan row: %v", err)
			continue
		}

		tokens = append(tokens, map[string]interface{}{
			"id":                   id,
			"name":                 name,
			"symbol":               symbol,
			"logo":                 logo,
			"tokenContractAddress": tokenAddress,
			"creatorAddress":       creatorAddress,
			"launchMode":           launchMode,
			"launchTime":           launchTime,
			"bnbCurrent":           bnbCurrent,
			"bnbTarget":            bnbTarget,
			"totalSupply":          totalSupply,
			"status":               status,
			"isFavorite":           true,
		})
	}

	if tokens == nil {
		tokens = []map[string]interface{}{}
	}

	return types.Success(types.NewPageResponse(pageNo, pageSize, total, tokens)), nil
}

// GetRankingTokenListLogic
type GetRankingTokenListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetRankingTokenListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetRankingTokenListLogic {
	return &GetRankingTokenListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetRankingTokenListLogic) GetRankingTokenList(req *types.RankingTokenListRequest) (*types.Response, error) {
	// TODO: 实现排行榜代币列表
	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, 0, []interface{}{})), nil
}

// GetOverviewRankingsLogic
type GetOverviewRankingsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetOverviewRankingsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOverviewRankingsLogic {
	return &GetOverviewRankingsLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetOverviewRankingsLogic) GetOverviewRankings(req *types.OverviewRankingsRequest) (*types.Response, error) {
	return types.Success(map[string]interface{}{
		"hot":          []interface{}{},
		"new":          []interface{}{},
		"topGainer":    []interface{}{},
		"topVolume":    []interface{}{},
		"topMarketCap": []interface{}{},
	}), nil
}

// GetAdvancedTokenListLogic
type GetAdvancedTokenListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAdvancedTokenListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAdvancedTokenListLogic {
	return &GetAdvancedTokenListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetAdvancedTokenListLogic) GetAdvancedTokenList(req *types.AdvancedTokenListRequest) (*types.Response, error) {
	// TODO: 实现高级筛选代币列表
	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, 0, []interface{}{})), nil
}

// GetTradeRankingsListLogic
type GetTradeRankingsListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTradeRankingsListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTradeRankingsListLogic {
	return &GetTradeRankingsListLogic{Logger: logx.WithContext(ctx), ctx: ctx, svcCtx: svcCtx}
}

func (l *GetTradeRankingsListLogic) GetTradeRankingsList(req *types.RankingTokenListRequest) (*types.Response, error) {
	// TODO: 实现交易排行榜
	return types.Success(types.NewPageResponse(req.PageNo, req.PageSize, 0, []interface{}{})), nil
}
