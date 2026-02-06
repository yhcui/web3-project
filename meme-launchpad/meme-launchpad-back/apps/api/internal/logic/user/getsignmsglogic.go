package user

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type GetSignMsgLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSignMsgLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetSignMsgLogic {
	return &GetSignMsgLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSignMsgLogic) GetSignMsg(req *types.GetSignMsgRequest) (*types.Response, error) {
	address := strings.ToLower(req.Address)

	// 验证地址格式
	if len(address) != 42 || !strings.HasPrefix(address, "0x") {
		return types.Error(400, "invalid address format"), nil
	}

	// 生成随机 nonce
	nonceBytes := make([]byte, 16)
	if _, err := rand.Read(nonceBytes); err != nil {
		return types.Error(500, "failed to generate nonce"), nil
	}
	nonce := hex.EncodeToString(nonceBytes)

	// 设置过期时间 (5分钟)
	expiry := time.Now().Add(5 * time.Minute).Unix()

	// 构建签名消息
	message := fmt.Sprintf(
		"Welcome to Coinroll!\n\nClick to sign in and accept the Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n%s\n\nNonce:\n%s",
		address,
		nonce,
	)

	// 存储 nonce 到 Redis (用于后续验证)
	cacheKey := fmt.Sprintf("sign_msg:%s", address)
	l.svcCtx.Redis.Set(l.ctx, cacheKey, nonce, 5*time.Minute)

	return types.Success(types.GetSignMsgResponse{
		Message: message,
		Nonce:   nonce,
		Expiry:  expiry,
	}), nil
}

