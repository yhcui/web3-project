package storage

import (
	"os"
	"testing"
)

func TestBackfillDB(t *testing.T) {
	dbFile := "test_backfill.db"
	defer os.Remove(dbFile)

	backfillDB, err := NewBackfillDB(dbFile)
	if err != nil {
		t.Fatalf("NewBackfillDB failed: %v", err)
	}
	defer backfillDB.Close()

	chainID := uint64(1)
	address := "0x1234567890abcdef"

	t.Run("LoadDefault", func(t *testing.T) {
		state, err := backfillDB.LoadBackfillCursor(chainID, address)
		if err != nil {
			t.Fatalf("LoadBackfillCursor failed: %v", err)
		}
		if state.NormalPage != 1 || state.TokenPage != 1 {
			t.Errorf("Expected default pages to be 1, got normal=%d token=%d", state.NormalPage, state.TokenPage)
		}
		if state.NormalDone || state.TokenDone {
			t.Errorf("Expected done flags to be false")
		}
	})

	t.Run("SaveAndLoad", func(t *testing.T) {
		want := BackfillCursorState{
			NormalPage: 5,
			TokenPage:  3,
			NormalDone: true,
			TokenDone:  false,
		}

		err := backfillDB.SaveBackfillCursor(chainID, address, want)
		if err != nil {
			t.Fatalf("SaveBackfillCursor failed: %v", err)
		}

		got, err := backfillDB.LoadBackfillCursor(chainID, address)
		if err != nil {
			t.Fatalf("LoadBackfillCursor failed: %v", err)
		}

		if got.NormalPage != want.NormalPage || got.TokenPage != want.TokenPage {
			t.Errorf("Pages mismatch: got normal=%d token=%d, want normal=%d token=%d",
				got.NormalPage, got.TokenPage, want.NormalPage, want.TokenPage)
		}
		if got.NormalDone != want.NormalDone || got.TokenDone != want.TokenDone {
			t.Errorf("Done flags mismatch: got normal=%v token=%v, want normal=%v token=%v",
				got.NormalDone, got.TokenDone, want.NormalDone, want.TokenDone)
		}
	})

	t.Run("Update", func(t *testing.T) {
		updated := BackfillCursorState{
			NormalPage: 10,
			TokenPage:  8,
			NormalDone: true,
			TokenDone:  true,
		}

		err := backfillDB.SaveBackfillCursor(chainID, address, updated)
		if err != nil {
			t.Fatalf("SaveBackfillCursor (update) failed: %v", err)
		}

		got, err := backfillDB.LoadBackfillCursor(chainID, address)
		if err != nil {
			t.Fatalf("LoadBackfillCursor failed: %v", err)
		}

		if got.NormalPage != updated.NormalPage || got.TokenPage != updated.TokenPage {
			t.Errorf("Update failed: got normal=%d token=%d, want normal=%d token=%d",
				got.NormalPage, got.TokenPage, updated.NormalPage, updated.TokenPage)
		}
		if !got.NormalDone || !got.TokenDone {
			t.Errorf("Expected both done flags to be true")
		}
	})

	t.Run("AddressNormalization", func(t *testing.T) {
		upperAddress := "0xABCDEF"
		lowerAddress := "0xabcdef"

		state := BackfillCursorState{
			NormalPage: 2,
			TokenPage:  2,
		}

		err := backfillDB.SaveBackfillCursor(chainID, upperAddress, state)
		if err != nil {
			t.Fatalf("SaveBackfillCursor failed: %v", err)
		}

		got, err := backfillDB.LoadBackfillCursor(chainID, lowerAddress)
		if err != nil {
			t.Fatalf("LoadBackfillCursor failed: %v", err)
		}

		if got.NormalPage != state.NormalPage {
			t.Errorf("Address normalization failed: got page=%d, want page=%d", got.NormalPage, state.NormalPage)
		}
	})
}
