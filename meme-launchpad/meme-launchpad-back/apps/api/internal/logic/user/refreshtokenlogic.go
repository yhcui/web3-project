package user

import (
	"context"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type RefreshTokenLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRefreshTokenLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RefreshTokenLogic {
	return &RefreshTokenLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RefreshTokenLogic) RefreshToken(req *types.RefreshTokenRequest) (*types.Response, error) {
	// 解析 refresh token
	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(l.svcCtx.Config.Auth.AccessSecret), nil
	})

	if err != nil || !token.Valid {
		return types.Error(401, "invalid or expired refresh token"), nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return types.Error(401, "invalid token claims"), nil
	}

	// 验证是否为 refresh token
	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "refresh" {
		return types.Error(401, "invalid token type"), nil
	}

	// 获取用户信息
	userIDFloat, ok := claims["userId"].(float64)
	if !ok {
		return types.Error(401, "invalid user id in token"), nil
	}
	userID := int64(userIDFloat)

	address, ok := claims["address"].(string)
	if !ok {
		return types.Error(401, "invalid address in token"), nil
	}

	// 生成新的 access token
	newAccessToken, err := l.generateAccessToken(userID, address)
	if err != nil {
		return types.Error(500, "failed to generate new token"), nil
	}

	// 生成新的 refresh token
	newRefreshToken, err := l.generateRefreshToken(userID, address)
	if err != nil {
		return types.Error(500, "failed to generate new refresh token"), nil
	}

	return types.Success(map[string]interface{}{
		"token":        newAccessToken,
		"refreshToken": newRefreshToken,
		"expiresIn":    l.svcCtx.Config.Auth.AccessExpire,
		"tokenType":    "Bearer",
	}), nil
}

func (l *RefreshTokenLogic) generateAccessToken(userID int64, address string) (string, error) {
	claims := jwt.MapClaims{
		"userId":  userID,
		"address": address,
		"exp":     time.Now().Add(time.Duration(l.svcCtx.Config.Auth.AccessExpire) * time.Second).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
}

func (l *RefreshTokenLogic) generateRefreshToken(userID int64, address string) (string, error) {
	claims := jwt.MapClaims{
		"userId":  userID,
		"address": address,
		"type":    "refresh",
		"exp":     time.Now().Add(time.Duration(l.svcCtx.Config.Auth.RefreshExpire) * time.Second).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
}

