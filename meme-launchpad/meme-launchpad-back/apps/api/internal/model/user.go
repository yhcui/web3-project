package model

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID        int64     `json:"id"`
	Address   string    `json:"address"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Avatar    string    `json:"avatar"`
	Nonce     string    `json:"nonce"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type UserModel struct {
	db *pgxpool.Pool
}

func NewUserModel(db *pgxpool.Pool) *UserModel {
	return &UserModel{db: db}
}

// FindByAddress 根据钱包地址查找用户
func (m *UserModel) FindByAddress(ctx context.Context, address string) (*User, error) {
	var user User
	err := m.db.QueryRow(ctx, `
		SELECT id, address, COALESCE(username, ''), COALESCE(email, ''), 
			COALESCE(avatar, ''), COALESCE(nonce, ''), created_at, updated_at
		FROM users
		WHERE LOWER(address) = LOWER($1)
	`, address).Scan(
		&user.ID, &user.Address, &user.Username, &user.Email,
		&user.Avatar, &user.Nonce, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID 根据ID查找用户
func (m *UserModel) FindByID(ctx context.Context, id int64) (*User, error) {
	var user User
	err := m.db.QueryRow(ctx, `
		SELECT id, address, COALESCE(username, ''), COALESCE(email, ''), 
			COALESCE(avatar, ''), COALESCE(nonce, ''), created_at, updated_at
		FROM users
		WHERE id = $1
	`, id).Scan(
		&user.ID, &user.Address, &user.Username, &user.Email,
		&user.Avatar, &user.Nonce, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Create 创建用户
func (m *UserModel) Create(ctx context.Context, user *User) error {
	return m.db.QueryRow(ctx, `
		INSERT INTO users (address, username, nonce, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`, user.Address, user.Username, user.Nonce).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

// UpdateNonce 更新用户nonce
func (m *UserModel) UpdateNonce(ctx context.Context, address, nonce string) error {
	_, err := m.db.Exec(ctx, `
		UPDATE users SET nonce = $1, updated_at = NOW()
		WHERE LOWER(address) = LOWER($2)
	`, nonce, address)
	return err
}

// Update 更新用户信息
func (m *UserModel) Update(ctx context.Context, user *User) error {
	_, err := m.db.Exec(ctx, `
		UPDATE users SET 
			username = COALESCE(NULLIF($1, ''), username),
			email = COALESCE(NULLIF($2, ''), email),
			avatar = COALESCE(NULLIF($3, ''), avatar),
			updated_at = NOW()
		WHERE id = $4
	`, user.Username, user.Email, user.Avatar, user.ID)
	return err
}

// GetOverviewStats 获取用户概览统计
func (m *UserModel) GetOverviewStats(ctx context.Context, address string) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 创建的代币数
	var createdTokens int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM tokens WHERE LOWER(creator_address) = LOWER($1)
	`, address).Scan(&createdTokens)
	if err != nil {
		return nil, err
	}
	stats["createdTokens"] = createdTokens

	// 其他统计...
	stats["heatedTokens"] = 0
	stats["ownedTokens"] = 0
	stats["pendingUnlockTokens"] = 0
	stats["totalTradeBnb"] = "0"

	return stats, nil
}

