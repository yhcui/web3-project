package storage

import (
	"runtime"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// BenchmarkAddBlockRange_Large 测试大批量插入性能
func BenchmarkAddBlockRange_Large(b *testing.B) {
	tmpDir := b.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		start := uint64(i * 100000)
		db.AddBlockRange(start, start+99999, PriorityCatchup)
	}
}

// BenchmarkGetTasks_Concurrent 测试并发获取任务性能
func BenchmarkGetTasks_Concurrent(b *testing.B) {
	tmpDir := b.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	// 预填充 10 万区块
	db.AddBlockRange(1, 100000, PriorityNew)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			db.GetTasks(10)
		}
	})
}

// TestConcurrentGetTasks_NoDoubleRead 测试并发安全性：确保无重复处理
func TestConcurrentGetTasks_NoDoubleRead(t *testing.T) {
	tmpDir := t.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	// 插入 5000 个区块
	totalBlocks := 5000
	db.AddBlockRange(1, uint64(totalBlocks), PriorityNew)

	// 50 个并发 worker
	workerCount := 50
	var wg sync.WaitGroup
	processedBlocks := sync.Map{}
	duplicateCount := atomic.Int64{}
	getTasksCount := atomic.Int64{}

	start := time.Now()

	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for {
				tasks, err := db.GetTasks(10)
				if err != nil {
					t.Logf("Worker %d GetTasks error: %v", workerID, err)
					time.Sleep(10 * time.Millisecond)
					continue
				}
				if len(tasks) == 0 {
					return
				}

				for _, task := range tasks {
					getTasksCount.Add(1)

					// 检查是否重复
					if oldWorker, exists := processedBlocks.LoadOrStore(task.BlockNum, workerID); exists {
						duplicateCount.Add(1)
						t.Errorf("Block %d: Worker %d got it, but Worker %v already had it!",
							task.BlockNum, workerID, oldWorker)
					}

					// 删除区块
					err := db.RemoveBlock(task.BlockNum)
					if err != nil {
						t.Logf("Worker %d RemoveBlock error: %v", workerID, err)
					}
				}

				// 短暂休眠减少锁竞争
				time.Sleep(time.Millisecond)
			}
		}(i)
	}

	wg.Wait()
	elapsed := time.Since(start)

	// 统计实际处理的唯一区块数
	uniqueBlocks := 0
	processedBlocks.Range(func(key, value interface{}) bool {
		uniqueBlocks++
		return true
	})

	totalGot := getTasksCount.Load()
	duplicates := duplicateCount.Load()

	t.Logf("=== Concurrent Safety Test Results ===")
	t.Logf("Total blocks inserted: %d", totalBlocks)
	t.Logf("Total tasks returned by GetTasks: %d", totalGot)
	t.Logf("Unique blocks processed: %d", uniqueBlocks)
	t.Logf("Duplicate reads: %d", duplicates)
	t.Logf("Workers: %d", workerCount)
	t.Logf("Time elapsed: %v", elapsed)
	t.Logf("Throughput: %.2f blocks/sec", float64(uniqueBlocks)/elapsed.Seconds())

	if duplicates > 0 {
		t.Errorf("FAILED: Found %d duplicate reads!", duplicates)
	}
	if uniqueBlocks != totalBlocks {
		t.Errorf("FAILED: Expected %d unique blocks, got %d", totalBlocks, uniqueBlocks)
	}
	if totalGot != int64(totalBlocks) {
		t.Logf("WARNING: GetTasks returned %d tasks total, expected %d (some blocks may have been returned multiple times)", totalGot, totalBlocks)
	}
}

// TestPriorityOrdering_NewFirst 测试优先级：新区块优先
func TestPriorityOrdering_NewFirst(t *testing.T) {
	tmpDir := t.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	// 插入旧区块（priority=50）
	db.AddBlockRange(1, 1000, PriorityCatchup)

	// 插入新区块（priority=0）
	db.AddBlockRange(5000, 5100, PriorityNew)

	// 获取任务
	tasks, _ := db.GetTasks(50)

	// 验证前 50 个都是新区块（5000-5100 范围）
	newBlockCount := 0
	for _, task := range tasks {
		if task.BlockNum >= 5000 && task.BlockNum <= 5100 {
			newBlockCount++
		}
	}

	t.Logf("=== Priority Test Results ===")
	t.Logf("New blocks in first 50 tasks: %d/50", newBlockCount)
	t.Logf("First task block: %d (priority=%d)", tasks[0].BlockNum, tasks[0].BasePriority)

	if newBlockCount < 50 {
		t.Errorf("FAILED: Expected 50 new blocks first, got %d", newBlockCount)
	}
	if tasks[0].BasePriority != PriorityNew {
		t.Errorf("FAILED: First task should be PriorityNew, got %d", tasks[0].BasePriority)
	}
}

// BenchmarkMixedWorkload 测试混合负载性能
func BenchmarkMixedWorkload(b *testing.B) {
	tmpDir := b.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	// 预填充
	db.AddBlockRange(1, 50000, PriorityNew)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			tasks, _ := db.GetTasks(10)
			for _, task := range tasks {
				db.RemoveBlock(task.BlockNum)
			}
		}
	})
}

// TestStressTest 压力测试
func TestStressTest(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping stress test in short mode")
	}

	tmpDir := t.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	// 预填充
	db.AddBlockRange(1, 100000, PriorityNew)

	workerCount := 100
	duration := 10 * time.Second
	var wg sync.WaitGroup
	stop := make(chan struct{})
	processedCount := atomic.Int64{}
	errorCount := atomic.Int64{}

	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for {
				select {
				case <-stop:
					return
				default:
					tasks, err := db.GetTasks(10)
					if err != nil {
						errorCount.Add(1)
						continue
					}
					for _, task := range tasks {
						db.RemoveBlock(task.BlockNum)
						processedCount.Add(1)
					}

					// 动态添加新区块
					if id == 0 && processedCount.Load()%1000 == 0 {
						base := uint64(100000 + processedCount.Load())
						db.AddBlockRange(base, base+99, PriorityNew)
					}
				}
			}
		}(i)
	}

	// 运行指定时间
	time.Sleep(duration)
	close(stop)
	wg.Wait()

	processed := processedCount.Load()
	errors := errorCount.Load()

	t.Logf("=== Stress Test Results ===")
	t.Logf("Duration: %v", duration)
	t.Logf("Workers: %d", workerCount)
	t.Logf("Processed: %d blocks", processed)
	t.Logf("Errors: %d", errors)
	t.Logf("Throughput: %.0f blocks/sec", float64(processed)/duration.Seconds())

	if errors > 0 {
		t.Logf("WARNING: %d errors occurred", errors)
	}
}

// TestMemoryUsage 内存使用测试
func TestMemoryUsage(t *testing.T) {
	tmpDir := t.TempDir()
	chainID := uint64(56)
	db, _ := NewBlockQueue(tmpDir, chainID, "test")

	var m1, m2 runtime.MemStats
	runtime.ReadMemStats(&m1)

	// 插入 100 万区块
	batchSize := 50000
	for i := 0; i < 1000000; i += batchSize {
		db.AddBlockRange(uint64(i+1), uint64(i+batchSize), PriorityNew)
	}

	runtime.ReadMemStats(&m2)

	allocMB := float64(m2.Alloc-m1.Alloc) / 1024 / 1024

	t.Logf("=== Memory Usage Test ===")
	t.Logf("Blocks inserted: 1,000,000")
	t.Logf("Memory allocated: %.2f MB", allocMB)
	t.Logf("Memory per block: %.2f bytes", float64(m2.Alloc-m1.Alloc)/1000000.0)
}
