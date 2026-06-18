package storage

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

const defaultBackfillPage = 1

type BackfillCursorState struct {
	NormalPage uint64 `json:"normal_page"`
	TokenPage  uint64 `json:"token_page"`
	NormalDone bool   `json:"normal_done"`
	TokenDone  bool   `json:"token_done"`
}

func DefaultBackfillCursorState() BackfillCursorState {
	return BackfillCursorState{
		NormalPage: defaultBackfillPage,
		TokenPage:  defaultBackfillPage,
	}
}

type BackfillDB struct {
	db *sql.DB
}

func NewBackfillDB(file string) (*BackfillDB, error) {
	conn, err := Open(file)
	if err != nil {
		return nil, fmt.Errorf("open backfill db: %w", err)
	}

	_, err = conn.Exec(`
		CREATE TABLE IF NOT EXISTS backfill_cursor (
			chain_id INTEGER NOT NULL,
			address TEXT NOT NULL,
			normal_page INTEGER NOT NULL DEFAULT 1,
			token_page INTEGER NOT NULL DEFAULT 1,
			normal_done INTEGER NOT NULL DEFAULT 0,
			token_done INTEGER NOT NULL DEFAULT 0,
			updated_at INTEGER NOT NULL,
			PRIMARY KEY (chain_id, address)
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create backfill_cursor table: %w", err)
	}

	_, err = conn.Exec(`
		CREATE INDEX IF NOT EXISTS idx_backfill_status 
		ON backfill_cursor(chain_id, normal_done, token_done)
	`)
	if err != nil {
		return nil, fmt.Errorf("create index: %w", err)
	}

	return &BackfillDB{db: conn}, nil
}

func (b *BackfillDB) Close() error {
	return b.db.Close()
}

func (b *BackfillDB) LoadBackfillCursor(chainID uint64, address string) (BackfillCursorState, error) {
	address = strings.ToLower(strings.TrimSpace(address))

	var state BackfillCursorState
	var normalDone, tokenDone int

	err := b.db.QueryRow(`
		SELECT normal_page, token_page, normal_done, token_done
		FROM backfill_cursor
		WHERE chain_id = ? AND address = ?
	`, chainID, address).Scan(&state.NormalPage, &state.TokenPage, &normalDone, &tokenDone)

	if err == sql.ErrNoRows {
		return DefaultBackfillCursorState(), nil
	}
	if err != nil {
		return BackfillCursorState{}, err
	}

	state.NormalDone = normalDone == 1
	state.TokenDone = tokenDone == 1

	normalizeBackfillCursorState(&state)
	return state, nil
}

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

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
