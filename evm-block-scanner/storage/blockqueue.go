// Package storage 提供区块队列管理功能
// 使用 SQLite 存储待处理的区块任务，支持优先级、失败重试、区块链重组检测
package storage

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"
	"time"
)

// 优先级常量
// 数字越小，优先级越高（SQLite ORDER BY ASC）
const (
	PriorityNew     = 0  // 新区块优先级最高（刚发现的新区块）
	PriorityCatchup = 50 // 落后区块优先级较低（历史追块）
)

// QueueItem 队列任务项
// 代表一个待处理的区块
type QueueItem struct {
	BlockNum     uint64 // 区块号
	BasePriority int    // 基础优先级
	FailureCount uint64 // 失败次数（用于退避重试）
	AddedAt      int64  // 加入队列的时间戳
	NextRetryAt  int64  // 下次重试时间（失败后会延迟重试）
}

// BlockQueue 区块处理队列
// 基于 SQLite 实现，持久化存储待处理区块
type BlockQueue struct {
	db   *sql.DB // SQLite 数据库连接
	name string  // 队列名称（用于日志）
}

// QueueStats 队列统计信息
type QueueStats struct {
	Total       int     // 总任务数
	Pending     int     // 待处理任务数（未失败过）
	Retrying    int     // 重试中的任务数（失败过）
	MinBlock    uint64  // 最小区块号
	MaxBlock    uint64  // 最大区块号
	AvgPriority float64 // 平均优先级
}

// NewBlockQueue 创建或打开区块队列
// dir: 数据库文件目录
// chainID: 链 ID（每条链一个独立的数据库文件）
// name: 队列名称（用于日志）
//
// 【区块链概念】
// 每条区块链都有自己的区块队列，记录哪些区块需要处理
func NewBlockQueue(dir string, chainID uint64, name string) (*BlockQueue, error) {
	start := time.Now()
	defer func() {
		log.Printf("[%s] NewBlockQueue(block_%d) time: %s", name, chainID, time.Since(start))
	}()

	// 数据库文件路径：cache/block_<chainID>.db
	dbPath := filepath.Join(dir, fmt.Sprintf("block_%d.db", chainID))
	db, err := Open(dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// 创建区块队列表
	// 【SQL 语法】IF NOT EXISTS: 如果表已存在则跳过，避免重复创建
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS block_queue (
			block_num INTEGER PRIMARY KEY,        -- 区块号（主键，唯一）
			base_priority INTEGER NOT NULL,       -- 基础优先级
			failure_count INTEGER DEFAULT 0,      -- 失败次数
			added_at INTEGER NOT NULL,            -- 加入时间
			next_retry_at INTEGER DEFAULT 0,      -- 下次重试时间
			processing INTEGER DEFAULT 0          -- 是否正在处理（0=否，1=是）
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create table: %w", err)
	}

	// 创建索引以优化查询性能
	// 【数据库概念】索引类似书的目录，加速查询但占用额外空间
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_queue_get_tasks
		ON block_queue (processing, base_priority, block_num ASC, next_retry_at)
	`)
	if err != nil {
		return nil, fmt.Errorf("create index: %w", err)
	}

	// 创建元数据表（存储 last_processed_block 等）
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS metadata (
			key TEXT PRIMARY KEY,    -- 键（如 'last_processed_block'）
			value INTEGER NOT NULL   -- 值
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create metadata table: %w", err)
	}

	// 创建已处理区块表（用于检测区块链重组 reorg）
	// 【区块链概念】reorg: 区块链可能发生分叉，导致之前处理的区块失效
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS processed_blocks (
			block_num INTEGER PRIMARY KEY,     -- 区块号
			block_hash TEXT NOT NULL,          -- 区块哈希
			parent_hash TEXT NOT NULL,         -- 父区块哈希（用于验证链的连续性）
			processed_at INTEGER NOT NULL      -- 处理时间
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("create processed_blocks table: %w", err)
	}

	// 为区块哈希创建索引
	_, err = db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_processed_blocks_hash
		ON processed_blocks (block_hash)
	`)
	if err != nil {
		return nil, fmt.Errorf("create processed_blocks index: %w", err)
	}

	// 将上次运行的新区块优先级调整为追块优先级
	// 这样重启后，新发现的区块会被优先处理
	_, err = db.Exec(fmt.Sprintf(`UPDATE block_queue SET base_priority = %d WHERE base_priority = 0`, PriorityCatchup))
	if err != nil {
		return nil, fmt.Errorf("update base priority: %w", err)
	}

	// 重置处理状态（防止上次异常退出导致任务卡住）
	_, err = db.Exec(`UPDATE block_queue SET processing = 0 WHERE processing = 1`)
	if err != nil {
		return nil, fmt.Errorf("reset processing: %w", err)
	}

	return &BlockQueue{db: db, name: name}, nil
}

// Close 关闭数据库连接
func (q *BlockQueue) Close() {
	_ = q.db.Close()
}

// AddBlock 添加单个区块到队列
// blockNum: 区块号
// basePriority: 基础优先级
//
// 【SQL 语法】INSERT OR IGNORE: 如果主键已存在则忽略，不报错
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

// AddBlockRange 批量添加区块范围
// start, end: 区块号范围（包含两端）
// basePriority: 基础优先级
//
// 【Go 小白提示】
// 使用事务（Transaction）批量插入，性能比逐条插入高很多
// 事务保证要么全部成功，要么全部失败（原子性）
func (q *BlockQueue) AddBlockRange(start, end uint64, basePriority int) error {
	if start > end {
		// 【区块链概念】如果 start > end，可能是链重组导致的
		return fmt.Errorf("start block %d is greater than end block %d", start, end)
	}
	if start == end {
		return q.AddBlock(start, basePriority)
	}
	now := time.Now()
	defer func() {
		log.Printf("[%s] AddBlockRange(%d, %d) time: %s", q.name, start, end, time.Since(now))
	}()

	// 开启事务
	tx, err := q.db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	// 【Go 惯用法】defer tx.Rollback() 确保事务最终会回滚
	// 如果后面 Commit 成功，Rollback 不会有任何效果
	defer tx.Rollback()

	// 预编译 SQL 语句（提高批量插入性能）
	stmt, err := tx.Prepare(`
		INSERT OR IGNORE INTO block_queue
		(block_num, base_priority, failure_count, added_at, next_retry_at, processing)
		VALUES (?, ?, 0, ?, 0, 0)
	`)
	if err != nil {
		return fmt.Errorf("prepare statement: %w", err)
	}
	defer stmt.Close()

	// 批量插入
	for blockNum := start; blockNum <= end; blockNum++ {
		_, err = stmt.Exec(blockNum, basePriority, now.Unix())
		if err != nil {
			return fmt.Errorf("insert block %d: %w", blockNum, err)
		}
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// GetTasks 从队列获取待处理任务
// limit: 最多获取多少个任务
// 返回: 任务列表（按优先级和区块号排序）
//
// 【数据库概念】
// 这个操作使用事务保证"查询+标记"的原子性
// 防止多个 worker 取到同一个任务
func (q *BlockQueue) GetTasks(limit int) ([]QueueItem, error) {
	now := time.Now()

	blocks := make([]uint64, 0, limit)
	defer func() {
		if len(blocks) <= 0 {
			return
		}
		log.Printf("[%s] GetTasks(%d) %v time: %s", q.name, limit, blocks, time.Since(now))
	}()

	// 开启事务
	tx, err := q.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	// 查询待处理任务
	// 条件：processing=0（未在处理）且 next_retry_at <= 当前时间（可以重试了）
	// 排序：先按优先级（小的优先），再按区块号（小的优先）
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

	// 标记为"正在处理"（防止其他 worker 取走）
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

	// 提交事务
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return items, nil
}

// RemoveBlock 删除已处理的区块
// blockNum: 区块号
//
// 处理成功后调用，同时更新 last_processed_block 元数据
func (q *BlockQueue) RemoveBlock(blockNum uint64) error {
	tx, err := q.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 从队列中删除
	_, err = tx.Exec(`DELETE FROM block_queue WHERE block_num = ?`, blockNum)
	if err != nil {
		return err
	}

	// 更新最后处理的区块号
	_, err = tx.Exec(`
		INSERT OR REPLACE INTO metadata (key, value)
		VALUES ('last_processed_block', ?)
	`, blockNum)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// MarkFailed 标记区块处理失败
// blockNum: 区块号
// nextRetryAt: 下次重试时间
//
// 【Go 小白提示】
// 失败后会递增 failure_count，并计算退避时间（失败次数越多，等待越久）
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

// GetContinueFromBlock 获取应该继续处理的区块号
// 返回: 队列中最大的区块号，或最后处理的区块号
//
// 用于重启后恢复进度
func (q *BlockQueue) GetContinueFromBlock() uint64 {
	var maxBlock sql.NullInt64
	err := q.db.QueryRow(`SELECT MAX(block_num) FROM block_queue`).Scan(&maxBlock)

	if err != nil {
		panic(fmt.Errorf("get continue from block: %w", err))
	}

	if !maxBlock.Valid {
		// 队列为空，从最后处理的区块继续
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

// SaveProcessedBlock 保存已处理区块的哈希信息
// 用于检测区块链重组（reorg）
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

// DetectAndHandleReorg 检测并处理区块链重组
// blockNum: 当前区块号
// blockHash: 当前区块哈希
// parentHash: 父区块哈希
//
// 返回:
//   - bool: 是否发生了 reorg
//   - uint64: 回滚到的区块号
//   - error: 错误信息
//
// 【区块链概念】Reorg（区块链重组）
// 当两条链同时挖出区块时，会发生分叉。最终网络会选择更长的链作为主链，
// 导致之前确认的区块可能被"回滚"。检测方式：验证 parentHash 是否匹配。
func (q *BlockQueue) DetectAndHandleReorg(blockNum uint64, blockHash, parentHash string) (bool, uint64, error) {
	// 检查前一个区块是否存在
	if blockNum == 0 {
		return false, 0, nil
	}

	// 获取前一个区块的哈希
	prevBlockHash, _, err := q.GetProcessedBlock(blockNum - 1)
	if err == sql.ErrNoRows {
		// 前一个区块不存在，可能是首次启动或跳过的区块
		return false, 0, nil
	}
	if err != nil {
		return false, 0, fmt.Errorf("get previous block: %w", err)
	}

	// 检查 parentHash 是否匹配
	// 【区块链概念】每个区块都包含父区块的哈希，形成链式结构
	// 如果不匹配，说明发生了 reorg
	if prevBlockHash != parentHash {
		log.Printf("[%s] Reorg detected at block %d: expected parent %s, got %s",
			q.name, blockNum, prevBlockHash, parentHash)

		// 找到分叉点：从当前区块向前查找，直到找到匹配的区块
		reorgDepth := uint64(1}
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

// RollbackToBlock 回滚到指定区块
// blockNum: 回滚到这个区块号
//
// 删除该区块之后的所有已处理记录，并重新加入队列
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

// CleanupOldProcessedBlocks 清理旧的已处理区块记录
// keepCount: 保留最近多少个区块的记录
//
// 定期清理，避免数据库无限增长
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

// ResetTo 重置队列到指定区块高度
// blockNum: 从哪个区块开始
//
// 用于冷启动时跳过历史区块，直接从最新区块开始
func (q *BlockQueue) ResetTo(blockNum uint64) error {
	tx, err := q.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 清空队列
	if _, err := tx.Exec(`DELETE FROM block_queue`); err != nil {
		return err
	}
	// 更新起点
	if _, err := tx.Exec(`INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_processed_block', ?)`, blockNum); err != nil {
		return err
	}
	return tx.Commit()
}
