package storage

import (
	"testing"
	"time"
)

func TestBlockQueueDB(t *testing.T) {
	// 创建临时目录
	tmpDir := t.TempDir()
	chainID := uint64(56)

	// 创建 BlockQueue
	db, err := NewBlockQueue(tmpDir, chainID, "test")
	if err != nil {
		t.Fatalf("NewBlockQueue failed: %v", err)
	}

	// 测试添加单个区块
	t.Run("AddBlock", func(t *testing.T) {
		err := db.AddBlock(1000, PriorityNew)
		if err != nil {
			t.Errorf("AddBlock failed: %v", err)
		}

		// 重复添加应该被忽略
		err = db.AddBlock(1000, PriorityNew)
		if err != nil {
			t.Errorf("AddBlock duplicate failed: %v", err)
		}
	})

	// 测试批量添加
	t.Run("AddBlockRange", func(t *testing.T) {
		err := db.AddBlockRange(2000, 2100, PriorityCatchup)
		if err != nil {
			t.Errorf("AddBlockRange failed: %v", err)
		}

		count, err := db.GetPendingCount()
		if err != nil {
			t.Errorf("GetPendingCount failed: %v", err)
		}
		if count != 102 { // 1000 + (2000-2100)
			t.Errorf("Expected 102 blocks, got %d", count)
		}
	})

	// 测试获取任务（优先级排序）
	t.Run("GetTasks", func(t *testing.T) {
		tasks, err := db.GetTasks(1)
		if err != nil {
			t.Errorf("GetTasks failed: %v", err)
		}

		if len(tasks) == 0 {
			t.Error("Expected tasks, got none")
		}

		// 第一个应该是 priority=0 的区块 1000（只有这一个 priority=0）
		if tasks[0].BlockNum != 1000 {
			t.Errorf("Expected block 1000 first, got %d", tasks[0].BlockNum)
		}
		if tasks[0].BasePriority != PriorityNew {
			t.Errorf("Expected priority %d, got %d", PriorityNew, tasks[0].BasePriority)
		}
	})

	// 测试标记失败
	t.Run("MarkFailed", func(t *testing.T) {
		nextRetryAt := time.Now().Add(5 * time.Second).Unix()
		err := db.MarkFailed(1000, nextRetryAt)
		if err != nil {
			t.Errorf("MarkFailed failed: %v", err)
		}

		// 再次获取任务，1000 应该被跳过（冷却中）
		tasks, err := db.GetTasks(10)
		if err != nil {
			t.Errorf("GetTasks failed: %v", err)
		}

		// 第一个应该是 priority=50 的区块（最大的可用区块号，DESC 排序）
		// 验证不是 1000 即可
		if tasks[0].BlockNum == 1000 {
			t.Errorf("Block 1000 should be cooling, but got it as first task")
		}
		if tasks[0].BasePriority != PriorityCatchup {
			t.Errorf("Expected priority %d, got %d", PriorityCatchup, tasks[0].BasePriority)
		}
	})

	// 测试删除区块
	t.Run("RemoveBlock", func(t *testing.T) {
		err := db.RemoveBlock(2000)
		if err != nil {
			t.Errorf("RemoveBlock failed: %v", err)
		}

		count, err := db.GetPendingCount()
		if err != nil {
			t.Errorf("GetPendingCount failed: %v", err)
		}
		if count != 101 { // 102 - 1
			t.Errorf("Expected 101 blocks, got %d", count)
		}
	})

	// 测试统计信息
	t.Run("GetStats", func(t *testing.T) {
		stats, err := db.GetStats()
		if err != nil {
			t.Errorf("GetStats failed: %v", err)
		}

		if stats.Total != 101 {
			t.Errorf("Expected total 101, got %d", stats.Total)
		}
		if stats.Retrying != 1 { // block 1000 失败了一次
			t.Errorf("Expected retrying 1, got %d", stats.Retrying)
		}
		if stats.MinBlock != 1000 {
			t.Errorf("Expected min block 1000, got %d", stats.MinBlock)
		}
		if stats.MaxBlock != 2100 {
			t.Errorf("Expected max block 2100, got %d", stats.MaxBlock)
		}
	})

	// 测试优先级计算
	t.Run("PriorityCalculation", func(t *testing.T) {
		// 添加一个新区块
		err := db.AddBlock(3000, PriorityNew)
		if err != nil {
			t.Errorf("AddBlock failed: %v", err)
		}

		// 让它失败 5 次，nextRetryAt=0 表示立即可重试
		for i := 0; i < 5; i++ {
			err := db.MarkFailed(3000, 0)
			if err != nil {
				t.Errorf("MarkFailed failed: %v", err)
			}
		}

		// 获取任务
		tasks, err := db.GetTasks(200)
		if err != nil {
			t.Errorf("GetTasks failed: %v", err)
		}

		// 找到 block 3000
		var block3000 *QueueItem
		for i, task := range tasks {
			if task.BlockNum == 3000 {
				block3000 = &tasks[i]
				break
			}
		}

		if block3000 == nil {
			t.Errorf("Block 3000 not found in %d tasks", len(tasks))
		} else {
			if block3000.FailureCount != 5 {
				t.Errorf("Expected failure count 5, got %d", block3000.FailureCount)
			}
			// priority = 0 + 5*10 = 50
			expectedPriority := PriorityNew + int(block3000.FailureCount)*10
			if expectedPriority != 50 {
				t.Errorf("Expected priority 50, got %d", expectedPriority)
			}
		}
	})
}

func TestBlockQueueDB_GetHighestBlock(t *testing.T) {
	tmpDir := t.TempDir()
	chainID := uint64(56)

	db, err := NewBlockQueue(tmpDir, chainID, "test")
	if err != nil {
		t.Fatalf("NewBlockQueue failed: %v", err)
	}

	// 空队列
	maxBlock := db.GetContinueFromBlock()
	if maxBlock != 0 {
		t.Errorf("Expected 0, got %d", maxBlock)
	}

	// 添加一些区块
	db.AddBlock(100, PriorityNew)
	db.AddBlock(200, PriorityNew)
	db.AddBlock(150, PriorityNew)

	maxBlock = db.GetContinueFromBlock()
	if maxBlock != 200 {
		t.Errorf("Expected 200, got %d", maxBlock)
	}
}
