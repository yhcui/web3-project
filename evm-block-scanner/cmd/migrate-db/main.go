package main

import (
	"encoding/binary"
	"encoding/json"
	"evm-scanner/storage"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"go.etcd.io/bbolt"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Println("Usage: migrate-db <old-heightmap-path> <cache-dir>")
		fmt.Println("Example: migrate-db ./cache/height.map ./cache")
		os.Exit(1)
	}

	oldPath := os.Args[1]
	cacheDir := os.Args[2]

	log.Printf("Migrating from %s to %s/block_*.db", oldPath, cacheDir)

	if err := migrate(oldPath, cacheDir); err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	log.Println("✅ Migration completed successfully!")
}

func migrate(oldPath, cacheDir string) error {
	// 打开旧数据库（只读）
	oldDB, err := bbolt.Open(oldPath, 0600, &bbolt.Options{ReadOnly: true})
	if err != nil {
		return fmt.Errorf("open old db: %w", err)
	}

	defer oldDB.Close()

	// 迁移 block_height 数据到各个链的 BlockQueue
	if err := migrateBlockHeight(oldDB, cacheDir); err != nil {
		return err
	}

	// 初始化 BackfillDB
	backfillDBPath := filepath.Join(cacheDir, "backfill.db")

	if _, err := os.Stat(backfillDBPath); !os.IsNotExist(err) {
		fmt.Printf("%s is allready exists, skipping...\n", backfillDBPath)
		return nil
	}

	backfillDB, err := storage.NewBackfillDB(backfillDBPath)
	if err != nil {
		return fmt.Errorf("init backfill db: %w", err)
	}
	defer backfillDB.Close()

	// 迁移 backfill_cursor 数据
	if err := migrateBackfillCursor(oldDB, backfillDB); err != nil {
		return err
	}

	return nil
}

func migrateBlockHeight(oldDB *bbolt.DB, cacheDir string) error {
	var count int
	chainQueues := make(map[uint64]*storage.BlockQueue)
	defer func() {
		for _, queue := range chainQueues {
			queue.Close()
		}
	}()

	err := oldDB.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte("block_height"))
		if b == nil {
			log.Println("⚠️  No block_height bucket found, skipping...")
			return nil
		}

		return b.ForEach(func(k, v []byte) error {
			if len(k) != 8 || len(v) != 8 {
				log.Printf("⚠️  Invalid entry: key_len=%d value_len=%d", len(k), len(v))
				return nil
			}

			chainID := binary.LittleEndian.Uint64(k)
			blockNum := binary.LittleEndian.Uint64(v)

			// 为该链创建 BlockQueue（如果还没有）
			queue, exists := chainQueues[chainID]
			if !exists {
				fileName := filepath.Join(cacheDir, fmt.Sprintf("block_%d.db", chainID))
				var err error
				if _, err := os.Stat(fileName); !os.IsNotExist(err) {
					fmt.Printf("%s is allready exists, skipping...\n", fileName)
					return nil
				}
				queue, err = storage.NewBlockQueue(cacheDir, chainID, fmt.Sprintf("block_%d", chainID))
				if err != nil {
					return fmt.Errorf("create queue for chain %d: %w", chainID, err)
				}
				chainQueues[chainID] = queue
			}

			// 插入下一个区块到队列（blockNum + 1）
			nextBlock := blockNum + 1
			err := queue.AddBlock(nextBlock, storage.PriorityNew)
			if err != nil {
				return fmt.Errorf("insert chain_id=%d block=%d: %w", chainID, nextBlock, err)
			}

			count++
			log.Printf("✓ block_height: chain_id=%d last_processed=%d next_block=%d",
				chainID, blockNum, nextBlock)
			return nil
		})
	})

	log.Printf("📊 Migrated %d block_height entries to %d chain databases", count, len(chainQueues))
	return err
}

func migrateBackfillCursor(oldDB *bbolt.DB, backfillDB *storage.BackfillDB) error {
	var count int

	err := oldDB.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte("backfill_cursor"))
		if b == nil {
			log.Println("⚠️  No backfill_cursor bucket found, skipping...")
			return nil
		}

		return b.ForEach(func(k, v []byte) error {
			key := string(k)

			// 解析 key: "chainID:address"
			parts := strings.SplitN(key, ":", 2)
			if len(parts) != 2 {
				log.Printf("⚠️  Invalid key format: %s", key)
				return nil
			}

			var chainID uint64
			_, err := fmt.Sscanf(parts[0], "%d", &chainID)
			if err != nil {
				log.Printf("⚠️  Invalid chainID in key: %s", key)
				return nil
			}

			address := parts[1]

			// 解析 value
			var state storage.BackfillCursorState
			if err := json.Unmarshal(v, &state); err != nil {
				log.Printf("⚠️  Invalid JSON for key %s: %v", key, err)
				return nil
			}

			// 保存
			if err := backfillDB.SaveBackfillCursor(chainID, address, state); err != nil {
				return fmt.Errorf("save cursor for %s: %w", key, err)
			}

			count++
			log.Printf("✓ backfill_cursor: chain_id=%d address=%s", chainID, address)
			return nil
		})
	})

	log.Printf("📊 Migrated %d backfill_cursor entries", count)
	return err
}
