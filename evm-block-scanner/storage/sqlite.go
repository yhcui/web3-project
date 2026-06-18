// Package storage 提供数据存储功能
// 包括区块队列、高度映射、回填游标等持久化存储
// 底层使用 SQLite 和 bbolt 两种嵌入式数据库
package storage

import (
	"database/sql"
	"fmt"
	_ "github.com/ncruces/go-sqlite3/driver" // 导入 SQLite 驱动（侧carriage导入，只执行 init 函数）
)

// Open 打开 SQLite 数据库连接
// path: 数据库文件路径
// 返回: *sql.DB 数据库连接对象
//
// 【Go 小白提示】
// - sql.DB 是一个连接池，不是单个连接，它是线程安全的
// - DSN (Data Source Name) 是连接字符串，指定数据库的各种参数
func Open(path string) (*sql.DB, error) {
	// DSN 参数说明：
	// - _journal_mode=WAL: Write-Ahead Logging 模式，允许读写并发，提升性能
	// - _busy_timeout=5000: 当数据库被锁时，等待 5000ms 再报错
	// - _synchronous=NORMAL: 平衡性能和数据安全（FULL 最安全但慢）
	dsn := fmt.Sprintf("file:%s?_journal_mode=WAL&_busy_timeout=5000&_synchronous=NORMAL", path)
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	// 设置缓存大小为 64MB（负数表示 KB）
	db.Exec("PRAGMA cache_size = -64000;")

	// 限制连接数为 1（SQLite 是单文件数据库，不支持高并发写入）
	// 这是 SQLite 的最佳实践，避免锁竞争
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	// 连接永不超时（0 表示无限制）
	db.SetConnMaxLifetime(0)

	return db, nil
}
