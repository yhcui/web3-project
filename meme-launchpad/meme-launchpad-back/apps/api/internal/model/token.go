package model

import (
	"context"
	"database/sql"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Token struct {
	ID                   int64          `json:"id"`
	Name                 string         `json:"name"`
	Symbol               string         `json:"symbol"`
	Logo                 string         `json:"logo"`
	Banner               sql.NullString `json:"banner"`
	Description          sql.NullString `json:"description"`
	TokenContractAddress string         `json:"tokenContractAddress"`
	CreatorAddress       string         `json:"creatorAddress"`
	LaunchMode           int            `json:"launchMode"`
	LaunchTime           int64          `json:"launchTime"`
	BnbCurrent           string         `json:"bnbCurrent"`
	BnbTarget            string         `json:"bnbTarget"`
	MarginBnb            string         `json:"marginBnb"`
	TotalSupply          string         `json:"totalSupply"`
	Status               int            `json:"status"` // 1=预售中, 2=已上线, 3=已毕业
	Website              sql.NullString `json:"website"`
	Twitter              sql.NullString `json:"twitter"`
	Telegram             sql.NullString `json:"telegram"`
	Discord              sql.NullString `json:"discord"`
	Whitepaper           sql.NullString `json:"whitepaper"`
	Tags                 []string       `json:"tags"`
	Hot                  int            `json:"hot"`
	TokenLv              int            `json:"tokenLv"`
	TokenRank            int            `json:"tokenRank"`
	RequestID            string         `json:"requestId"`
	Nonce                int            `json:"nonce"`
	Salt                 string         `json:"salt"`
	PreBuyPercent        float64        `json:"preBuyPercent"`
	MarginTime           int64          `json:"marginTime"`
	ContactEmail         sql.NullString `json:"contactEmail"`
	ContactTg            sql.NullString `json:"contactTg"`
	CreatedAt            time.Time      `json:"createdAt"`
	UpdatedAt            time.Time      `json:"updatedAt"`
}

type TokenModel struct {
	db *pgxpool.Pool
}

func NewTokenModel(db *pgxpool.Pool) *TokenModel {
	return &TokenModel{db: db}
}

// GetDB 获取数据库连接池
func (m *TokenModel) GetDB() *pgxpool.Pool {
	return m.db
}

// FindList 获取代币列表
func (m *TokenModel) FindList(ctx context.Context, params map[string]interface{}) ([]*Token, int, error) {
	// 构建查询
	query := `
		SELECT id, name, symbol, logo, banner, description, 
			token_contract_address, creator_address, launch_mode, launch_time,
			bnb_current, bnb_target, margin_bnb, total_supply, status,
			website, twitter, telegram, discord, whitepaper, tags,
			hot, token_lv, token_rank, created_at
		FROM tokens
		WHERE 1=1
	`
	countQuery := `SELECT COUNT(*) FROM tokens WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	// 添加筛选条件
	if launchMode, ok := params["launchMode"].(int); ok && launchMode > 0 {
		query += ` AND launch_mode = $` + string(rune('0'+argIdx))
		countQuery += ` AND launch_mode = $` + string(rune('0'+argIdx))
		args = append(args, launchMode)
		argIdx++
	}

	// 排序
	if sort, ok := params["sort"].(string); ok && sort != "" {
		switch sort {
		case "hot":
			query += " ORDER BY hot DESC"
		case "new":
			query += " ORDER BY created_at DESC"
		case "marketCap":
			query += " ORDER BY bnb_current DESC"
		default:
			query += " ORDER BY created_at DESC"
		}
	} else {
		query += " ORDER BY created_at DESC"
	}

	// 分页
	pageNo := 1
	pageSize := 10
	if pn, ok := params["pageNo"].(int); ok && pn > 0 {
		pageNo = pn
	}
	if ps, ok := params["pageSize"].(int); ok && ps > 0 {
		pageSize = ps
	}
	offset := (pageNo - 1) * pageSize
	query += ` LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, pageSize, offset)

	// 获取总数
	var total int
	err := m.db.QueryRow(ctx, countQuery, args[:argIdx-1]...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 获取列表
	rows, err := m.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tokens []*Token
	for rows.Next() {
		var t Token
		err := rows.Scan(
			&t.ID, &t.Name, &t.Symbol, &t.Logo, &t.Banner, &t.Description,
			&t.TokenContractAddress, &t.CreatorAddress, &t.LaunchMode, &t.LaunchTime,
			&t.BnbCurrent, &t.BnbTarget, &t.MarginBnb, &t.TotalSupply, &t.Status,
			&t.Website, &t.Twitter, &t.Telegram, &t.Discord, &t.Whitepaper, &t.Tags,
			&t.Hot, &t.TokenLv, &t.TokenRank, &t.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		tokens = append(tokens, &t)
	}

	return tokens, total, nil
}

// FindByAddress 根据合约地址查找代币
func (m *TokenModel) FindByAddress(ctx context.Context, address string) (*Token, error) {
	var t Token
	err := m.db.QueryRow(ctx, `
		SELECT id, name, symbol, COALESCE(logo, ''), banner, description, 
			token_contract_address, creator_address, launch_mode, launch_time,
			COALESCE(bnb_current, 0)::text, COALESCE(bnb_target, 0)::text, 
			COALESCE(margin_bnb, 0)::text, COALESCE(total_supply, 0)::text, COALESCE(status, 1),
			website, twitter, telegram, discord, whitepaper, COALESCE(tags, ARRAY[]::text[]),
			COALESCE(hot, 0), COALESCE(token_lv, 0), COALESCE(token_rank, 0), 
			COALESCE(request_id, ''), COALESCE(nonce, 0), COALESCE(salt, ''),
			COALESCE(pre_buy_percent, 0), COALESCE(margin_time, 0), contact_email, contact_tg,
			created_at, updated_at
		FROM tokens
		WHERE LOWER(token_contract_address) = LOWER($1)
	`, address).Scan(
		&t.ID, &t.Name, &t.Symbol, &t.Logo, &t.Banner, &t.Description,
		&t.TokenContractAddress, &t.CreatorAddress, &t.LaunchMode, &t.LaunchTime,
		&t.BnbCurrent, &t.BnbTarget, &t.MarginBnb, &t.TotalSupply, &t.Status,
		&t.Website, &t.Twitter, &t.Telegram, &t.Discord, &t.Whitepaper, &t.Tags,
		&t.Hot, &t.TokenLv, &t.TokenRank, &t.RequestID, &t.Nonce, &t.Salt,
		&t.PreBuyPercent, &t.MarginTime, &t.ContactEmail, &t.ContactTg,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// FindByID 根据ID查找代币
func (m *TokenModel) FindByID(ctx context.Context, id int64) (*Token, error) {
	var t Token
	err := m.db.QueryRow(ctx, `
		SELECT id, name, symbol, COALESCE(logo, ''), banner, description, 
			token_contract_address, creator_address, launch_mode, launch_time,
			COALESCE(bnb_current, 0)::text, COALESCE(bnb_target, 0)::text, 
			COALESCE(margin_bnb, 0)::text, COALESCE(total_supply, 0)::text, COALESCE(status, 1),
			website, twitter, telegram, discord, whitepaper, COALESCE(tags, ARRAY[]::text[]),
			COALESCE(hot, 0), COALESCE(token_lv, 0), COALESCE(token_rank, 0), 
			COALESCE(request_id, ''), COALESCE(nonce, 0), COALESCE(salt, ''),
			COALESCE(pre_buy_percent, 0), COALESCE(margin_time, 0), contact_email, contact_tg,
			created_at, updated_at
		FROM tokens
		WHERE id = $1
	`, id).Scan(
		&t.ID, &t.Name, &t.Symbol, &t.Logo, &t.Banner, &t.Description,
		&t.TokenContractAddress, &t.CreatorAddress, &t.LaunchMode, &t.LaunchTime,
		&t.BnbCurrent, &t.BnbTarget, &t.MarginBnb, &t.TotalSupply, &t.Status,
		&t.Website, &t.Twitter, &t.Telegram, &t.Discord, &t.Whitepaper, &t.Tags,
		&t.Hot, &t.TokenLv, &t.TokenRank, &t.RequestID, &t.Nonce, &t.Salt,
		&t.PreBuyPercent, &t.MarginTime, &t.ContactEmail, &t.ContactTg,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// Create 创建代币记录
func (m *TokenModel) Create(ctx context.Context, token *Token) error {
	return m.db.QueryRow(ctx, `
		INSERT INTO tokens (
			name, symbol, logo, banner, description,
			token_contract_address, creator_address, launch_mode, launch_time,
			bnb_target, margin_bnb, total_supply, status,
			website, twitter, telegram, discord, whitepaper, tags,
			request_id, nonce, salt, pre_buy_percent, margin_time,
			contact_email, contact_tg, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
			$21, $22, $23, $24, $25, NOW(), NOW()
		)
		RETURNING id, created_at, updated_at
	`,
		token.Name, token.Symbol, token.Logo, token.Banner, token.Description,
		token.TokenContractAddress, token.CreatorAddress, token.LaunchMode, token.LaunchTime,
		token.BnbTarget, token.MarginBnb, token.TotalSupply, token.Status,
		token.Website, token.Twitter, token.Telegram, token.Discord, token.Whitepaper, token.Tags,
		token.RequestID, token.Nonce, token.Salt, token.PreBuyPercent, token.MarginTime,
		token.ContactEmail, token.ContactTg,
	).Scan(&token.ID, &token.CreatedAt, &token.UpdatedAt)
}

// GetHotPick 获取热门代币
func (m *TokenModel) GetHotPick(ctx context.Context, limit int) ([]*Token, error) {
	rows, err := m.db.Query(ctx, `
		SELECT id, name, symbol, logo, token_contract_address, bnb_current, hot
		FROM tokens
		WHERE status IN (1, 2)
		ORDER BY hot DESC, created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []*Token
	for rows.Next() {
		var t Token
		err := rows.Scan(&t.ID, &t.Name, &t.Symbol, &t.Logo, &t.TokenContractAddress, &t.BnbCurrent, &t.Hot)
		if err != nil {
			return nil, err
		}
		tokens = append(tokens, &t)
	}
	return tokens, nil
}

// GetTokenHolders 获取代币持有者
func (m *TokenModel) GetTokenHolders(ctx context.Context, tokenAddress string, pageNo, pageSize int) ([]map[string]interface{}, int, error) {
	// 从 token_balances 表查询
	countQuery := `SELECT COUNT(*) FROM token_balances WHERE LOWER(token_address) = LOWER($1) AND balance > 0`
	var total int
	err := m.db.QueryRow(ctx, countQuery, tokenAddress).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (pageNo - 1) * pageSize
	rows, err := m.db.Query(ctx, `
		SELECT holder_address, balance, 
			ROUND(balance * 100.0 / NULLIF((SELECT SUM(balance) FROM token_balances WHERE LOWER(token_address) = LOWER($1)), 0), 2) as percentage
		FROM token_balances
		WHERE LOWER(token_address) = LOWER($1) AND balance > 0
		ORDER BY balance DESC
		LIMIT $2 OFFSET $3
	`, tokenAddress, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var holders []map[string]interface{}
	for rows.Next() {
		var address, balance string
		var percentage float64
		if err := rows.Scan(&address, &balance, &percentage); err != nil {
			return nil, 0, err
		}
		holders = append(holders, map[string]interface{}{
			"address":    address,
			"balance":    balance,
			"percentage": percentage,
		})
	}

	return holders, total, nil
}

// IsFavorite 检查用户是否收藏了某代币
func (m *TokenModel) IsFavorite(ctx context.Context, userID, tokenID int64) (bool, error) {
	var count int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM user_favorites
		WHERE user_id = $1 AND token_id = $2
	`, userID, tokenID).Scan(&count)
	return count > 0, err
}

// AddFavorite 添加收藏
func (m *TokenModel) AddFavorite(ctx context.Context, userID, tokenID int64) error {
	_, err := m.db.Exec(ctx, `
		INSERT INTO user_favorites (user_id, token_id, created_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id, token_id) DO NOTHING
	`, userID, tokenID)
	return err
}

// RemoveFavorite 移除收藏
func (m *TokenModel) RemoveFavorite(ctx context.Context, userID, tokenID int64) error {
	_, err := m.db.Exec(ctx, `
		DELETE FROM user_favorites WHERE user_id = $1 AND token_id = $2
	`, userID, tokenID)
	return err
}

// GetNextNonce 获取下一个nonce
func (m *TokenModel) GetNextNonce(ctx context.Context) (int, error) {
	var nonce int
	err := m.db.QueryRow(ctx, `
		SELECT COALESCE(MAX(nonce), 0) + 1 FROM tokens
	`).Scan(&nonce)
	return nonce, err
}
