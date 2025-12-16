package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	_ "github.com/lib/pq"
)

// Scanner handles the blockchain scanning logic
type Scanner struct {
	Client  *ethclient.Client
	DB      *sql.DB
	Config  Config
	Pools   map[common.Address]bool // Cache of known pools
	Current uint64                  // Current scan block
}

// Event Signatures
var (
	// Factory/PoolManager: PoolCreated(address,address,uint32,int24,int24,uint24,address)
	// Note: Based on code, NO parameters are indexed.
	SigPoolCreated = crypto.Keccak256Hash([]byte("PoolCreated(address,address,uint32,int24,int24,uint24,address)"))

	// Pool: Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)
	SigSwap = crypto.Keccak256Hash([]byte("Swap(address,address,int256,int256,uint160,uint128,int24)"))

	// Pool: Mint(address sender, address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)
	SigMint = crypto.Keccak256Hash([]byte("Mint(address,address,uint128,uint256,uint256)"))

	// Pool: Burn(address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)
	SigBurn = crypto.Keccak256Hash([]byte("Burn(address,uint128,uint256,uint256)"))
)

func NewScanner(config Config, db *sql.DB) (*Scanner, error) {
	client, err := ethclient.Dial(config.Infura.Url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to infura: %v", err)
	}

	scanner := &Scanner{
		Client:  client,
		DB:      db,
		Config:  config,
		Pools:   make(map[common.Address]bool),
		Current: uint64(config.Infura.StartBlock),
	}

	// Load existing pools from DB
	rows, err := db.Query("SELECT address FROM pools")
	if err != nil {
		return nil, fmt.Errorf("failed to load pools: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var addr string
		if err := rows.Scan(&addr); err != nil {
			continue
		}
		scanner.Pools[common.HexToAddress(addr)] = true
	}
	log.Printf("Loaded %d pools from database", len(scanner.Pools))

	// Determine start block from DB (max block processed)
	var maxBlock sql.NullInt64
	// Check max block from swaps or other tables
	err = db.QueryRow("SELECT MAX(block_number) FROM swaps").Scan(&maxBlock)
	if err == nil && maxBlock.Valid {
		if uint64(maxBlock.Int64) > scanner.Current {
			scanner.Current = uint64(maxBlock.Int64) + 1
			log.Printf("Resuming from block %d", scanner.Current)
		}
	}

	return scanner, nil
}

func (s *Scanner) Run() {
	ticker := time.NewTicker(12 * time.Second)
	defer ticker.Stop()

	for {
		header, err := s.Client.HeaderByNumber(context.Background(), nil)
		if err != nil {
			log.Printf("Failed to get latest block: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}

		latestBlock := header.Number.Uint64()
		if s.Current > latestBlock {
			log.Printf("Synced to head (%d). Waiting for new blocks...", latestBlock)
			<-ticker.C
			continue
		}

		// Sync in chunks
		end := s.Current + 1000
		if end > latestBlock {
			end = latestBlock
		}

		log.Printf("Scanning range %d - %d", s.Current, end)
		if err := s.scanRange(s.Current, end); err != nil {
			log.Printf("Error scanning range: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}

		s.Current = end + 1
	}
}

func (s *Scanner) scanRange(start, end uint64) error {
	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(start)),
		ToBlock:   big.NewInt(int64(end)),
		// We listen to PoolManager for creation, and all known Pools for activities
		// Ideally we split this if too many pools, but for now single filter might work
		// or better: filter by Topics (Event Signatures) generally
	}

	// Strategy:
	// 1. Filter for PoolCreated from PoolManager/Factory
	// 2. Filter for Swap/Mint/Burn from ANY address (and filter by known pools in code)
	//    OR add known pools to Addresses list (might be too long)
	// Given we are indexing specific contracts, let's start with broader topic search
	// and filter by address in code if needed.
	// Actually, best practice:
	// Query 1: PoolCreated from PoolManager
	// Query 2: Swap/Mint/Burn from known Pools (if list is small)
	// If list is large, Bloom filter on topics is efficient.

	// Let's try fetching all logs with relevant topics and filter in code.
	query.Topics = [][]common.Hash{
		{SigPoolCreated, SigSwap, SigMint, SigBurn},
	}

	logs, err := s.Client.FilterLogs(context.Background(), query)
	if err != nil {
		return err
	}

	for _, vLog := range logs {
		switch vLog.Topics[0] {
		case SigPoolCreated:
			// Check if emitted by PoolManager
			if vLog.Address == common.HexToAddress(s.Config.Contracts.PoolManager) {
				s.handlePoolCreated(vLog)
			}
		case SigSwap:
			if s.Pools[vLog.Address] {
				s.handleSwap(vLog)
			}
		case SigMint:
			if s.Pools[vLog.Address] {
				s.handleMint(vLog)
			}
		case SigBurn:
			if s.Pools[vLog.Address] {
				s.handleBurn(vLog)
			}
		}
	}
	return nil
}

func (s *Scanner) handlePoolCreated(vLog types.Log) {
	// Event: PoolCreated(address token0, address token1, uint32 index, int24 tickLower, int24 tickUpper, uint24 fee, address pool)
	// Non-indexed: all in Data

	// Data layout (unindexed):
	// token0 (32 bytes)
	// token1 (32 bytes)
	// index (32 bytes)
	// tickLower (32 bytes)
	// tickUpper (32 bytes)
	// fee (32 bytes)
	// pool (32 bytes)

	if len(vLog.Data) < 7*32 {
		log.Printf("Invalid PoolCreated data length: %d", len(vLog.Data))
		return
	}

	token0 := common.BytesToAddress(vLog.Data[0:32])
	token1 := common.BytesToAddress(vLog.Data[32:64])
	// index := new(big.Int).SetBytes(vLog.Data[64:96])
	tickLower := int32(new(big.Int).SetBytes(vLog.Data[96:128]).Int64())  // int24
	tickUpper := int32(new(big.Int).SetBytes(vLog.Data[128:160]).Int64()) // int24
	fee := new(big.Int).SetBytes(vLog.Data[160:192]).Int64()              // uint24
	poolAddr := common.BytesToAddress(vLog.Data[192:224])

	log.Printf("Found new pool: %s (Tokens: %s, %s)", poolAddr.Hex(), token0.Hex(), token1.Hex())

	// Ensure tokens exist before inserting pool to satisfy foreign key constraints
	s.ensureToken(token0)
	s.ensureToken(token1)

	// Store in DB
	_, err := s.DB.Exec(`
		INSERT INTO pools (address, token0, token1, fee, tick_lower, tick_upper, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (address) DO NOTHING
	`, poolAddr.Hex(), token0.Hex(), token1.Hex(), fee, tickLower, tickUpper, time.Now())

	if err != nil {
		log.Printf("Error inserting pool: %v", err)
	} else {
		// Add to cache
		s.Pools[poolAddr] = true
	}
}

func (s *Scanner) ensureToken(addr common.Address) {
	// Simple insert ignore, ideal would be to fetch metadata (symbol, decimals) from chain
	_, err := s.DB.Exec(`
		INSERT INTO tokens (address, symbol, name, decimals)
		VALUES ($1, 'UNK', 'Unknown', 18)
		ON CONFLICT (address) DO NOTHING
	`, addr.Hex())
	if err != nil {
		log.Printf("Error inserting token: %v", err)
	}
}

func (s *Scanner) handleSwap(vLog types.Log) {
	// Event: Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)
	// Topics: [Sig, sender, recipient]
	// Data: amount0, amount1, sqrtPriceX96, liquidity, tick

	sender := common.BytesToAddress(vLog.Topics[1].Bytes())
	recipient := common.BytesToAddress(vLog.Topics[2].Bytes())

	if len(vLog.Data) < 5*32 {
		return
	}

	amount0 := new(big.Int).SetBytes(vLog.Data[0:32])
	// Handle signed int256 for amounts
	if amount0.Cmp(big.NewInt(0).Lsh(big.NewInt(1), 255)) > 0 { // negative check hack (two's complement)
		// Go big.Int handles bytes as unsigned magnitude usually unless set explicitly?
		// SetBytes interprets as unsigned big endian.
		// We need to interpret as signed 256-bit.
		// Easier: stick to Numeric in DB, let application handle sign or cast here.
		// For DB insert, simple string representation of unsigned is risky if negative.
		// Let's parse properly.
	}
	// Actually for simplicity, we pass string. If it's really signed in 2's complement,
	// large numbers = negative.
	// Let's use a helper to parse signed 256-bit from bytes if needed,
	// but standard big.Int.SetBytes treats as positive.

	// Quick parse helper for signed 256
	parseSigned := func(b []byte) *big.Int {
		x := new(big.Int).SetBytes(b)
		if x.Cmp(big.NewInt(0).Lsh(big.NewInt(1), 255)) >= 0 {
			// Negative
			x.Sub(x, big.NewInt(0).Lsh(big.NewInt(1), 256))
		}
		return x
	}

	amt0 := parseSigned(vLog.Data[0:32])
	amt1 := parseSigned(vLog.Data[32:64])

	sqrtPrice := new(big.Int).SetBytes(vLog.Data[64:96])
	liquidity := new(big.Int).SetBytes(vLog.Data[96:128])
	tick := parseSigned(vLog.Data[128:160]) // int24 is small, but passed as 32 bytes

	// Update Pool State
	_, err := s.DB.Exec(`
		UPDATE pools SET sqrt_price_x96 = $1, liquidity = $2, tick = $3
		WHERE address = $4
	`, sqrtPrice.String(), liquidity.String(), tick.Int64(), vLog.Address.Hex())
	if err != nil {
		log.Printf("Error updating pool state: %v", err)
	}

	// Insert Swap
	// blockTimestamp: we need to fetch block time. For speed, maybe skip or cache?
	// For now use current time or fetch block. fetching block is slower.
	// Let's assume fetching block is OK.
	header, _ := s.Client.HeaderByNumber(context.Background(), big.NewInt(int64(vLog.BlockNumber)))
	ts := time.Unix(int64(header.Time), 0)

	_, err = s.DB.Exec(`
		INSERT INTO swaps (
			transaction_hash, log_index, pool_address, sender, recipient, 
			amount0, amount1, sqrt_price_x96, liquidity, tick, 
			block_number, block_timestamp
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (transaction_hash, log_index) DO NOTHING
	`,
		vLog.TxHash.Hex(), vLog.Index, vLog.Address.Hex(), sender.Hex(), recipient.Hex(),
		amt0.String(), amt1.String(), sqrtPrice.String(), liquidity.String(), tick.Int64(),
		vLog.BlockNumber, ts,
	)
	if err != nil {
		log.Printf("Error inserting swap: %v", err)
	}
}

func (s *Scanner) handleMint(vLog types.Log) {
	// Event: Mint(address sender, address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)
	// Topics: [Sig, owner]
	// Data: sender(32), amount(32), amount0(32), amount1(32)

	// Wait, definition in IPool:
	// event Mint(address sender, address indexed owner, uint128 amount, uint256 amount0, uint256 amount1);
	// sender is NOT indexed.
	// So data has: sender, amount, amount0, amount1

	if len(vLog.Data) < 4*32 {
		return
	}

	owner := common.BytesToAddress(vLog.Topics[1].Bytes())
	// sender := common.BytesToAddress(vLog.Data[0:32])
	amount := new(big.Int).SetBytes(vLog.Data[32:64])
	amount0 := new(big.Int).SetBytes(vLog.Data[64:96])
	amount1 := new(big.Int).SetBytes(vLog.Data[96:128])

	header, _ := s.Client.HeaderByNumber(context.Background(), big.NewInt(int64(vLog.BlockNumber)))
	ts := time.Unix(int64(header.Time), 0)

	_, err := s.DB.Exec(`
		INSERT INTO liquidity_events (
			transaction_hash, log_index, pool_address, type, owner, 
			amount, amount0, amount1, block_number, block_timestamp
		) VALUES ($1, $2, $3, 'MINT', $4, $5, $6, $7, $8, $9)
		ON CONFLICT DO NOTHING
	`, vLog.TxHash.Hex(), vLog.Index, vLog.Address.Hex(), owner.Hex(),
		amount.String(), amount0.String(), amount1.String(), vLog.BlockNumber, ts)

	if err != nil {
		log.Printf("Error inserting mint: %v", err)
	}
}

func (s *Scanner) handleBurn(vLog types.Log) {
	// Event: Burn(address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)
	// Topics: [Sig, owner]
	// Data: amount, amount0, amount1

	if len(vLog.Data) < 3*32 {
		return
	}

	owner := common.BytesToAddress(vLog.Topics[1].Bytes())
	amount := new(big.Int).SetBytes(vLog.Data[0:32])
	amount0 := new(big.Int).SetBytes(vLog.Data[32:64])
	amount1 := new(big.Int).SetBytes(vLog.Data[64:96])

	header, _ := s.Client.HeaderByNumber(context.Background(), big.NewInt(int64(vLog.BlockNumber)))
	ts := time.Unix(int64(header.Time), 0)

	_, err := s.DB.Exec(`
		INSERT INTO liquidity_events (
			transaction_hash, log_index, pool_address, type, owner, 
			amount, amount0, amount1, block_number, block_timestamp
		) VALUES ($1, $2, $3, 'BURN', $4, $5, $6, $7, $8, $9)
		ON CONFLICT DO NOTHING
	`, vLog.TxHash.Hex(), vLog.Index, vLog.Address.Hex(), owner.Hex(),
		amount.String(), amount0.String(), amount1.String(), vLog.BlockNumber, ts)

	if err != nil {
		log.Printf("Error inserting burn: %v", err)
	}
}
