package storage

import (
	"path/filepath"
	"testing"
)

func TestBackfillCursorRoundTrip(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "height.map")
	hm, err := NewHeightMap(dbPath)
	if err != nil {
		t.Fatalf("NewHeightMap failed: %v", err)
	}
	t.Cleanup(func() { _ = hm.Close() })

	chainID := uint64(56)
	address := "0x3508D90900f8dEB79ca19769F206E1C5b668FCe0"

	initial, err := hm.LoadBackfillCursor(chainID, address)
	if err != nil {
		t.Fatalf("LoadBackfillCursor(initial) failed: %v", err)
	}
	if initial.NormalPage != 1 || initial.TokenPage != 1 || initial.NormalDone || initial.TokenDone {
		t.Fatalf("unexpected initial cursor: %+v", initial)
	}

	want := BackfillCursorState{
		NormalPage: 3,
		TokenPage:  7,
		NormalDone: true,
		TokenDone:  false,
	}
	if err := hm.SaveBackfillCursor(chainID, address, want); err != nil {
		t.Fatalf("SaveBackfillCursor failed: %v", err)
	}

	got, err := hm.LoadBackfillCursor(chainID, address)
	if err != nil {
		t.Fatalf("LoadBackfillCursor(after save) failed: %v", err)
	}
	if got != want {
		t.Fatalf("cursor mismatch: got=%+v want=%+v", got, want)
	}
}
