package user

import (
	"context"

	"github.com/meme-launchpad/api/internal/middleware"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetOverviewStatsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetOverviewStatsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetOverviewStatsLogic {
	return &GetOverviewStatsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetOverviewStatsLogic) GetOverviewStats(req *types.OverviewStatsRequest) (*types.Response, error) {
	// 获取当前用户地址
	address := req.Address
	if address == "" {
		address = middleware.GetAddressFromCtx(l.ctx)
	}

	if address == "" {
		return types.Error(400, "address is required"), nil
	}

	// 获取统计数据
	stats, err := l.svcCtx.UserModel.GetOverviewStats(l.ctx, address)
	if err != nil {
		l.Logger.Errorf("failed to get overview stats: %v", err)
		return types.Error(500, "failed to get stats"), nil
	}

	return types.Success(stats), nil
}

