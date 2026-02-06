package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/zeromicro/go-zero/rest/httpx"
)

type AuthMiddleware struct {
	accessSecret string
}

func NewAuthMiddleware(accessSecret string) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret}
}

// UserClaims JWT claims
type UserClaims struct {
	UserID  int64  `json:"userId"`
	Address string `json:"address"`
	jwt.RegisteredClaims
}

type ctxKey string

const (
	CtxUserIDKey  ctxKey = "userId"
	CtxAddressKey ctxKey = "address"
)

func (m *AuthMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 获取 Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			httpx.ErrorCtx(r.Context(), w, NewAuthError("missing authorization header"))
			return
		}

		// 解析 Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			httpx.ErrorCtx(r.Context(), w, NewAuthError("invalid authorization format"))
			return
		}

		tokenString := parts[1]

		// 解析 JWT
		token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.accessSecret), nil
		})

		if err != nil || !token.Valid {
			httpx.ErrorCtx(r.Context(), w, NewAuthError("invalid or expired token"))
			return
		}

		claims, ok := token.Claims.(*UserClaims)
		if !ok {
			httpx.ErrorCtx(r.Context(), w, NewAuthError("invalid token claims"))
			return
		}

		// 将用户信息添加到 context
		ctx := context.WithValue(r.Context(), CtxUserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, CtxAddressKey, claims.Address)

		next(w, r.WithContext(ctx))
	}
}

// GetUserIDFromCtx 从 context 获取用户ID
func GetUserIDFromCtx(ctx context.Context) int64 {
	if userID, ok := ctx.Value(CtxUserIDKey).(int64); ok {
		return userID
	}
	return 0
}

// GetAddressFromCtx 从 context 获取钱包地址
func GetAddressFromCtx(ctx context.Context) string {
	if address, ok := ctx.Value(CtxAddressKey).(string); ok {
		return address
	}
	return ""
}

// AuthError 认证错误
type AuthError struct {
	Message string
}

func NewAuthError(message string) *AuthError {
	return &AuthError{Message: message}
}

func (e *AuthError) Error() string {
	return e.Message
}

