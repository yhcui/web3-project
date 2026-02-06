package user

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/meme-launchpad/api/internal/model"
	"github.com/meme-launchpad/api/internal/svc"
	"github.com/meme-launchpad/api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type WalletLoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewWalletLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *WalletLoginLogic {
	return &WalletLoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *WalletLoginLogic) WalletLogin(req *types.WalletLoginRequest) (*types.Response, error) {
	address := strings.ToLower(req.Address)

	// 验证地址格式
	if len(address) != 42 || !strings.HasPrefix(address, "0x") {
		return types.Error(400, "invalid address format"), nil
	}

	// 从 Redis 获取 nonce
	cacheKey := fmt.Sprintf("sign_msg:%s", address)
	nonce, err := l.svcCtx.Redis.Get(l.ctx, cacheKey).Result()
	if err != nil {
		return types.Error(400, "nonce expired or not found, please request sign message again"), nil
	}

	// 构建原始消息
	message := fmt.Sprintf(
		"Welcome to Coinroll!\n\nClick to sign in and accept the Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n%s\n\nNonce:\n%s",
		address,
		nonce,
	)

	// 验证签名
	if !verifySignature(address, message, req.Signature) {
		return types.Error(400, "invalid signature"), nil
	}

	// 删除已使用的 nonce
	l.svcCtx.Redis.Del(l.ctx, cacheKey)

	// 查找或创建用户
	user, err := l.svcCtx.UserModel.FindByAddress(l.ctx, address)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// 创建新用户
			newNonce := generateNonce()
			user = &model.User{
				Address:  address,
				Username: shortenAddress(address),
				Nonce:    newNonce,
			}
			if err := l.svcCtx.UserModel.Create(l.ctx, user); err != nil {
				l.Logger.Errorf("failed to create user: %v", err)
				return types.Error(500, "failed to create user"), nil
			}
		} else {
			l.Logger.Errorf("failed to find user: %v", err)
			return types.Error(500, "database error"), nil
		}
	} else {
		// 更新 nonce
		newNonce := generateNonce()
		if err := l.svcCtx.UserModel.UpdateNonce(l.ctx, address, newNonce); err != nil {
			l.Logger.Errorf("failed to update nonce: %v", err)
		}
	}

	// 生成 JWT
	accessToken, err := l.generateAccessToken(user)
	if err != nil {
		return types.Error(500, "failed to generate token"), nil
	}

	refreshToken, err := l.generateRefreshToken(user)
	if err != nil {
		return types.Error(500, "failed to generate refresh token"), nil
	}

	return types.Success(types.LoginResponse{
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    l.svcCtx.Config.Auth.AccessExpire,
		TokenType:    "Bearer",
		User: map[string]interface{}{
			"id":        user.ID,
			"address":   user.Address,
			"username":  user.Username,
			"email":     user.Email,
			"avatar":    user.Avatar,
			"createdAt": user.CreatedAt.Format(time.RFC3339),
			"updatedAt": user.UpdatedAt.Format(time.RFC3339),
		},
	}), nil
}

func (l *WalletLoginLogic) generateAccessToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"userId":  user.ID,
		"address": user.Address,
		"exp":     time.Now().Add(time.Duration(l.svcCtx.Config.Auth.AccessExpire) * time.Second).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
}

func (l *WalletLoginLogic) generateRefreshToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"userId":  user.ID,
		"address": user.Address,
		"type":    "refresh",
		"exp":     time.Now().Add(time.Duration(l.svcCtx.Config.Auth.RefreshExpire) * time.Second).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(l.svcCtx.Config.Auth.AccessSecret))
}

// verifySignature 验证以太坊签名
func verifySignature(address, message, signature string) bool {
	// 添加以太坊签名前缀
	prefix := fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(message))
	prefixedMessage := prefix + message

	// 计算消息哈希
	hash := crypto.Keccak256Hash([]byte(prefixedMessage))

	// 解码签名
	sigBytes, err := hexutil.Decode(signature)
	if err != nil {
		return false
	}

	// 调整 v 值
	if len(sigBytes) != 65 {
		return false
	}
	if sigBytes[64] >= 27 {
		sigBytes[64] -= 27
	}

	// 恢复公钥
	pubKey, err := crypto.SigToPub(hash.Bytes(), sigBytes)
	if err != nil {
		return false
	}

	// 从公钥获取地址
	recoveredAddress := crypto.PubkeyToAddress(*pubKey)

	// 比较地址
	return strings.EqualFold(recoveredAddress.Hex(), address)
}

func generateNonce() string {
	nonceBytes := make([]byte, 16)
	rand.Read(nonceBytes)
	return hex.EncodeToString(nonceBytes)
}

func shortenAddress(address string) string {
	if len(address) < 10 {
		return address
	}
	return address[:6] + "..." + address[len(address)-4:]
}

// 用于确保地址格式正确
func _ (address string) common.Address {
	return common.HexToAddress(address)
}

