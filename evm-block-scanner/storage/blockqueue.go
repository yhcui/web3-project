package storage

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"
	"time"
)

const (
	PriorityNew     = 0  // 新区块优先级
	PriorityCatchup = 50 // 落后区块优先级
)

type QueueItem struct {
	BlockNum     uint64
	BasePriority int
	FailureCount uint64
	AddedAt      int64
	NextRetryAt  int64
}

type BlockQueue struct {
	db   *sql.DB
	name string
}

type QueueStats struct {
	Total       int
	Pending     int
	Retrying    int
	MinBlock    uint64
	MaxBlock    uint64
	AvgPriority float64
}

// NewBlockQueue 创建或打开 SQLite 数据库
func NewBlockQueue(dir string, chainID uint64, name string) (*BlockQueue, error) {
	start := time.Now()
	defer func() {
		log.Printf("[%s] NewBlockQueue(block_%d) time: %s", name, chainID, time.Since(start))
	}()

	dbPath := filepath.Join(dir, fmt.Sprintf("block_%d.db", chainID))
	db, err := Open(dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// 创建表（去掉 chain_id）
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS block_queue (
			block_num INTEGER PRIMARY KEY,
			base_priority INTEGER NOT NULL,
			failure_count INTEGER DEFAULT 0,
			added_at INTEGER NOT NULL,
			next_retry_at INTEGER DEFAULT 0,
			processing INTEGER DEFAULT 0
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create table: %w", err)
	}

	// 创建优化后的索引（去掉 chain_id，调整顺序）
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_queue_get_tasks 
		ON block_queue (processing, base_priority, block_num ASC, next_retry_at)
	`)
	if err != nil {
		return nil, fmt.Errorf("create index: %w", err)
	}

	// 创建元数据表
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS metadata (
			key TEXT PRIMARY KEY,
			value INTEGER NOT NULL
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create metadata table: %w", err)
	}

	// 创建已处理区块哈希表（用于检测 reorg）
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS processed_blocks (
			block_num INTEGER PRIMARY KEY,
			block_hash TEXT NOT NULL,
			parent_hash TEXT NOT NULL,
			processed_at INTEGER NOT NULL
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create processed_blocks table: %w", err)
	}

	// 创建索引以加速查询
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_processed_blocks_hash
		ON processed_blocks (block_hash)
	`)
	if err != nil {
		return nil, fmt.Errorf("create processed_blocks index: %w", err)
	}

	// 将上一次运行时新添加的区块的优先级设置为 10，确保新扫到的区块可以被优先处理
	_, err = db.Exec(fmt.Sprintf(`UPDATE block_queue SET base_priority = %d WHERE base_priority = 0`, PriorityCatchup))
	if err != nil {
		return nil, fmt.Errorf("update base priority: %w", err)
	}

	// 重置 processing 状态
	_, err = db.Exec(`UPDATE block_queue SET processing = 0 WHERE processing = 1`)
	if err != nil {
		return nil, fmt.Errorf("reset processing: %w", err)
	}

	return &BlockQueue{db: db, name: name}, nil
}

func (q *BlockQueue) Close() {
	_ = q.db.Close()
}

// AddBlock 添加单个区块到队列
func (q *BlockQueue) AddBlock(blockNum uint64, basePriority int) error {
	now := time.Now()
	defer func() {
		log.Printf("[%s] AddBlock(%d) time: %s", q.name, blockNum, time.Since(now))
	}()

	_, err := q.db.Exec(`
		INSERT OR IGNORE INTO block_queue 
		(block_num, base_priority, failure_count, added_at, next_retry_at, processing)
		VALUES (?, ?, 0, ?, 0, 0)
	`, blockNum, basePriority, now.Unix())
	return err
}

// AddBlockRange 批量添加区块范围（用于追赶）
func (q *BlockQueue) AddBlockRange(start, end uint64, basePriority int) error {
	if start > end {
		// TODO: 考虑链上区块重组，如果发生重组，可能会出现 start > end 的情况
		return fmt.Errorf("start block %d is greater than end block %d", start, end)
	}
	if start == end {
		return q.AddBlock(start, basePriority)
	}
	now := time.Now()
	defer func() {
		log.Printf("[%s] AddBlockRange(%d, %d) time: %s", q.name, start, end, time.Since(now))
	}()

	tx, err := q.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT OR IGNORE INTO block_queue 
		(block_num, base_priority, failure_count, added_at, next_retry_at, processing)
		VALUES (?, ?, 0, ?, 0, 0)
	`)
	if err != nil {
		return fmt.Errorf("prepare statement: %w", err)
	}
	defer stmt.Close()

	for blockNum := start; blockNum <= end; blockNum++ {
		_, err = stmt.Exec(blockNum, basePriority, now.Unix())
		if err != nil {
			return fmt.Errorf("insert block %d: %w", blockNum, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

func (q *BlockQueue) GetTasks(limit int) ([]QueueItem, error) {
	now := time.Now()

	blocks := make([]uint64, 0, limit)
	defer func() {
		if len(blocks) <= 0 {
			return
		}
		log.Printf("[%s] GetTasks(%d) %v time: %s", q.name, limit, blocks, time.Since(now))
	}()

	tx, err := q.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	selectQuery := `
        SELECT block_num, base_priority, failure_count, added_at, next_retry_at
        FROM block_queue
        WHERE processing = 0 AND next_retry_at <= ?
        ORDER BY base_priority ASC, block_num ASC
        LIMIT ?
    `
	rows, err := tx.Query(selectQuery, now.Unix(), limit)
	if err != nil {
		return nil, fmt.Errorf("select tasks: %w", err)
	}

	var items []QueueItem
	for rows.Next() {
		var item QueueItem
		if err := rows.Scan(&item.BlockNum, &item.BasePriority, &item.FailureCount, &item.AddedAt, &item.NextRetryAt); err != nil {
			rows.Close()
			return nil, err
		}
		items = append(items, item)
		blocks = append(blocks, item.BlockNum)
	}
	rows.Close()
	if len(items) == 0 {
		return items, nil
	}

	updateQuery := `UPDATE block_queue SET processing = 1 WHERE block_num = ?`
	stmt, err := tx.Prepare(updateQuery)
	if err != nil {
		return nil, fmt.Errorf("prepare update: %w", err)
	}
	defer stmt.Close()

	for _, item := range items {
		if _, err := stmt.Exec(item.BlockNum); err != nil {
			return nil, fmt.Errorf("exec update: %w", err)
		}
	}

	// 4. 提交事务。
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// 返回的 items 顺序严格遵循 SELECT 的结果
	return items, nil
}

// RemoveBlock 删除区块（处理成功）
func (q *BlockQueue) RemoveBlock(blockNum uint64) error {
	tx, err := q.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM block_queue WHERE block_num = ?`, blockNum)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT OR REPLACE INTO metadata (key, value) 
		VALUES ('last_processed_block', ?)
	`, blockNum)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// MarkFailed 标记区块失败（增加失败次数和冷却时间）
func (q *BlockQueue) MarkFailed(blockNum uint64, nextRetryAt int64) error {
	_, err := q.db.Exec(`
		UPDATE block_queue
		SET failure_count = failure_count + 1,
		    next_retry_at = ?,
		    processing = 0
		WHERE block_num = ?
	`, nextRetryAt, blockNum)
	return err
}

// GetContinueFromBlock 获取应该继续处理的起点区块号
// 如果队列不为空，返回队列中的最大区块号
// 如果队列为空，返回最后处理的区块号
func (q *BlockQueue) GetContinueFromBlock() uint64 {
	var maxBlock sql.NullInt64
	err := q.db.QueryRow(`SELECT MAX(block_num) FROM block_queue`).Scan(&maxBlock)

	if err != nil {
		panic(fmt.Errorf("get continue from block: %w", err))
	}

	if !maxBlock.Valid {
		// 队列为空，返回最后处理的区块号
		var lastBlock sql.NullInt64
		q.db.QueryRow(`SELECT value FROM metadata WHERE key = 'last_processed_block'`).Scan(&lastBlock)

		if !lastBlock.Valid {
			return 0
		}
		return uint64(lastBlock.Int64)
	}

	return uint64(maxBlock.Int64)
}

// GetStats 获取队列统计信息
func (q *BlockQueue) GetStats() (QueueStats, error) {
	var stats QueueStats

	err := q.db.QueryRow(`
		SELECT 
			COUNT(*) as total,
			SUM(CASE WHEN failure_count = 0 THEN 1 ELSE 0 END) as pending,
			SUM(CASE WHEN failure_count > 0 THEN 1 ELSE 0 END) as retrying,
			COALESCE(MIN(block_num), 0) as min_block,
			COALESCE(MAX(block_num), 0) as max_block,
			COALESCE(AVG(base_priority + failure_count * 10), 0) as avg_priority
		FROM block_queue
	`).Scan(
		&stats.Total,
		&stats.Pending,
		&stats.Retrying,
		&stats.MinBlock,
		&stats.MaxBlock,
		&stats.AvgPriority,
	)

	return stats, err
}

// GetPendingCount 获取待处理区块数量
func (q *BlockQueue) GetPendingCount() (int, error) {
	var count int
	err := q.db.QueryRow(`SELECT COUNT(*) FROM block_queue`).Scan(&count)
	return count, err
}

// SaveProcessedBlock 保存已处理区块的哈希信息（用于 reorg 检测）
func (q *BlockQueue) SaveProcessedBlock(blockNum uint64, blockHash, parentHash string) error {
	_, err := q.db.Exec(`
		INSERT OR REPLACE INTO processed_blocks
		(block_num, block_hash, parent_hash, processed_at)
		VALUES (?, ?, ?, ?)
	`, blockNum, blockHash, parentHash, time.Now().Unix())
	return err
}

// GetProcessedBlock 获取已处理区块的哈希信息
func (q *BlockQueue) GetProcessedBlock(blockNum uint64) (blockHash, parentHash string, err error) {
	err = q.db.QueryRow(`
		SELECT block_hash, parent_hash
		FROM processed_blocks
		WHERE block_num = ?
	`, blockNum).Scan(&blockHash, &parentHash)
	return
}

// DetectAndHandleReorg 检测并处理区块重组
// 返回：是否发生了 reorg，回滚到的区块号，错误
func (q *BlockQueue) DetectAndHandleReorg(blockNum uint64, blockHash, parentHash string) (bool, uint64, error) {
	// 检查前一个区块是否存在
	if blockNum == 0 {
		return false, 0, nil
	}

	prevBlockHash, _, err := q.GetProcessedBlock(blockNum - 1)
	if err == sql.ErrNoRows {
		// 前一个区块不存在，可能是首次启动或跳过的区块
		return false, 0, nil
	}
	if err != nil {
		return false, 0, fmt.Errorf("get previous block: %w", err)
	}

	// 检查 parentHash 是否匹配
	if prevBlockHash != parentHash {
		log.Printf("[%s] Reorg detected at block %d: expected parent %s, got %s",
			q.name, blockNum, prevBlockHash, parentHash)

		// 找到分叉点：从当前区块向前查找，直到找到匹配的区块
		reorgDepth := uint64(1)
		rollbackTo := blockNum - 1

		for rollbackTo > 0 && reorgDepth < 100 { // 最多回溯 100 个区块
			currentHash, currentParent, err := q.GetProcessedBlock(rollbackTo)
			if err == sql.ErrNoRows {
				rollbackTo--
				reorgDepth++
				continue
			}
			if err != nil {
				return false, 0, fmt.Errorf("get block %d: %w", rollbackTo, err)
			}

			// 检查这个区块在链上是否还存在且哈希匹配
			// 注意：这里需要调用者传入验证函数，暂时先标记需要回滚
			_ = currentHash
			_ = currentParent
			break
		}

		// 执行回滚
		if err := q.RollbackToBlock(rollbackTo); err != nil {
			return false, 0, fmt.Errorf("rollback to block %d: %w", rollbackTo, err)
		}

		log.Printf("[%s] Rolled back to block %d (reorg depth: %d)",
			q.name, rollbackTo, reorgDepth)

		return true, rollbackTo, nil
	}

	return false, 0, nil
}

// RollbackToBlock 回滚到指定区块（删除该区块之后的所有已处理记录，并重新加入队列）
func (q *BlockQueue) RollbackToBlock(blockNum uint64) error {
	tx, err := q.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 删除 processed_blocks 中大于 blockNum 的记录
	_, err = tx.Exec(`DELETE FROM processed_blocks WHERE block_num > ?`, blockNum)
	if err != nil {
		return fmt.Errorf("delete processed blocks: %w", err)
	}

	// 将这些区块重新加入队列（高优先级）
	_, err = tx.Exec(`
		INSERT OR IGNORE INTO block_queue
		(block_num, base_priority, failure_count, added_at, next_retry_at, processing)
		SELECT block_num, 0, 0, ?, 0, 0
		FROM (
			SELECT block_num FROM processed_blocks WHERE block_num > ?
		)
	`, time.Now().Unix(), blockNum)
	if err != nil {
		return fmt.Errorf("re-add blocks to queue: %w", err)
	}

	// 更新 last_processed_block
	_, err = tx.Exec(`
		INSERT OR REPLACE INTO metadata (key, value)
		VALUES ('last_processed_block', ?)
	`, blockNum)
	if err != nil {
		return fmt.Errorf("update last_processed_block: %w", err)
	}

	return tx.Commit()
}

// CleanupOldProcessedBlocks 清理旧的已处理区块记录（保留最近 N 个）
func (q *BlockQueue) CleanupOldProcessedBlocks(keepCount int) error {
	_, err := q.db.Exec(`
		DELETE FROM processed_blocks
		WHERE block_num < (
			SELECT COALESCE(MAX(block_num), 0) - ?
			FROM processed_blocks
		)
	`, keepCount)
	return err
}

// ResetTo 清空队列并将起点设置到指定区块高度，用于冷启动时跳过历史区块
func (q *BlockQueue) ResetTo(blockNum uint64) error {
	tx, err := q.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM block_queue`); err != nil {
		return err
	}
	if _, err := tx.Exec(`INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_processed_block', ?)`, blockNum); err != nil {
		return err
	}
	return tx.Commit()
}
