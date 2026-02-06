package kline

import (
	"context"
	"encoding/base64"
	"time"

	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

// GetKlineHistoryWithCursorLogic
type GetKlineHistoryWithCursorLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetKlineHistoryWithCursorLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetKlineHistoryWithCursorLogic {
	return &GetKlineHistoryWithCursorLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetKlineHistoryWithCursorLogic) GetKlineHistoryWithCursor(req *types.KlineHistoryWithCursorRequest) (*types.Response, error) {
	// 参数验证
	if req.TokenAddr == "" {
		return types.Error(400, "tokenAddr is required"), nil
	}
	if req.Interval == "" {
		return types.Error(400, "interval is required"), nil
	}

	// 验证interval格式
	validIntervals := map[string]bool{
		"1m": true, "5m": true, "15m": true, "30m": true,
		"1h": true, "4h": true, "1d": true, "1w": true,
	}
	if !validIntervals[req.Interval] {
		return types.Error(400, "invalid interval"), nil
	}

	// 设置默认limit
	limit := req.Limit
	if limit <= 0 {
		limit = 300
	}
	if limit > 1000 {
		limit = 1000
	}

	// 解析cursor（base64编码的时间戳）
	var cursorTime *time.Time
	if req.Cursor != "" {
		decoded, err := base64.StdEncoding.DecodeString(req.Cursor)
		if err == nil {
			// 尝试解析为RFC3339格式的时间字符串
			if t, err := time.Parse(time.RFC3339, string(decoded)); err == nil {
				cursorTime = &t
			}
		}
	}

	// 查询K线数据
	klines, err := l.svcCtx.KlineModel.FindByTokenAndInterval(l.ctx, req.TokenAddr, req.Interval, cursorTime, limit)
	if err != nil {
		l.Logger.Errorf("failed to get kline data: %v", err)
		return types.Error(500, "failed to get kline data"), nil
	}

	// 构建响应数据
	timestamps := make([]int64, 0, len(klines))
	opens := make([]string, 0, len(klines))
	highs := make([]string, 0, len(klines))
	lows := make([]string, 0, len(klines))
	closes := make([]string, 0, len(klines))
	volumes := make([]string, 0, len(klines))

	// 由于查询是按时间倒序（DESC），klines[0]是最新的数据，klines[len-1]是最早的数据
	// 需要反转数组以符合K线图的时间顺序（从早到晚）
	// 反转后：timestamps[0]是最早的数据，timestamps[len-1]是最新的数据
	for i := len(klines) - 1; i >= 0; i-- {
		k := klines[i]
		timestamps = append(timestamps, k.OpenTime.Unix())
		opens = append(opens, k.OpenPrice)
		highs = append(highs, k.HighPrice)
		lows = append(lows, k.LowPrice)
		closes = append(closes, k.ClosePrice)
		volumes = append(volumes, k.Volume)
	}

	// 生成下一个游标（使用最早的数据时间）
	var nextCursor string
	if len(klines) > 0 {
		// klines[len-1]是最早的数据，我们使用它作为cursor
		// 下次查询时使用 open_time < cursorTime，就能获取更早的数据
		earliestTime := klines[len(klines)-1].OpenTime
		nextCursor = base64.StdEncoding.EncodeToString([]byte(earliestTime.Format(time.RFC3339)))
	}

	response := map[string]interface{}{
		"cursor": nextCursor,
		"klines": map[string]interface{}{
			"s": "", // 空字符串表示成功
			"t": timestamps,
			"o": opens,
			"h": highs,
			"l": lows,
			"c": closes,
			"v": volumes,
		},
	}

	return types.Success(response), nil
}

// GetKlineHistoryLogic
type GetKlineHistoryLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetKlineHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetKlineHistoryLogic {
	return &GetKlineHistoryLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetKlineHistoryLogic) GetKlineHistory(req *types.KlineHistoryRequest) (*types.Response, error) {
	// 参数验证
	if req.TokenAddr == "" {
		return types.Error(400, "tokenAddr is required"), nil
	}
	if req.Interval == "" {
		return types.Error(400, "interval is required"), nil
	}
	if req.From <= 0 || req.To <= 0 {
		return types.Error(400, "from and to are required"), nil
	}
	if req.From > req.To {
		return types.Error(400, "from must be less than to"), nil
	}

	// 验证interval格式
	validIntervals := map[string]bool{
		"1m": true, "5m": true, "15m": true, "30m": true,
		"1h": true, "4h": true, "1d": true, "1w": true,
	}
	if !validIntervals[req.Interval] {
		return types.Error(400, "invalid interval"), nil
	}

	// 查询K线数据
	klines, err := l.svcCtx.KlineModel.FindByTokenAndIntervalRange(l.ctx, req.TokenAddr, req.Interval, req.From, req.To)
	if err != nil {
		l.Logger.Errorf("failed to get kline data: %v", err)
		return types.Error(500, "failed to get kline data"), nil
	}

	// 构建响应数据
	timestamps := make([]int64, 0, len(klines))
	opens := make([]string, 0, len(klines))
	highs := make([]string, 0, len(klines))
	lows := make([]string, 0, len(klines))
	closes := make([]string, 0, len(klines))
	volumes := make([]string, 0, len(klines))

	for _, k := range klines {
		timestamps = append(timestamps, k.OpenTime.Unix())
		opens = append(opens, k.OpenPrice)
		highs = append(highs, k.HighPrice)
		lows = append(lows, k.LowPrice)
		closes = append(closes, k.ClosePrice)
		volumes = append(volumes, k.Volume)
	}

	response := map[string]interface{}{
		"s": "ok", // "ok" 表示成功
		"t": timestamps,
		"o": opens,
		"h": highs,
		"l": lows,
		"c": closes,
		"v": volumes,
	}

	return types.Success(response), nil
}

