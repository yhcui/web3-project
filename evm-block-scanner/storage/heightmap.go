package storage

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"go.etcd.io/bbolt"
)

type HeightMap struct {
	db *bbolt.DB
}

const (
	bucketBlockHeight    = "block_height"
	bucketBackfillCursor = "backfill_cursor"
)

func NewHeightMap(path string) (*HeightMap, error) {
	db, err := bbolt.Open(path, 0600, nil)
	if err != nil {
		return nil, err
	}
	err = db.Update(func(tx *bbolt.Tx) error {
		if _, err := tx.CreateBucketIfNotExists([]byte(bucketBlockHeight)); err != nil {
			return err
		}
		_, err := tx.CreateBucketIfNotExists([]byte(bucketBackfillCursor))
		return err
	})
	if err != nil {
		db.Close()
		return nil, err
	}
	return &HeightMap{db: db}, nil
}

func (m *HeightMap) SaveBlock(chainID uint64, blockNum uint64) {
	var err error
	for i := range 3 {
		err = m.saveBlockOnce(chainID, blockNum)
		if err == nil {
			return
		}
		log.Printf("[HeightMap] SaveBlock failed (attempt %d/3): %v", i+1, err)
	}
	panic(fmt.Sprintf("[HeightMap] SaveBlock failed after 3 retries: %v", err))
}

func (m *HeightMap) saveBlockOnce(chainID uint64, blockNum uint64) error {
	return m.db.Update(func(tx *bbolt.Tx) error {
		key := make([]byte, 8)
		binary.LittleEndian.PutUint64(key, chainID)
		value := make([]byte, 8)
		binary.LittleEndian.PutUint64(value, blockNum)
		return tx.Bucket([]byte(bucketBlockHeight)).Put(key, value)
	})
}

func (m *HeightMap) LoadBlock(chainID uint64) uint64 {
	var blockNum uint64
	m.db.View(func(tx *bbolt.Tx) error {
		key := make([]byte, 8)
		binary.LittleEndian.PutUint64(key, chainID)
		v := tx.Bucket([]byte(bucketBlockHeight)).Get(key)
		if v != nil {
			blockNum = binary.LittleEndian.Uint64(v)
		}
		return nil
	})
	return blockNum
}

func (m *HeightMap) LoadBackfillCursor(chainID uint64, address string) (BackfillCursorState, error) {
	state := DefaultBackfillCursorState()
	key := backfillCursorKey(chainID, address)

	err := m.db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucketBackfillCursor))
		if b == nil {
			return nil
		}
		raw := b.Get([]byte(key))
		if len(raw) == 0 {
			return nil
		}
		return json.Unmarshal(raw, &state)
	})
	if err != nil {
		return DefaultBackfillCursorState(), err
	}
	normalizeBackfillCursorState(&state)
	return state, nil
}

func (m *HeightMap) SaveBackfillCursor(chainID uint64, address string, state BackfillCursorState) error {
	normalizeBackfillCursorState(&state)
	key := backfillCursorKey(chainID, address)
	payload, err := json.Marshal(state)
	if err != nil {
		return err
	}
	return m.db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucketBackfillCursor))
		if b == nil {
			return fmt.Errorf("bucket %s not found", bucketBackfillCursor)
		}
		return b.Put([]byte(key), payload)
	})
}

func backfillCursorKey(chainID uint64, address string) string {
	return fmt.Sprintf("%d:%s", chainID, strings.ToLower(strings.TrimSpace(address)))
}

func normalizeBackfillCursorState(state *BackfillCursorState) {
	if state.NormalPage == 0 {
		state.NormalPage = defaultBackfillPage
	}
	if state.TokenPage == 0 {
		state.TokenPage = defaultBackfillPage
	}
}

func (m *HeightMap) Sync() error {
	return m.db.Sync()
}

func (m *HeightMap) Close() error {
	return m.db.Close()
}
