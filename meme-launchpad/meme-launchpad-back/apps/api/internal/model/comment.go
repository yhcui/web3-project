package model

import (
	"context"
	"database/sql"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Comment struct {
	ID            int64          `json:"id"`
	TokenID       int64          `json:"tokenId"`
	UserID        int64          `json:"userId"`
	WalletAddress string         `json:"walletAddress"`
	Content       sql.NullString `json:"content"`
	Img           sql.NullString `json:"img"`
	HoldingAmount string         `json:"holdingAmount"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

type CommentModel struct {
	db *pgxpool.Pool
}

func NewCommentModel(db *pgxpool.Pool) *CommentModel {
	return &CommentModel{db: db}
}

// FindList 获取评论列表
func (m *CommentModel) FindList(ctx context.Context, tokenID int64, pageNo, pageSize int, startTime int64) ([]*Comment, int, bool, error) {
	// 获取总数
	var total int
	err := m.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM comments WHERE token_id = $1
	`, tokenID).Scan(&total)
	if err != nil {
		return nil, 0, false, err
	}

	offset := (pageNo - 1) * pageSize
	query := `
		SELECT c.id, c.token_id, c.user_id, u.address, c.content, c.img, c.holding_amount, c.created_at
		FROM comments c
		LEFT JOIN users u ON c.user_id = u.id
		WHERE c.token_id = $1
	`
	args := []interface{}{tokenID}

	if startTime > 0 {
		query += ` AND c.created_at < to_timestamp($2)`
		args = append(args, startTime)
	}

	query += ` ORDER BY c.created_at DESC LIMIT $` + string(rune('0'+len(args)+1)) + ` OFFSET $` + string(rune('0'+len(args)+2))
	args = append(args, pageSize+1, offset) // +1 to check hasMore

	rows, err := m.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, false, err
	}
	defer rows.Close()

	var comments []*Comment
	for rows.Next() {
		var c Comment
		err := rows.Scan(
			&c.ID, &c.TokenID, &c.UserID, &c.WalletAddress,
			&c.Content, &c.Img, &c.HoldingAmount, &c.CreatedAt,
		)
		if err != nil {
			return nil, 0, false, err
		}
		comments = append(comments, &c)
	}

	hasMore := len(comments) > pageSize
	if hasMore {
		comments = comments[:pageSize]
	}

	return comments, total, hasMore, nil
}

// Create 创建评论
func (m *CommentModel) Create(ctx context.Context, comment *Comment) error {
	return m.db.QueryRow(ctx, `
		INSERT INTO comments (token_id, user_id, content, img, holding_amount, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at
	`, comment.TokenID, comment.UserID, comment.Content, comment.Img, comment.HoldingAmount).Scan(&comment.ID, &comment.CreatedAt)
}

// Delete 删除评论
func (m *CommentModel) Delete(ctx context.Context, commentID, userID int64) error {
	_, err := m.db.Exec(ctx, `
		DELETE FROM comments WHERE id = $1 AND user_id = $2
	`, commentID, userID)
	return err
}

// FindByID 根据ID查找评论
func (m *CommentModel) FindByID(ctx context.Context, id int64) (*Comment, error) {
	var c Comment
	err := m.db.QueryRow(ctx, `
		SELECT id, token_id, user_id, content, img, holding_amount, created_at
		FROM comments WHERE id = $1
	`, id).Scan(&c.ID, &c.TokenID, &c.UserID, &c.Content, &c.Img, &c.HoldingAmount, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

