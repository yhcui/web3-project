package model

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Invite struct {
	ID             int64     `json:"id"`
	InviterID      int64     `json:"inviterId"`
	InviteeID      int64     `json:"inviteeId"`
	InviterAddress string    `json:"inviterAddress"`
	InviteeAddress string    `json:"inviteeAddress"`
	InvitationCode string    `json:"invitationCode"`
	CreatedAt      time.Time `json:"createdAt"`
}

type Agent struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"userId"`
	Address        string    `json:"address"`
	InvitationCode string    `json:"invitationCode"`
	Level          int       `json:"level"`
	ParentID       int64     `json:"parentId"`
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
}

type InviteModel struct {
	db *pgxpool.Pool
}

func NewInviteModel(db *pgxpool.Pool) *InviteModel {
	return &InviteModel{db: db}
}

// GetUserStatus 获取用户邀请状态
func (m *InviteModel) GetUserStatus(ctx context.Context, address string) (map[string]interface{}, error) {
	result := map[string]interface{}{
		"isAgent":        false,
		"invitationCode": "",
		"address":        address,
	}

	var invitationCode string
	var isActive bool
	err := m.db.QueryRow(ctx, `
		SELECT invitation_code, is_active FROM agents
		WHERE LOWER(address) = LOWER($1)
	`, address).Scan(&invitationCode, &isActive)

	if err == nil {
		result["isAgent"] = isActive
		result["invitationCode"] = invitationCode
	}

	return result, nil
}

// GetUserCommission 获取用户佣金信息
func (m *InviteModel) GetUserCommission(ctx context.Context, address string) (map[string]interface{}, error) {
	result := map[string]interface{}{
		"address":          address,
		"totalFee":         0.0,
		"inviteUserCount":  0,
		"tradingUserCount": 0,
		"totalRebateFee":   0.0,
	}

	// 获取邀请人数
	var inviteCount int
	m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM invites
		WHERE LOWER(inviter_address) = LOWER($1)
	`, address).Scan(&inviteCount)
	result["inviteUserCount"] = inviteCount

	// 获取佣金总额
	var totalFee float64
	m.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount), 0) FROM rebate_records
		WHERE LOWER(user_address) = LOWER($1) AND status = 1
	`, address).Scan(&totalFee)
	result["totalFee"] = totalFee
	result["totalRebateFee"] = totalFee

	return result, nil
}

// GetUserInvites 获取用户邀请列表
func (m *InviteModel) GetUserInvites(ctx context.Context, address string, page, size int) ([]map[string]interface{}, int, error) {
	// 获取总数
	var total int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM invites
		WHERE LOWER(inviter_address) = LOWER($1)
	`, address).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * size
	rows, err := m.db.Query(ctx, `
		SELECT i.id, i.invitee_address, u.username, i.created_at
		FROM invites i
		LEFT JOIN users u ON i.invitee_id = u.id
		WHERE LOWER(i.inviter_address) = LOWER($1)
		ORDER BY i.created_at DESC
		LIMIT $2 OFFSET $3
	`, address, size, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var invites []map[string]interface{}
	for rows.Next() {
		var id int64
		var inviteeAddress, username string
		var createdAt time.Time
		if err := rows.Scan(&id, &inviteeAddress, &username, &createdAt); err != nil {
			return nil, 0, err
		}
		invites = append(invites, map[string]interface{}{
			"id":             id,
			"inviteeAddress": inviteeAddress,
			"username":       username,
			"createdAt":      createdAt.Format(time.RFC3339),
		})
	}

	return invites, total, nil
}

// CreateRebateRecord 创建返佣记录
func (m *InviteModel) CreateRebateRecord(ctx context.Context, userID, traderID int64, userAddr string, amount float64, status int) error {
	_, err := m.db.Exec(ctx, `
		INSERT INTO rebate_records (user_id, trader_id, user_address, amount, status, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, userID, traderID, userAddr, amount, status)
	return err
}

// CheckRebateRecordStatus 检查返佣记录状态
func (m *InviteModel) CheckRebateRecordStatus(ctx context.Context, address string) (bool, error) {
	var count int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM rebate_records
		WHERE LOWER(user_address) = LOWER($1) AND status = 0
	`, address).Scan(&count)
	return count > 0, err
}

