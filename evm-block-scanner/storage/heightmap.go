// Package storage 提供区块高度映射存储功能
// 使用 bbolt（嵌入式 KV 数据库）存储每条链的最新区块高度
// bbolt 是一个纯 Go 实现的键值数据库，适合存储简单的键值对
package storage

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"go.etcd.io/bbolt" // bbolt 是 etcd 团队维护的嵌入式 KV 数据库
)

// HeightMap 区块高度映射
// 存储每条链的最新处理区块高度
type HeightMap struct {
	db *bbolt.DB // bbolt 数据库连接
}

// bbolt 中的 bucket 名称（类似数据库中的表）
const (
	bucketBlockHeight    = "block_height"     // 存储区块高度
	bucketBackfillCursor = "backfill_cursor"  // 存储回填游标
)

// NewHeightMap 创建或打开高度映射数据库
// path: 数据库文件路径
//
// 【bbolt 概念】
// - Bucket: 类似数据库的表，用于组织数据
// - Key-Value: 键值对存储，通过 key 快速查找 value
func NewHeightMap(path string) (*HeightMap, error) {
	// 打开数据库（如果文件不存在会自动创建）
	// 0600: 文件权限（只有所有者可读写）
	db, err := bbolt.Open(path, 0600, nil)
	if err != nil {
		return nil, err
	}

	// 创建 bucket（如果不存在）
	// 【bbolt 概念】Update 开启一个读写事务
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

// SaveBlock 保存区块高度
// chainID: 链 ID
// blockNum: 区块号
//
// 【Go 小白提示】
// uint64 需要转换为字节数组才能存储到数据库
// 这里使用小端序（Little Endian）编码
func (m *HeightMap) SaveBlock(chainID uint64, blockNum uint64) {
	var err error
	// 重试 3 次（数据库操作可能因为锁竞争失败）
	for i := range 3 {
		err = m.saveBlockOnce(chainID, blockNum)
		if err == nil {
			return
		}
		log.Printf("[HeightMap] SaveBlock failed (attempt %d/3): %v", i+1, err)
	}
	// 3 次都失败，直接 panic（程序崩溃）
	panic(fmt.Sprintf("[HeightMap] SaveBlock failed after 3 retries: %v", err))
}

// saveBlockOnce 单次保存区块高度
func (m *HeightMap) saveBlockOnce(chainID uint64, blockNum uint64) error {
	return m.db.Update(func(tx *bbolt.Tx) error {
		// 将 chainID 转换为 8 字节数组作为 key
		key := make([]byte, 8)
		binary.LittleEndian.PutUint64(key, chainID)

		// 将 blockNum 转换为 8 字节数组作为 value
		value := make([]byte, 8)
		binary.LittleEndian.PutUint64(value, blockNum)

		// 存入 bucket
		return tx.Bucket([]byte(bucketBlockHeight)).Put(key, value)
	})
}

// LoadBlock 加载区块高度
// chainID: 链 ID
// 返回: 区块号（如果不存在返回 0）
//
// 【bbolt 概念】View 开启一个只读事务
func (m *HeightMap) LoadBlock(chainID uint64) uint64 {
	var blockNum uint64
	m.db.View(func(tx *bbolt.Tx) error {
		key := make([]byte, 8)
		binary.LittleEndian.PutUint64(key, chainID)

		// 从 bucket 中读取 value
		v := tx.Bucket([]byte(bucketBlockHeight)).Get(key)
		if v != nil {
			// 将字节数组转换回 uint64
			blockNum = binary.LittleEndian.Uint64(v)
		}
		return nil
	})
	return blockNum
}

// LoadBackfillCursor 加载回填游标状态
// chainID: 链 ID
// address: 地址
// 返回: 回填游标状态（记录回填进度）
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
		// 反序列化 JSON
		return json.Unmarshal(raw, &state)
	})
	if err != nil {
		return DefaultBackfillCursorState(), err
	}
	normalizeBackfillCursorState(&state)
	return state, nil
}

// SaveBackfillCursor 保存回填游标状态
func (m *HeightMap) SaveBackfillCursor(chainID uint64, address string, state BackfillCursorState) error {
	normalizeBackfillCursorState(&state)
	key := backfillCursorKey(chainID, address)

	// 序列化为 JSON
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

// backfillCursorKey 生成回填游标的 key
// 格式: "chainID:address"
func backfillCursorKey(chainID uint64, address string) string {
	return fmt.Sprintf("%d:%s", chainID, strings.ToLower(strings.TrimSpace(address)))
}

// normalizeBackfillCursorState 标准化回填游标状态
// 确保页码至少为 1（避免从 0 开始）
func normalizeBackfillCursorState(state *BackfillCursorState) {
	if state.NormalPage == 0 {
		state.NormalPage = defaultBackfillPage
	}
	if state.TokenPage == 0 {
		state.TokenPage = defaultBackfillPage
	}
}

// Sync 同步数据库到磁盘
func (m *HeightMap) Sync() error {
	return m.db.Sync()
}

// Close 关闭数据库连接
func (m *HeightMap) Close() error {
	return m.db.Close()
}
