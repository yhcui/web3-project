package storage

import (
	"os"
	"testing"
)

func BenchmarkMmapSave(b *testing.B) {
	const file = "test.map"
	defer os.Remove(file)
	m, _ := NewHeightMap(file)
	defer m.Close()

	for i := 0; b.Loop(); i++ {
		// 模拟随机写入不同链的区块号
		m.SaveBlock(uint64(i%100), uint64(i))
	}
}
