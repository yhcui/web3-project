package storage

import "database/sql"

type TokenDB struct {
	db *sql.DB
}

func NewTokenDB() (*TokenDB, error) {
	return nil, nil
}
