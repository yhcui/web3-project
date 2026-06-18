// Package storage 提供代币数据存储功能
//
// 【注意】这个文件目前是空实现（占位符）
// 预留用于未来存储代币元数据（名称、符号、精度等）
// 目前代币信息通过 token.Manager 的内存缓存管理
package storage

import "database/sql"

// TokenDB 代币数据库
// 目前为空实现，预留用于持久化代币信息
type TokenDB struct {
	db *sql.DB
}

// NewTokenDB 创建代币数据库
// 目前返回 nil，未来可能实现为 SQLite 存储
func NewTokenDB() (*TokenDB, error) {
	return nil, nil
}
