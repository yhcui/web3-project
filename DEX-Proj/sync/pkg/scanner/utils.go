package scanner

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

// ERC20 ABI 定义（仅包含我们需要的方法）
var erc20ABI = `[
	{
		"constant": true,
		"inputs": [],
		"name": "symbol",
		"outputs": [{"name": "", "type": "string"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "name",
		"outputs": [{"name": "", "type": "string"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "decimals",
		"outputs": [{"name": "", "type": "uint8"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [{"name": "account", "type": "address"}],
		"name": "balanceOf",
		"outputs": [{"name": "", "type": "uint256"}],
		"type": "function"
	}
]`

// ensureToken 确保代币记录存在于数据库中，从 ERC20 合约读取 symbol、name 和 decimals
func (s *Scanner) ensureToken(addr common.Address) {
	// 先检查数据库中是否已存在
	var exists bool
	err := s.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM tokens WHERE address = $1)
	`, addr.Hex()).Scan(&exists)
	if err != nil {
		log.Printf("Error checking token existence: %v", err)
		return
	}
	if exists {
		// 代币已存在，跳过
		return
	}

	// 从 ERC20 合约读取信息
	symbol := "UNK"
	name := "Unknown"
	decimals := int64(18)

	parsedABI, err := abi.JSON(strings.NewReader(erc20ABI))
	if err != nil {
		log.Printf("Error parsing ERC20 ABI: %v", err)
		// 使用默认值插入
		s.insertToken(addr, symbol, name, decimals)
		return
	}

	ctx := context.Background()

	// 调用 symbol()
	if symbolMethod, ok := parsedABI.Methods["symbol"]; ok {
		data, err := parsedABI.Pack("symbol")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &addr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := symbolMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if s, ok := unpacked[0].(string); ok {
						symbol = s
					}
				}
			}
		}
	}

	// 调用 name()
	if nameMethod, ok := parsedABI.Methods["name"]; ok {
		data, err := parsedABI.Pack("name")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &addr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := nameMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if n, ok := unpacked[0].(string); ok {
						name = n
					}
				}
			}
		}
	}

	// 调用 decimals()
	if decimalsMethod, ok := parsedABI.Methods["decimals"]; ok {
		data, err := parsedABI.Pack("decimals")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &addr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := decimalsMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					// decimals 返回 uint8
					switch v := unpacked[0].(type) {
					case uint8:
						decimals = int64(v)
					case uint16:
						decimals = int64(v)
					case uint32:
						decimals = int64(v)
					case uint64:
						decimals = int64(v)
					case *big.Int:
						decimals = v.Int64()
					default:
						log.Printf("Unexpected decimals type for token %s: %T", addr.Hex(), v)
					}
				}
			}
		}
	}

	// 插入数据库
	s.insertToken(addr, symbol, name, decimals)
}

// insertToken 将代币信息插入数据库
func (s *Scanner) insertToken(addr common.Address, symbol, name string, decimals int64) {
	_, err := s.DB.Exec(`
		INSERT INTO tokens (address, symbol, name, decimals)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (address) DO NOTHING
	`, addr.Hex(), symbol, name, decimals)
	if err != nil {
		log.Printf("Error inserting token: %v", err)
	} else {
		log.Printf("Inserted token: %s (symbol=%s, name=%s, decimals=%d)", addr.Hex(), symbol, name, decimals)
	}
}

// ensurePoolExists 尝试从数据库加载池子信息，如果不存在则尝试从链上创建记录
func (s *Scanner) ensurePoolExists(poolAddr common.Address) bool {
	// Check if pool exists in DB
	var exists bool
	err := s.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM pools WHERE address = $1)
	`, poolAddr.Hex()).Scan(&exists)

	if err != nil {
		log.Printf("Error checking pool existence: %v", err)
		return false
	}

	if exists {
		// Pool exists in DB, add to cache
		s.Pools[poolAddr] = true
		return true
	}

	// Pool doesn't exist in DB, try to create it from chain
	log.Printf("Pool %s not found in database, attempting to create from chain...", poolAddr.Hex())
	if s.createPoolFromChain(poolAddr) {
		s.Pools[poolAddr] = true
		return true
	}

	// Failed to create pool, don't add to cache
	log.Printf("⚠️  Failed to create pool %s from chain, skipping events for this pool", poolAddr.Hex())
	return false
}

// updateTicksFromMint 从 Mint 事件更新 ticks 表的流动性
// 注意：在这个简化实现中，所有流动性都在池子的 tickLower 到 tickUpper 之间
// 所以我们需要更新这两个边界 tick 的流动性
func (s *Scanner) updateTicksFromMint(poolAddr common.Address, liquidity *big.Int) {
	// 查询池子的 tick_lower 和 tick_upper
	var tickLower, tickUpper int
	err := s.DB.QueryRow(`
		SELECT tick_lower, tick_upper FROM pools WHERE address = $1
	`, poolAddr.Hex()).Scan(&tickLower, &tickUpper)
	if err != nil {
		log.Printf("Error querying pool ticks for update: %v", err)
		return
	}

	// 更新 tick_lower 的流动性
	// liquidity_gross: 总流动性（累加）
	// liquidity_net: 净流动性变化（向上为正，这里在 tickLower 处，价格向上移动时流动性增加）
	_, err = s.DB.Exec(`
		INSERT INTO ticks (
			pool_address, tick_index, liquidity_gross, liquidity_net,
			fee_growth_outside0_x128, fee_growth_outside1_x128
		) VALUES ($1, $2, $3, $4, 0, 0)
		ON CONFLICT (pool_address, tick_index) DO UPDATE SET
			liquidity_gross = ticks.liquidity_gross + $3,
			liquidity_net = ticks.liquidity_net + $4,
			updated_at = NOW()
	`, poolAddr.Hex(), tickLower, liquidity.String(), liquidity.String())
	if err != nil {
		log.Printf("Error updating tick_lower: %v", err)
	}

	// 更新 tick_upper 的流动性
	// 在 tickUpper 处，价格向上移动时流动性减少（所以 liquidity_net 为负）
	liquidityNeg := new(big.Int).Neg(liquidity)
	_, err = s.DB.Exec(`
		INSERT INTO ticks (
			pool_address, tick_index, liquidity_gross, liquidity_net,
			fee_growth_outside0_x128, fee_growth_outside1_x128
		) VALUES ($1, $2, $3, $4, 0, 0)
		ON CONFLICT (pool_address, tick_index) DO UPDATE SET
			liquidity_gross = ticks.liquidity_gross + $3,
			liquidity_net = ticks.liquidity_net + $4,
			updated_at = NOW()
	`, poolAddr.Hex(), tickUpper, liquidity.String(), liquidityNeg.String())
	if err != nil {
		log.Printf("Error updating tick_upper: %v", err)
	}
}

// updateTicksFromBurn 从 Burn 事件更新 ticks 表的流动性
func (s *Scanner) updateTicksFromBurn(poolAddr common.Address, liquidity *big.Int) {
	// 查询池子的 tick_lower 和 tick_upper
	var tickLower, tickUpper int
	err := s.DB.QueryRow(`
		SELECT tick_lower, tick_upper FROM pools WHERE address = $1
	`, poolAddr.Hex()).Scan(&tickLower, &tickUpper)
	if err != nil {
		log.Printf("Error querying pool ticks for update: %v", err)
		return
	}

	// 更新 tick_lower 的流动性（减少）
	_, err = s.DB.Exec(`
		UPDATE ticks SET
			liquidity_gross = GREATEST(0, liquidity_gross - $1),
			liquidity_net = liquidity_net - $1,
			updated_at = NOW()
		WHERE pool_address = $2 AND tick_index = $3
	`, liquidity.String(), poolAddr.Hex(), tickLower)
	if err != nil {
		log.Printf("Error updating tick_lower on burn: %v", err)
	}

	// 更新 tick_upper 的流动性（减少，liquidity_net 增加，因为负值减少）
	_, err = s.DB.Exec(`
		UPDATE ticks SET
			liquidity_gross = GREATEST(0, liquidity_gross - $1),
			liquidity_net = liquidity_net + $1,
			updated_at = NOW()
		WHERE pool_address = $2 AND tick_index = $3
	`, liquidity.String(), poolAddr.Hex(), tickUpper)
	if err != nil {
		log.Printf("Error updating tick_upper on burn: %v", err)
	}
}

// getPoolLiquidity 查询 Pool 合约的当前流动性
// 注意：这需要 Pool 合约有 liquidity() 方法，如果查询失败则返回错误
// 目前未实现，因为我们可以从 Swap 事件中获取流动性，或者使用累加/累减方式
func (s *Scanner) getPoolLiquidity(poolAddr common.Address, blockNumber uint64) (*big.Int, error) {
	// 未实现，返回错误
	return nil, fmt.Errorf("not implemented")
}

// checkContractExists 检查合约是否存在（有代码）
func (s *Scanner) checkContractExists(addr common.Address) bool {
	ctx := context.Background()
	code, err := s.Client.CodeAt(ctx, addr, nil)
	if err != nil {
		return false
	}
	return len(code) > 0
}

// updatePoolReserves 更新池子的 reserve0 和 reserve1
// 通过调用 token0 和 token1 的 balanceOf(poolAddress) 获取余额
func (s *Scanner) updatePoolReserves(poolAddr common.Address) {
	log.Printf("[updatePoolReserves] Starting to update reserves for pool: %s", poolAddr.Hex())
	
	// 查询池子的 token0 和 token1 地址
	var token0Addr, token1Addr string
	err := s.DB.QueryRow(`
		SELECT token0, token1 FROM pools WHERE address = $1
	`, poolAddr.Hex()).Scan(&token0Addr, &token1Addr)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("⚠️  Pool %s does not exist in database, skipping reserve update", poolAddr.Hex())
		} else {
			log.Printf("❌ Error querying pool tokens for reserve update (pool=%s): %v", poolAddr.Hex(), err)
		}
		return
	}

	token0 := common.HexToAddress(token0Addr)
	token1 := common.HexToAddress(token1Addr)

	log.Printf("[updatePoolReserves] Pool %s: token0=%s, token1=%s", poolAddr.Hex(), token0.Hex(), token1.Hex())

	// 解析 ERC20 ABI
	parsedABI, err := abi.JSON(strings.NewReader(erc20ABI))
	if err != nil {
		log.Printf("Error parsing ERC20 ABI for reserve update: %v", err)
		return
	}

	ctx := context.Background()
	var reserve0, reserve1 *big.Int
	var err0, err1 error

	// 获取 token0 余额
	balanceMethod, ok := parsedABI.Methods["balanceOf"]
	if !ok {
		log.Printf("balanceOf method not found in ERC20 ABI")
		return
	}

	data0, err := parsedABI.Pack("balanceOf", poolAddr)
	if err != nil {
		log.Printf("Error packing balanceOf call for token0 (pool=%s, token=%s): %v", poolAddr.Hex(), token0.Hex(), err)
		return
	}

	log.Printf("[updatePoolReserves] Calling balanceOf for token0: pool=%s, token=%s", poolAddr.Hex(), token0.Hex())
	result0, err := s.Client.CallContract(ctx, ethereum.CallMsg{
		To:   &token0,
		Data: data0,
	}, nil)
	if err != nil {
		// 检查是否是 "function selector was not recognized" 错误
		errStr := err.Error()
		if strings.Contains(errStr, "function selector was not recognized") {
			// 非标准 ERC20，这是预期的，不记录为错误
			// log.Printf("⚠️  Token0 is not a standard ERC20 contract (pool=%s, token=%s)", poolAddr.Hex(), token0.Hex())
		} else {
			log.Printf("❌ Error calling balanceOf for token0 (pool=%s, token=%s): %v", poolAddr.Hex(), token0.Hex(), err)
		}
		err0 = err
	} else {
		log.Printf("[updatePoolReserves] Token0 balanceOf call succeeded, unpacking result...")
		unpacked, err := balanceMethod.Outputs.Unpack(result0)
		if err != nil {
			log.Printf("❌ Error unpacking balanceOf result for token0 (pool=%s, token=%s): %v", poolAddr.Hex(), token0.Hex(), err)
			err0 = err
		} else if len(unpacked) > 0 {
			if balance, ok := unpacked[0].(*big.Int); ok {
				reserve0 = balance
				log.Printf("[updatePoolReserves] Token0 balance: %s", balance.String())
			} else {
				log.Printf("❌ Error: balanceOf result for token0 is not *big.Int (pool=%s, token=%s, type=%T)", poolAddr.Hex(), token0.Hex(), unpacked[0])
				err0 = fmt.Errorf("unexpected type")
			}
		} else {
			log.Printf("❌ Error: balanceOf result for token0 is empty (pool=%s, token=%s)", poolAddr.Hex(), token0.Hex())
			err0 = fmt.Errorf("empty result")
		}
	}

	// 获取 token1 余额
	data1, err := parsedABI.Pack("balanceOf", poolAddr)
	if err != nil {
		log.Printf("Error packing balanceOf call for token1 (pool=%s, token=%s): %v", poolAddr.Hex(), token1.Hex(), err)
		return
	}

	log.Printf("[updatePoolReserves] Calling balanceOf for token1: pool=%s, token=%s", poolAddr.Hex(), token1.Hex())
	result1, err := s.Client.CallContract(ctx, ethereum.CallMsg{
		To:   &token1,
		Data: data1,
	}, nil)
	if err != nil {
		// 检查是否是 "function selector was not recognized" 错误
		errStr := err.Error()
		if strings.Contains(errStr, "function selector was not recognized") {
			// 非标准 ERC20，这是预期的，不记录为错误
			// log.Printf("⚠️  Token1 is not a standard ERC20 contract (pool=%s, token=%s)", poolAddr.Hex(), token1.Hex())
		} else {
			log.Printf("❌ Error calling balanceOf for token1 (pool=%s, token=%s): %v", poolAddr.Hex(), token1.Hex(), err)
		}
		err1 = err
	} else {
		log.Printf("[updatePoolReserves] Token1 balanceOf call succeeded, unpacking result...")
		unpacked, err := balanceMethod.Outputs.Unpack(result1)
		if err != nil {
			log.Printf("❌ Error unpacking balanceOf result for token1 (pool=%s, token=%s): %v", poolAddr.Hex(), token1.Hex(), err)
			err1 = err
		} else if len(unpacked) > 0 {
			if balance, ok := unpacked[0].(*big.Int); ok {
				reserve1 = balance
				log.Printf("[updatePoolReserves] Token1 balance: %s", balance.String())
			} else {
				log.Printf("❌ Error: balanceOf result for token1 is not *big.Int (pool=%s, token=%s, type=%T)", poolAddr.Hex(), token1.Hex(), unpacked[0])
				err1 = fmt.Errorf("unexpected type")
			}
		} else {
			log.Printf("❌ Error: balanceOf result for token1 is empty (pool=%s, token=%s)", poolAddr.Hex(), token1.Hex())
			err1 = fmt.Errorf("empty result")
		}
	}

	// 更新数据库（即使只有一个成功也更新，另一个设为0或保持原值）
	log.Printf("[updatePoolReserves] Result: reserve0=%v, reserve1=%v, err0=%v, err1=%v", 
		reserve0, reserve1, err0, err1)
	
	if reserve0 != nil && reserve1 != nil {
		log.Printf("[updatePoolReserves] Executing UPDATE: reserve0=%s, reserve1=%s, pool=%s", 
			reserve0.String(), reserve1.String(), poolAddr.Hex())
		result, err := s.DB.Exec(`
			UPDATE pools SET reserve0 = $1, reserve1 = $2
			WHERE address = $3
		`, reserve0.String(), reserve1.String(), poolAddr.Hex())
		if err != nil {
			log.Printf("❌ Error updating pool reserves in DB (pool=%s): %v", poolAddr.Hex(), err)
		} else {
			rowsAffected, _ := result.RowsAffected()
			log.Printf("✅ Updated pool reserves: %s (reserve0=%s, reserve1=%s, rowsAffected=%d)",
				poolAddr.Hex(), reserve0.String(), reserve1.String(), rowsAffected)
			if rowsAffected == 0 {
				log.Printf("⚠️  WARNING: No rows were updated! Pool address might not exist in database: %s", poolAddr.Hex())
			}
		}
	} else if reserve0 != nil {
		// 只有 reserve0 成功，只更新 reserve0
		log.Printf("[updatePoolReserves] Executing UPDATE reserve0 only: reserve0=%s, pool=%s", 
			reserve0.String(), poolAddr.Hex())
		result, err := s.DB.Exec(`
			UPDATE pools SET reserve0 = $1
			WHERE address = $2
		`, reserve0.String(), poolAddr.Hex())
		if err != nil {
			log.Printf("❌ Error updating pool reserve0 in DB (pool=%s): %v", poolAddr.Hex(), err)
		} else {
			rowsAffected, _ := result.RowsAffected()
			log.Printf("⚠️  Updated pool reserve0 only: %s (reserve0=%s, reserve1=failed, rowsAffected=%d)",
				poolAddr.Hex(), reserve0.String(), rowsAffected)
			if rowsAffected == 0 {
				log.Printf("⚠️  WARNING: No rows were updated! Pool address might not exist in database: %s", poolAddr.Hex())
			}
		}
	} else if reserve1 != nil {
		// 只有 reserve1 成功，只更新 reserve1
		log.Printf("[updatePoolReserves] Executing UPDATE reserve1 only: reserve1=%s, pool=%s", 
			reserve1.String(), poolAddr.Hex())
		result, err := s.DB.Exec(`
			UPDATE pools SET reserve1 = $1
			WHERE address = $2
		`, reserve1.String(), poolAddr.Hex())
		if err != nil {
			log.Printf("❌ Error updating pool reserve1 in DB (pool=%s): %v", poolAddr.Hex(), err)
		} else {
			rowsAffected, _ := result.RowsAffected()
			log.Printf("⚠️  Updated pool reserve1 only: %s (reserve0=failed, reserve1=%s, rowsAffected=%d)",
				poolAddr.Hex(), reserve1.String(), rowsAffected)
			if rowsAffected == 0 {
				log.Printf("⚠️  WARNING: No rows were updated! Pool address might not exist in database: %s", poolAddr.Hex())
			}
		}
	} else {
		// 两个都失败，检查是否是预期的错误（非标准 ERC20）
		err0Str := ""
		err1Str := ""
		if err0 != nil {
			err0Str = err0.Error()
		}
		if err1 != nil {
			err1Str = err1.Error()
		}

		// 检查是否都是 "function selector was not recognized" 错误
		isNonStandardERC20 := (err0 != nil && strings.Contains(err0Str, "function selector was not recognized")) &&
			(err1 != nil && strings.Contains(err1Str, "function selector was not recognized"))

		if isNonStandardERC20 {
			// 这是预期的：代币不是标准 ERC20，无法通过 balanceOf 获取余额
			// 使用"笨办法"：从 Mint/Burn 事件中累加/累减 reserve
			log.Printf("⚠️  Pool %s: Tokens are not standard ERC20 (token0=%s, token1=%s)", 
				poolAddr.Hex(), token0.Hex(), token1.Hex())
			log.Printf("   Using fallback method: calculating reserves from Mint/Burn events...")
			
			// 从数据库中查询所有 Mint 和 Burn 事件，累加计算 reserve
			fallbackReserve0, fallbackReserve1 := s.calculateReservesFromEvents(poolAddr)
			
			if fallbackReserve0 != nil && fallbackReserve1 != nil {
				// 使用从事件中计算的值更新数据库
				log.Printf("   ✅ Calculated reserves from events: reserve0=%s, reserve1=%s",
					fallbackReserve0.String(), fallbackReserve1.String())
				_, err = s.DB.Exec(`
					UPDATE pools SET reserve0 = $1, reserve1 = $2
					WHERE address = $3
				`, fallbackReserve0.String(), fallbackReserve1.String(), poolAddr.Hex())
				if err != nil {
					log.Printf("   ❌ Error updating reserves from events: %v", err)
				} else {
					log.Printf("   ✅ Updated reserves from Mint/Burn events")
				}
			} else {
				log.Printf("   ⚠️  Could not calculate reserves from events. Reserve values will remain unchanged.")
			}
		} else {
			// 其他错误，记录详细信息
			log.Printf("❌ Failed to get reserves for pool %s:", poolAddr.Hex())
			log.Printf("   Token0 (%s): reserve0=%v, error=%v", token0.Hex(), reserve0, err0Str)
			log.Printf("   Token1 (%s): reserve1=%v, error=%v", token1.Hex(), reserve1, err1Str)
			
			// 即使两个都失败，也尝试将数据库中的值设为 0（如果当前是 NULL）
			_, err = s.DB.Exec(`
				UPDATE pools 
				SET reserve0 = COALESCE(reserve0, '0'), reserve1 = COALESCE(reserve1, '0')
				WHERE address = $1 AND (reserve0 IS NULL OR reserve1 IS NULL)
			`, poolAddr.Hex())
			if err != nil {
				log.Printf("   Error setting reserves to 0: %v", err)
			}
		}
	}
}

// calculateReservesFromEvents 从 Mint/Burn 事件中计算 reserve0 和 reserve1
// 这是"笨办法"：累加所有 Mint 事件的 amount0/amount1，减去所有 Burn 事件的 amount0/amount1
func (s *Scanner) calculateReservesFromEvents(poolAddr common.Address) (*big.Int, *big.Int) {
	// 查询所有 Mint 事件，累加 amount0 和 amount1
	var totalMint0, totalMint1 sql.NullString
	err := s.DB.QueryRow(`
		SELECT 
			COALESCE(SUM(amount0::numeric), 0) as total0,
			COALESCE(SUM(amount1::numeric), 0) as total1
		FROM liquidity_events
		WHERE pool_address = $1 AND type = 'MINT'
	`, poolAddr.Hex()).Scan(&totalMint0, &totalMint1)
	
	if err != nil {
		log.Printf("   Error querying Mint events for pool %s: %v", poolAddr.Hex(), err)
		return nil, nil
	}
	
	// 查询所有 Burn 事件，累加 amount0 和 amount1
	var totalBurn0, totalBurn1 sql.NullString
	err = s.DB.QueryRow(`
		SELECT 
			COALESCE(SUM(amount0::numeric), 0) as total0,
			COALESCE(SUM(amount1::numeric), 0) as total1
		FROM liquidity_events
		WHERE pool_address = $1 AND type = 'BURN'
	`, poolAddr.Hex()).Scan(&totalBurn0, &totalBurn1)
	
	if err != nil {
		log.Printf("   Error querying Burn events for pool %s: %v", poolAddr.Hex(), err)
		return nil, nil
	}
	
	// 计算最终的 reserve：Mint 的总和 - Burn 的总和
	mint0 := big.NewInt(0)
	mint1 := big.NewInt(0)
	burn0 := big.NewInt(0)
	burn1 := big.NewInt(0)
	
	if totalMint0.Valid && totalMint0.String != "" {
		mint0, _ = new(big.Int).SetString(totalMint0.String, 10)
	}
	if totalMint1.Valid && totalMint1.String != "" {
		mint1, _ = new(big.Int).SetString(totalMint1.String, 10)
	}
	if totalBurn0.Valid && totalBurn0.String != "" {
		burn0, _ = new(big.Int).SetString(totalBurn0.String, 10)
	}
	if totalBurn1.Valid && totalBurn1.String != "" {
		burn1, _ = new(big.Int).SetString(totalBurn1.String, 10)
	}
	
	// reserve = mint - burn
	reserve0 := new(big.Int).Sub(mint0, burn0)
	reserve1 := new(big.Int).Sub(mint1, burn1)
	
	// 确保不为负数
	if reserve0.Sign() < 0 {
		reserve0 = big.NewInt(0)
	}
	if reserve1.Sign() < 0 {
		reserve1 = big.NewInt(0)
	}
	
	return reserve0, reserve1
}

// UpdatePoolReserves 更新单个池子的储备（公开方法，用于测试和手动更新）
func (s *Scanner) UpdatePoolReserves(poolAddr common.Address) {
	s.updatePoolReserves(poolAddr)
}

// UpdateAllPoolReserves 更新所有池子的储备（用于手动修复历史数据）
func (s *Scanner) UpdateAllPoolReserves() error {
	log.Println("Starting to update reserves for all pools...")

	// 先查询总数
	var total int
	err := s.DB.QueryRow("SELECT COUNT(*) FROM pools").Scan(&total)
	if err != nil {
		log.Printf("Warning: failed to get total pool count: %v", err)
		total = 0
	}
	log.Printf("Found %d pools to update", total)

	rows, err := s.DB.Query("SELECT address FROM pools")
	if err != nil {
		return fmt.Errorf("failed to query pools: %v", err)
	}
	defer rows.Close()

	count := 0
	successCount := 0
	for rows.Next() {
		var addr string
		if err := rows.Scan(&addr); err != nil {
			log.Printf("Error scanning pool address: %v", err)
			continue
		}

		count++
		if total > 0 {
			log.Printf("Updating reserves for pool %d/%d: %s", count, total, addr)
		} else {
			log.Printf("Updating reserves for pool %d: %s", count, addr)
		}
		s.updatePoolReserves(common.HexToAddress(addr))
		successCount++

		// 添加小延迟避免 RPC 限流
		time.Sleep(100 * time.Millisecond)
	}

	log.Printf("✅ Completed updating reserves: %d/%d pools processed successfully", successCount, count)
	return nil
}

// UpdateAllPoolStates 更新所有池子的完整状态（包括 sqrt_price_x96, tick, liquidity, reserve0, reserve1）
// 用于手动修复历史数据或初始化
func (s *Scanner) UpdateAllPoolStates() error {
	log.Println("Starting to update full state for all pools...")

	// 先查询总数
	var total int
	err := s.DB.QueryRow("SELECT COUNT(*) FROM pools").Scan(&total)
	if err != nil {
		log.Printf("Warning: failed to get total pool count: %v", err)
		total = 0
	}
	log.Printf("Found %d pools to update", total)

	rows, err := s.DB.Query("SELECT address FROM pools")
	if err != nil {
		return fmt.Errorf("failed to query pools: %v", err)
	}
	defer rows.Close()

	count := 0
	successCount := 0
	for rows.Next() {
		var addr string
		if err := rows.Scan(&addr); err != nil {
			log.Printf("Error scanning pool address: %v", err)
			continue
		}

		count++
		if total > 0 {
			log.Printf("Updating full state for pool %d/%d: %s", count, total, addr)
		} else {
			log.Printf("Updating full state for pool %d: %s", count, addr)
		}
		
		s.updatePoolStateFromChain(common.HexToAddress(addr))
		successCount++

		// 添加小延迟避免 RPC 限流
		time.Sleep(200 * time.Millisecond)
	}

	log.Printf("✅ Completed updating pool states: %d/%d pools processed successfully", successCount, count)
	return nil
}

// Pool ABI 定义（用于查询 slot0 和其他池信息）
var poolABI = `[
	{
		"constant": true,
		"inputs": [],
		"name": "slot0",
		"outputs": [
			{"name": "sqrtPriceX96", "type": "uint160"},
			{"name": "tick", "type": "int24"},
			{"name": "observationIndex", "type": "uint16"},
			{"name": "observationCardinality", "type": "uint16"},
			{"name": "observationCardinalityNext", "type": "uint16"},
			{"name": "feeProtocol", "type": "uint8"},
			{"name": "unlocked", "type": "bool"}
		],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "liquidity",
		"outputs": [{"name": "", "type": "uint128"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "token0",
		"outputs": [{"name": "", "type": "address"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "token1",
		"outputs": [{"name": "", "type": "address"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "fee",
		"outputs": [{"name": "", "type": "uint24"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "tickLower",
		"outputs": [{"name": "", "type": "int24"}],
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "tickUpper",
		"outputs": [{"name": "", "type": "int24"}],
		"type": "function"
	}
]`

// updatePoolStateFromChain 从链上查询并更新池子的完整状态
// 包括 sqrt_price_x96, tick, liquidity, reserve0, reserve1
func (s *Scanner) updatePoolStateFromChain(poolAddr common.Address) {
	// 1. 查询 slot0 获取 sqrtPriceX96 和 tick
	parsedABI, err := abi.JSON(strings.NewReader(poolABI))
	if err != nil {
		log.Printf("Error parsing Pool ABI for pool %s: %v", poolAddr.Hex(), err)
		// 如果 ABI 解析失败，至少尝试更新 reserves
		s.updatePoolReserves(poolAddr)
		return
	}

	ctx := context.Background()

	// 查询 slot0
	slot0Method, ok := parsedABI.Methods["slot0"]
	if !ok {
		log.Printf("slot0 method not found in Pool ABI for pool %s", poolAddr.Hex())
		s.updatePoolReserves(poolAddr)
		return
	}

	data, err := parsedABI.Pack("slot0")
	if err != nil {
		log.Printf("Error packing slot0 call for pool %s: %v", poolAddr.Hex(), err)
		s.updatePoolReserves(poolAddr)
		return
	}

	result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
		To:   &poolAddr,
		Data: data,
	}, nil)
	if err != nil {
		log.Printf("Error calling slot0 for pool %s: %v", poolAddr.Hex(), err)
		// 如果 slot0 调用失败，至少尝试更新 reserves
		s.updatePoolReserves(poolAddr)
		return
	}

	unpacked, err := slot0Method.Outputs.Unpack(result)
	if err != nil || len(unpacked) < 2 {
		log.Printf("Error unpacking slot0 result for pool %s: %v", poolAddr.Hex(), err)
		s.updatePoolReserves(poolAddr)
		return
	}

	var sqrtPriceX96 *big.Int
	var tick int64

	if price, ok := unpacked[0].(*big.Int); ok {
		sqrtPriceX96 = price
	} else {
		log.Printf("Error: slot0 sqrtPriceX96 is not *big.Int for pool %s", poolAddr.Hex())
		s.updatePoolReserves(poolAddr)
		return
	}

	if t, ok := unpacked[1].(int32); ok {
		tick = int64(t)
	} else if t, ok := unpacked[1].(*big.Int); ok {
		tick = t.Int64()
	} else {
		log.Printf("Error: slot0 tick is not int32 or *big.Int for pool %s, type=%T", poolAddr.Hex(), unpacked[1])
		s.updatePoolReserves(poolAddr)
		return
	}

	// 2. 查询 liquidity
	liquidityUpdated := false
	liquidityMethod, ok := parsedABI.Methods["liquidity"]
	if ok {
		data, err := parsedABI.Pack("liquidity")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &poolAddr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := liquidityMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if liq, ok := unpacked[0].(*big.Int); ok {
						// 更新数据库：包括 sqrt_price_x96, tick, liquidity
						_, err = s.DB.Exec(`
							UPDATE pools 
							SET sqrt_price_x96 = $1, tick = $2, liquidity = $3
							WHERE address = $4
						`, sqrtPriceX96.String(), tick, liq.String(), poolAddr.Hex())
						if err != nil {
							log.Printf("Error updating pool state from chain (pool=%s): %v", poolAddr.Hex(), err)
						} else {
							log.Printf("✅ Updated pool state from chain: %s (sqrtPriceX96=%s, tick=%d, liquidity=%s)",
								poolAddr.Hex(), sqrtPriceX96.String(), tick, liq.String())
							liquidityUpdated = true
						}
					}
				}
			}
		}
	}

	// 3. 如果没有成功更新 liquidity，至少更新 sqrt_price_x96 和 tick
	if !liquidityUpdated {
		_, err = s.DB.Exec(`
			UPDATE pools 
			SET sqrt_price_x96 = $1, tick = $2
			WHERE address = $3
		`, sqrtPriceX96.String(), tick, poolAddr.Hex())
		if err != nil {
			log.Printf("Error updating pool sqrt_price_x96 and tick (pool=%s): %v", poolAddr.Hex(), err)
		} else {
			log.Printf("✅ Updated pool sqrt_price_x96 and tick from chain: %s (sqrtPriceX96=%s, tick=%d)",
				poolAddr.Hex(), sqrtPriceX96.String(), tick)
		}
	}

	// 4. 更新 reserves
	s.updatePoolReserves(poolAddr)
}

// createPoolFromChain 从链上查询池信息并创建数据库记录
func (s *Scanner) createPoolFromChain(poolAddr common.Address) bool {
	parsedABI, err := abi.JSON(strings.NewReader(poolABI))
	if err != nil {
		log.Printf("Error parsing Pool ABI for pool %s: %v", poolAddr.Hex(), err)
		return false
	}

	ctx := context.Background()

	// 查询 token0
	var token0 common.Address
	if token0Method, ok := parsedABI.Methods["token0"]; ok {
		data, err := parsedABI.Pack("token0")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &poolAddr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := token0Method.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if addr, ok := unpacked[0].(common.Address); ok {
						token0 = addr
					}
				}
			}
		}
	}
	if token0 == (common.Address{}) {
		log.Printf("Failed to query token0 for pool %s", poolAddr.Hex())
		return false
	}

	// 查询 token1
	var token1 common.Address
	if token1Method, ok := parsedABI.Methods["token1"]; ok {
		data, err := parsedABI.Pack("token1")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &poolAddr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := token1Method.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if addr, ok := unpacked[0].(common.Address); ok {
						token1 = addr
					}
				}
			}
		}
	}
	if token1 == (common.Address{}) {
		log.Printf("Failed to query token1 for pool %s", poolAddr.Hex())
		return false
	}

	// 查询 fee
	var fee int64
	if feeMethod, ok := parsedABI.Methods["fee"]; ok {
		data, err := parsedABI.Pack("fee")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &poolAddr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := feeMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if f, ok := unpacked[0].(*big.Int); ok {
						fee = f.Int64()
					} else if f, ok := unpacked[0].(uint32); ok {
						fee = int64(f)
					}
				}
			}
		}
	}

	// 查询 tickLower
	var tickLower int32
	if tickLowerMethod, ok := parsedABI.Methods["tickLower"]; ok {
		data, err := parsedABI.Pack("tickLower")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &poolAddr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := tickLowerMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if t, ok := unpacked[0].(int32); ok {
						tickLower = t
					} else if t, ok := unpacked[0].(*big.Int); ok {
						tickLower = int32(t.Int64())
					}
				}
			}
		}
	}

	// 查询 tickUpper
	var tickUpper int32
	if tickUpperMethod, ok := parsedABI.Methods["tickUpper"]; ok {
		data, err := parsedABI.Pack("tickUpper")
		if err == nil {
			result, err := s.Client.CallContract(ctx, ethereum.CallMsg{
				To:   &poolAddr,
				Data: data,
			}, nil)
			if err == nil {
				unpacked, err := tickUpperMethod.Outputs.Unpack(result)
				if err == nil && len(unpacked) > 0 {
					if t, ok := unpacked[0].(int32); ok {
						tickUpper = t
					} else if t, ok := unpacked[0].(*big.Int); ok {
						tickUpper = int32(t.Int64())
					}
				}
			}
		}
	}

	// 确保代币存在
	s.ensureToken(token0)
	s.ensureToken(token1)

	// 插入池记录
	_, err = s.DB.Exec(`
		INSERT INTO pools (address, token0, token1, fee, tick_lower, tick_upper, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (address) DO NOTHING
	`, poolAddr.Hex(), token0.Hex(), token1.Hex(), fee, tickLower, tickUpper, time.Now())

	if err != nil {
		log.Printf("Error creating pool from chain: %v", err)
		return false
	}

	log.Printf("✅ Created pool from chain: %s (token0=%s, token1=%s, fee=%d)", 
		poolAddr.Hex(), token0.Hex(), token1.Hex(), fee)

	// 更新池的完整状态
	s.updatePoolStateFromChain(poolAddr)

	return true
}
