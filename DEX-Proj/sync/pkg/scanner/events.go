package scanner

import (
	"context"
	"log"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// handlePoolCreated 处理 PoolCreated 事件
// 当 PoolManager 创建新池子时触发
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
		// 从链上查询并更新池子的完整状态（sqrt_price_x96, liquidity, tick, reserve0, reserve1）
		s.updatePoolStateFromChain(poolAddr)
	}
}

// handleSwap 处理 Swap 事件
// 当用户在池子中交换代币时触发
func (s *Scanner) handleSwap(vLog types.Log) {
	// Event: Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)
	// Topics: [Sig, sender, recipient]
	// Data: amount0, amount1, sqrtPriceX96, liquidity, tick

	sender := common.BytesToAddress(vLog.Topics[1].Bytes())
	recipient := common.BytesToAddress(vLog.Topics[2].Bytes())

	if len(vLog.Data) < 5*32 {
		return
	}

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

	// Update pool reserves (balance0 and balance1)
	s.updatePoolReserves(vLog.Address)

	// Insert Swap
	header, err := s.Client.HeaderByNumber(context.Background(), big.NewInt(int64(vLog.BlockNumber)))
	if err != nil || header == nil {
		log.Printf("Error fetching block header for block %d: %v, using current time", vLog.BlockNumber, err)
		// Use current time as fallback
		header = &types.Header{Time: uint64(time.Now().Unix())}
	}
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

// handleMint 处理 Mint 事件
// 当用户添加流动性时触发
func (s *Scanner) handleMint(vLog types.Log) {
	// Event: Mint(address sender, address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)
	// Topics: [Sig, owner]
	// Data: sender(32), amount(32), amount0(32), amount1(32)

	if len(vLog.Data) < 4*32 {
		return
	}

	owner := common.BytesToAddress(vLog.Topics[1].Bytes())
	amount := new(big.Int).SetBytes(vLog.Data[32:64])
	amount0 := new(big.Int).SetBytes(vLog.Data[64:96])
	amount1 := new(big.Int).SetBytes(vLog.Data[96:128])

	header, err := s.Client.HeaderByNumber(context.Background(), big.NewInt(int64(vLog.BlockNumber)))
	if err != nil || header == nil {
		log.Printf("Error fetching block header for block %d: %v, using current time", vLog.BlockNumber, err)
		header = &types.Header{Time: uint64(time.Now().Unix())}
	}
	ts := time.Unix(int64(header.Time), 0)

	// 1. 插入流动性事件记录
	_, err = s.DB.Exec(`
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

	// 2. 更新 pools 表的流动性（使用累加方式）
	_, err = s.DB.Exec(`
		UPDATE pools 
		SET liquidity = liquidity + $1
		WHERE address = $2
	`, amount.String(), vLog.Address.Hex())
	if err != nil {
		log.Printf("Error updating pool liquidity: %v", err)
	}

	// 3. 更新池子的 reserve0 和 reserve1（使用 Mint 事件中的 amount0 和 amount1）
	// 这是"笨办法"：直接使用 Mint 事件中的代币数量来更新 reserve
	_, err = s.DB.Exec(`
		UPDATE pools 
		SET reserve0 = reserve0 + $1, reserve1 = reserve1 + $2
		WHERE address = $3
	`, amount0.String(), amount1.String(), vLog.Address.Hex())
	if err != nil {
		log.Printf("Error updating pool reserves from Mint event: %v", err)
	} else {
		log.Printf("✅ Updated pool reserves from Mint: %s (reserve0 += %s, reserve1 += %s)",
			vLog.Address.Hex(), amount0.String(), amount1.String())
	}
	
	// 4. 如果 balanceOf 可用，也尝试更新（作为验证）
	s.updatePoolReserves(vLog.Address)

	// 3. 更新 ticks 表的流动性
	s.updateTicksFromMint(vLog.Address, amount)

	// 4. 尝试从同一交易中查找 PositionManager 的 Transfer 事件来获取 position ID
	positionID := s.findPositionIDFromTransaction(vLog.TxHash, vLog.BlockNumber)
	if positionID != nil {
		// 找到了 position ID，更新或创建 position 记录
		log.Printf("Found position ID %s from Pool Mint event, updating position", positionID.String())
		s.updatePositionFromMint(*positionID, owner, vLog.Address, amount, vLog.BlockNumber)
	} else {
		// 没有找到 position ID，说明可能是通过 TestLP 直接添加的流动性（没有 NFT）
		// 但我们仍然可以创建一个 position 记录，使用 owner + pool + tick 的哈希作为 ID
		log.Printf("No position ID found in transaction %s, creating position from Pool Mint event",
			vLog.TxHash.Hex())
		s.createPositionFromPoolMint(owner, vLog.Address, amount, vLog.BlockNumber)
	}
}

// handleBurn 处理 Burn 事件
// 当用户移除流动性时触发
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

	header, err := s.Client.HeaderByNumber(context.Background(), big.NewInt(int64(vLog.BlockNumber)))
	if err != nil || header == nil {
		log.Printf("Error fetching block header for block %d: %v, using current time", vLog.BlockNumber, err)
		header = &types.Header{Time: uint64(time.Now().Unix())}
	}
	ts := time.Unix(int64(header.Time), 0)

	// 1. 插入流动性事件记录
	_, err = s.DB.Exec(`
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

	// 2. 更新 pools 表的流动性（使用累减方式）
	_, err = s.DB.Exec(`
		UPDATE pools 
		SET liquidity = GREATEST(0, liquidity - $1)
		WHERE address = $2
	`, amount.String(), vLog.Address.Hex())
	if err != nil {
		log.Printf("Error updating pool liquidity: %v", err)
	}

	// 3. 更新池子的 reserve0 和 reserve1（使用 Burn 事件中的 amount0 和 amount1）
	// 这是"笨办法"：直接使用 Burn 事件中的代币数量来更新 reserve
	_, err = s.DB.Exec(`
		UPDATE pools 
		SET reserve0 = GREATEST(0, reserve0 - $1), reserve1 = GREATEST(0, reserve1 - $2)
		WHERE address = $3
	`, amount0.String(), amount1.String(), vLog.Address.Hex())
	if err != nil {
		log.Printf("Error updating pool reserves from Burn event: %v", err)
	} else {
		log.Printf("✅ Updated pool reserves from Burn: %s (reserve0 -= %s, reserve1 -= %s)",
			vLog.Address.Hex(), amount0.String(), amount1.String())
	}
	
	// 4. 如果 balanceOf 可用，也尝试更新（作为验证）
	s.updatePoolReserves(vLog.Address)

	// 3. 更新 ticks 表的流动性
	s.updateTicksFromBurn(vLog.Address, amount)

	// 4. 尝试从同一交易中查找相关的 position 并更新
	s.updatePositionFromBurn(owner, vLog.Address, amount, vLog.BlockNumber, vLog.TxHash)
}

// handlePositionTransfer 处理 PositionManager 的 ERC721 Transfer 事件
// 当 from 是 0x0 时表示 mint（创建新 position），当 to 是 0x0 时表示 burn（销毁 position）
func (s *Scanner) handlePositionTransfer(vLog types.Log) {
	if len(vLog.Topics) < 4 {
		return
	}

	// Transfer(from, to, tokenId)
	from := common.BytesToAddress(vLog.Topics[1].Bytes())
	to := common.BytesToAddress(vLog.Topics[2].Bytes())
	tokenID := new(big.Int).SetBytes(vLog.Topics[3].Bytes())

	// Mint: from 是 0x0，表示创建新 position
	if from == (common.Address{}) {
		log.Printf("PositionManager minted NFT: tokenId=%s, owner=%s", tokenID.String(), to.Hex())

		// 尝试从同一交易中查找 Pool 的 Mint 事件，以获取 pool 地址和流动性信息
		receipt, err := s.Client.TransactionReceipt(context.Background(), vLog.TxHash)
		if err != nil {
			log.Printf("Error fetching transaction receipt: %v", err)
			return
		}

		// 查找同一交易中的 Pool Mint 事件
		var poolAddr common.Address
		var owner common.Address
		var liquidity *big.Int
		found := false

		for _, vLog := range receipt.Logs {
			if len(vLog.Topics) >= 2 && vLog.Topics[0] == SigMint {
				// 检查是否是已知的池子，或者尝试添加到缓存
				if !s.Pools[vLog.Address] {
					s.ensurePoolExists(vLog.Address)
				}
				if s.Pools[vLog.Address] {
					poolAddr = vLog.Address
					owner = common.BytesToAddress(vLog.Topics[1].Bytes())

					// 解析 Mint 事件的 data
					if len(vLog.Data) >= 4*32 {
						liquidity = new(big.Int).SetBytes(vLog.Data[32:64])
						found = true
						log.Printf("Found Pool Mint event: pool=%s, owner=%s, liquidity=%s",
							poolAddr.Hex(), owner.Hex(), liquidity.String())
						break
					}
				} else {
					log.Printf("Pool %s not in cache, skipping", vLog.Address.Hex())
				}
			}
		}

		if found {
			// 找到了对应的 Pool Mint 事件，更新 position
			log.Printf("Updating position %s from Transfer event", tokenID.String())
			s.updatePositionFromMint(*tokenID, owner, poolAddr, liquidity, vLog.BlockNumber)
		} else {
			// 没有找到对应的 Pool Mint 事件，通过 RPC 查询 PositionManager 合约获取详细信息
			log.Printf("No corresponding Pool Mint event found for position %s in tx %s, querying from contract",
				tokenID.String(), vLog.TxHash.Hex())

			positionInfo, err := s.queryPositionFromContract(tokenID, vLog.BlockNumber)
			if err != nil {
				log.Printf("Error querying position %s from contract: %v", tokenID.String(), err)
				return
			}

			// 使用查询到的信息创建 position 记录
			if positionInfo != nil {
				// 获取 pool 地址（需要通过 PoolManager 查询，这里先尝试从数据库查找）
				var poolAddrFromDB string
				err := s.DB.QueryRow(`
					SELECT address FROM pools 
					WHERE token0 = $1 AND token1 = $2
					LIMIT 1
				`, positionInfo.Token0.Hex(), positionInfo.Token1.Hex()).Scan(&poolAddrFromDB)

				if err == nil {
					poolAddr = common.HexToAddress(poolAddrFromDB)
					log.Printf("Found pool %s for position %s, updating position from contract data",
						poolAddr.Hex(), tokenID.String())

					// 使用合约查询到的信息更新 position
					result, err := s.DB.Exec(`
						INSERT INTO positions (
							id, owner, pool_address, token0, token1, 
							tick_lower, tick_upper, liquidity, 
							fee_growth_inside0_last_x128, fee_growth_inside1_last_x128,
							tokens_owed0, tokens_owed1
						) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
						ON CONFLICT (id) DO UPDATE SET
							owner = $2,
							liquidity = $8,
							tick_lower = $6,
							tick_upper = $7,
							fee_growth_inside0_last_x128 = $9,
							fee_growth_inside1_last_x128 = $10,
							tokens_owed0 = $11,
							tokens_owed1 = $12,
							updated_at = NOW()
					`, tokenID.String(), positionInfo.Owner.Hex(), poolAddr.Hex(),
						positionInfo.Token0.Hex(), positionInfo.Token1.Hex(),
						int(positionInfo.TickLower), int(positionInfo.TickUpper),
						positionInfo.Liquidity.String(),
						positionInfo.FeeGrowthInside0LastX128.String(),
						positionInfo.FeeGrowthInside1LastX128.String(),
						positionInfo.TokensOwed0.String(),
						positionInfo.TokensOwed1.String())

					if err != nil {
						log.Printf("Error upserting position from contract query: %v", err)
					} else {
						rowsAffected, _ := result.RowsAffected()
						log.Printf("Successfully upserted position %s from contract query (rowsAffected=%d)",
							tokenID.String(), rowsAffected)
					}
				} else {
					log.Printf("Could not find pool for position %s (token0=%s, token1=%s): %v",
						tokenID.String(), positionInfo.Token0.Hex(), positionInfo.Token1.Hex(), err)
				}
			}
		}
	} else if to == (common.Address{}) {
		// Burn: to 是 0x0，表示销毁 position
		log.Printf("PositionManager burned NFT: tokenId=%s", tokenID.String())

		// 更新 position 的流动性为 0（如果还没有被更新）
		_, err := s.DB.Exec(`
			UPDATE positions 
			SET liquidity = 0, updated_at = NOW()
			WHERE id = $1
		`, tokenID.String())
		if err != nil {
			log.Printf("Error updating position on burn: %v", err)
		}
	} else {
		// 普通的 Transfer（不是 mint/burn），可能是 position 的所有权转移
		log.Printf("PositionManager transferred NFT: tokenId=%s, from=%s, to=%s",
			tokenID.String(), from.Hex(), to.Hex())

		// 更新 position 的 owner
		_, err := s.DB.Exec(`
			UPDATE positions 
			SET owner = $1, updated_at = NOW()
			WHERE id = $2
		`, to.Hex(), tokenID.String())
		if err != nil {
			log.Printf("Error updating position owner: %v", err)
		}
	}
}
