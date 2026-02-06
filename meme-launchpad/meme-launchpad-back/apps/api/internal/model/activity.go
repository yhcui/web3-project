package model

import (
	"context"
	"database/sql"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Activity struct {
	ID                    int64          `json:"id"`
	Name                  string         `json:"name"`
	Description           string         `json:"description"`
	CategoryType          int            `json:"categoryType"`
	PlayType              int            `json:"playType"`
	RewardTokenType       int            `json:"rewardTokenType"`
	RewardAmount          string         `json:"rewardAmount"`
	RewardSlots           string         `json:"rewardSlots"`
	StartAt               time.Time      `json:"startAt"`
	EndAt                 time.Time      `json:"endAt"`
	CoverImage            string         `json:"coverImage"`
	TokenID               int64          `json:"tokenId"`
	InitiatorType         int            `json:"initiatorType"`
	AudienceType          int            `json:"audienceType"`
	CreatorID             int64          `json:"creatorId"`
	Status                int            `json:"status"` // 1=进行中, 2=已结束, 3=已取消
	MinDailyTradeAmount   sql.NullString `json:"minDailyTradeAmount"`
	InviteMinCount        sql.NullString `json:"inviteMinCount"`
	InviteeMinTradeAmount sql.NullString `json:"inviteeMinTradeAmount"`
	HeatVoteTarget        sql.NullString `json:"heatVoteTarget"`
	CommentMinCount       sql.NullString `json:"commentMinCount"`
	RewardTokenID         sql.NullInt64  `json:"rewardTokenId"`
	RewardTokenAddress    sql.NullString `json:"rewardTokenAddress"`
	CreatedAt             time.Time      `json:"createdAt"`
	UpdatedAt             time.Time      `json:"updatedAt"`
}

type ActivityModel struct {
	db *pgxpool.Pool
}

func NewActivityModel(db *pgxpool.Pool) *ActivityModel {
	return &ActivityModel{db: db}
}

// Create 创建活动
func (m *ActivityModel) Create(ctx context.Context, activity *Activity) error {
	return m.db.QueryRow(ctx, `
		INSERT INTO activities (
			name, description, category_type, play_type,
			reward_token_type, reward_amount, reward_slots,
			start_at, end_at, cover_image, token_id,
			initiator_type, audience_type, creator_id, status,
			min_daily_trade_amount, invite_min_count, invitee_min_trade_amount,
			heat_vote_target, comment_min_count, reward_token_id, reward_token_address,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
			$12, $13, $14, 1, $15, $16, $17, $18, $19, $20, $21,
			NOW(), NOW()
		)
		RETURNING id, created_at
	`,
		activity.Name, activity.Description, activity.CategoryType, activity.PlayType,
		activity.RewardTokenType, activity.RewardAmount, activity.RewardSlots,
		activity.StartAt, activity.EndAt, activity.CoverImage, activity.TokenID,
		activity.InitiatorType, activity.AudienceType, activity.CreatorID,
		activity.MinDailyTradeAmount, activity.InviteMinCount, activity.InviteeMinTradeAmount,
		activity.HeatVoteTarget, activity.CommentMinCount, activity.RewardTokenID, activity.RewardTokenAddress,
	).Scan(&activity.ID, &activity.CreatedAt)
}

// FindUserParticipated 获取用户参与的活动
func (m *ActivityModel) FindUserParticipated(ctx context.Context, userID int64, params map[string]interface{}) ([]*Activity, int, error) {
	// 简化实现
	return nil, 0, nil
}

// FindUserCreated 获取用户创建的活动
func (m *ActivityModel) FindUserCreated(ctx context.Context, userID int64, params map[string]interface{}) ([]*Activity, int, error) {
	pageNo := 1
	pageSize := 10
	if pn, ok := params["pageNo"].(int); ok && pn > 0 {
		pageNo = pn
	}
	if ps, ok := params["pageSize"].(int); ok && ps > 0 {
		pageSize = ps
	}

	// 获取总数
	var total int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM activities WHERE creator_id = $1
	`, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (pageNo - 1) * pageSize
	rows, err := m.db.Query(ctx, `
		SELECT id, name, description, category_type, play_type,
			reward_token_type, reward_amount, reward_slots,
			start_at, end_at, cover_image, token_id,
			initiator_type, audience_type, creator_id, status,
			created_at
		FROM activities
		WHERE creator_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var activities []*Activity
	for rows.Next() {
		var a Activity
		err := rows.Scan(
			&a.ID, &a.Name, &a.Description, &a.CategoryType, &a.PlayType,
			&a.RewardTokenType, &a.RewardAmount, &a.RewardSlots,
			&a.StartAt, &a.EndAt, &a.CoverImage, &a.TokenID,
			&a.InitiatorType, &a.AudienceType, &a.CreatorID, &a.Status,
			&a.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		activities = append(activities, &a)
	}

	return activities, total, nil
}

