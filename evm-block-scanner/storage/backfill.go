// Package storage 提供历史数据回填的游标管理功能
// 记录每个地址的历史数据回填进度（分页状态）
// 使用 SQLite 存储，与 heightmap.go 中的 bbolt 版本互补
package storage

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// 默认回填页码（从第 1 页开始）
const defaultBackfillPage = 1

// BackfillCursorState 回填游标状态
// 记录某个地址的历史数据回填进度
//
// 【业务概念】回填（Backfill）
// 当用户首次订阅一个地址时，需要获取该地址的历史交易数据
// 这个过程叫"回填"，通过分页查询 Etherscan 等 API 实现
type BackfillCursorState struct {
	NormalPage uint64 `json:"normal_page"` // 普通交易（ETH 转账）的当前页码
	TokenPage  uint64 `json:"token_page"`  // 代币交易（ERC20 转账）的当前页码
	NormalDone bool   `json:"normal_done"` // 普通交易是否回填完成
	TokenDone  bool   `json:"token_done"`  // 代币交易是否回填完成
}

// DefaultBackfillCursorState 返回默认的回填游标状态
// 页码从 1 开始，未完成
func DefaultBackfillCursorState() BackfillCursorState {
	return BackfillCursorState{
		NormalPage: defaultBackfillPage,
		TokenPage:  defaultBackfillPage,
	}
}

// BackfillDB 回填数据库
// 管理回填游标的持久化存储
type BackfillDB struct {
	db *sql.DB // SQLite 数据库连接
}

// NewBackfillDB 创建或打开回填数据库
// file: 数据库文件路径
func NewBackfillDB(file string) (*BackfillDB, error) {
	conn, err := Open(file)
	if err != nil {
		return nil, fmt.Errorf("open backfill db: %w", err)
	}

	// 创建回填游标表
	_, err = conn.Exec(`
		CREATE TABLE IF NOT EXISTS backfill_cursor (
			chain_id INTEGER NOT NULL,        -- 链 ID
			address TEXT NOT NULL,            -- 地址
			normal_page INTEGER NOT NULL DEFAULT 1,  -- 普通交易当前页码
			token_page INTEGER NOT NULL DEFAULT 1,   -- 代币交易当前页码
			normal_done INTEGER NOT NULL DEFAULT 0,  -- 普通交易是否完成（0=否，1=是）
			token_done INTEGER NOT NULL DEFAULT 0,   -- 代币交易是否完成
			updated_at INTEGER NOT NULL,      -- 更新时间
			PRIMARY KEY (chain_id, address)   -- 联合主键（每个链的每个地址一条记录）
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create backfill_cursor table: %w", err)
	}

	// 创建索引以优化查询
	_, err = conn.Exec(`
		CREATE INDEX IF NOT EXISTS idx_backfill_status
		ON backfill_cursor(chain_id, normal_done, token_done)
	`)
	if err != nil {
		return nil, fmt.Errorf("create index: %w", err)
	}

	return &BackfillDB{db: conn}, nil
}

// Close 关闭数据库连接
func (b *BackfillDB) Close() error {
	return b.db.Close()
}

// LoadBackfillCursor 加载回填游标状态
// chainID: 链 ID
// address: 地址
// 返回: 回填游标状态（如果不存在返回默认值）
func (b *BackfillDB) LoadBackfillCursor(chainID uint64, address string) (BackfillCursorState, error) {
	address = strings.ToLower(strings.TrimSpace(address))

	var state BackfillCursorState
	var normalDone, tokenDone int

	// 查询回填游标
	err := b.db.QueryRow(`
		SELECT normal_page, token_page, normal_done, token_done
		FROM backfill_cursor
		WHERE chain_id = ? AND address = ?
	`, chainID, address).Scan(&state.NormalPage, &state.TokenPage, &normalDone, &tokenDone)

	if err == sql.ErrNoRows {
		// 不存在，返回默认值
		return DefaultBackfillCursorState(), nil
	}
	if err != nil {
		return BackfillCursorState{}, err
	}

	// SQLite 中 bool 存储为 int（0=false, 1=true）
	state.NormalDone = normalDone == 1
	state.TokenDone = tokenDone == 1

	normalizeBackfillCursorState(&state)
	return state, nil
}

// SaveBackfillCursor 保存回填游标状态
// chainID: 链 ID
// address: 地址
// state: 回填游标状态
//
// 【SQL 语法】ON CONFLICT ... DO UPDATE
// 这是 SQLite 的 upsert 语法：如果主键冲突则更新，否则插入
func (b *BackfillDB) SaveBackfillCursor(chainID uint64, address string, state BackfillCursorState) error {
	normalizeBackfillCursorState(&state)
	address = strings.ToLower(strings.TrimSpace(address))
	now := time.Now().Unix()

	_, err := b.db.Exec(`
		INSERT INTO backfill_cursor
		(chain_id, address, normal_page, token_page, normal_done, token_done, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(chain_id, address) DO UPDATE SET
			normal_page = excluded.normal_page,
			token_page = excluded.token_page,
			normal_done = excluded.normal_done,
			token_done = excluded.token_done,
			updated_at = excluded.updated_at
	`, chainID, address, state.NormalPage, state.TokenPage,
		boolToInt(state.NormalDone), boolToInt(state.TokenDone), now)

	return err
}

// boolToInt 将 bool 转换为 int
// SQLite 不支持 bool 类型，用 0/1 表示
func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
