package scanner

import (
	"context"
	"fmt"
	"log"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// findPositionIDFromTransaction 从同一交易中查找 PositionManager 的 Transfer 事件来获取 position ID
func (s *Scanner) findPositionIDFromTransaction(txHash common.Hash, blockNumber uint64) *big.Int {
	// 查询同一交易中的所有日志
	receipt, err := s.Client.TransactionReceipt(context.Background(), txHash)
	if err != nil {
		log.Printf("Error fetching transaction receipt for %s: %v", txHash.Hex(), err)
		return nil
	}

	positionManagerAddr := common.HexToAddress(s.Config.Contracts.PositionManager)

	// 查找 PositionManager 的 Transfer 事件（mint 时 from 是 0x0）
	for _, vLog := range receipt.Logs {
		if vLog.Address == positionManagerAddr && len(vLog.Topics) >= 4 {
			if vLog.Topics[0] == SigTransfer {
				// Transfer(from, to, tokenId)
				from := common.BytesToAddress(vLog.Topics[1].Bytes())
				to := common.BytesToAddress(vLog.Topics[2].Bytes())
				tokenID := new(big.Int).SetBytes(vLog.Topics[3].Bytes())

				// Mint 时 from 是 0x0
				if from == (common.Address{}) {
					log.Printf("Found PositionManager Transfer (mint) event: tokenId=%s, to=%s",
						tokenID.String(), to.Hex())
					return tokenID
				}
			}
		}
	}
	log.Printf("No PositionManager Transfer (mint) event found in transaction %s", txHash.Hex())
	return nil
}

// createPositionFromPoolMint 从 Pool Mint 事件创建 position 记录（没有 NFT position ID 的情况）
// 使用 owner + pool + tick 的哈希值作为 position ID
func (s *Scanner) createPositionFromPoolMint(owner common.Address, poolAddr common.Address, liquidity *big.Int, blockNumber uint64) {
	// 查询 Pool 信息获取 token0、token1 和 tick 范围
	var token0, token1 string
	var tickLower, tickUpper int
	err := s.DB.QueryRow(`
		SELECT token0, token1, tick_lower, tick_upper FROM pools WHERE address = $1
	`, poolAddr.Hex()).Scan(&token0, &token1, &tickLower, &tickUpper)
	if err != nil {
		log.Printf("Error querying pool info: %v", err)
		return
	}

	// 生成 position ID：使用 owner + pool + tick 的哈希值
	// 转换为数字，确保唯一性
	hashInput := fmt.Sprintf("%s:%s:%d:%d", owner.Hex(), poolAddr.Hex(), tickLower, tickUpper)
	hash := crypto.Keccak256Hash([]byte(hashInput))
	positionID := new(big.Int).SetBytes(hash.Bytes())
	// 取前 64 位作为 ID（避免过大）
	positionID.Mod(positionID, new(big.Int).Lsh(big.NewInt(1), 64))

	// 创建或更新 position 记录
	result, err := s.DB.Exec(`
		INSERT INTO positions (
			id, owner, pool_address, token0, token1, 
			tick_lower, tick_upper, liquidity, 
			fee_growth_inside0_last_x128, fee_growth_inside1_last_x128,
			tokens_owed0, tokens_owed1
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0)
		ON CONFLICT (id) DO UPDATE SET
			liquidity = positions.liquidity + $8,
			updated_at = NOW()
	`, positionID.String(), owner.Hex(), poolAddr.Hex(), token0, token1,
		tickLower, tickUpper, liquidity.String())

	if err != nil {
		log.Printf("Error upserting position (from Pool Mint): %v", err)
	} else {
		rowsAffected, _ := result.RowsAffected()
		log.Printf("Successfully upserted position %s (owner=%s, pool=%s, liquidity=%s, rowsAffected=%d)",
			positionID.String(), owner.Hex(), poolAddr.Hex(), liquidity.String(), rowsAffected)
	}
}

// queryPositionFromContract 通过 RPC 调用 PositionManager 合约查询 position 信息
func (s *Scanner) queryPositionFromContract(positionID *big.Int, blockNumber uint64) (*PositionInfo, error) {
	positionManagerAddr := common.HexToAddress(s.Config.Contracts.PositionManager)
	if positionManagerAddr == (common.Address{}) {
		return nil, fmt.Errorf("PositionManager address not configured")
	}

	// 编码函数调用：positions(uint256)
	data, err := s.positionManagerABI.Pack("positions", positionID)
	if err != nil {
		return nil, fmt.Errorf("failed to pack positions call: %v", err)
	}

	// 调用合约
	callMsg := ethereum.CallMsg{
		To:   &positionManagerAddr,
		Data: data,
	}

	var result []byte
	if blockNumber > 0 {
		blockNum := big.NewInt(int64(blockNumber))
		result, err = s.Client.CallContract(context.Background(), callMsg, blockNum)
	} else {
		result, err = s.Client.CallContract(context.Background(), callMsg, nil)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to call PositionManager.positions: %v", err)
	}

	// 解析返回结果（结构体需要手动解析）
	method, ok := s.positionManagerABI.Methods["positions"]
	if !ok {
		return nil, fmt.Errorf("positions method not found in ABI")
	}

	// 使用 Unpack 解析返回值
	values, err := method.Outputs.Unpack(result)
	if err != nil {
		return nil, fmt.Errorf("failed to unpack position info: %v", err)
	}

	if len(values) != 1 {
		return nil, fmt.Errorf("unexpected return value count: %d", len(values))
	}

	// 解析结构体（values[0] 应该是一个结构体，在 go-ethereum 中会被解析为 []interface{}）
	structValue, ok := values[0].([]interface{})
	if !ok || len(structValue) < 13 {
		return nil, fmt.Errorf("invalid struct format, got %d fields, expected 13", len(structValue))
	}

	// 安全地提取各个字段
	positionInfo := &PositionInfo{}

	if v, ok := structValue[0].(*big.Int); ok {
		positionInfo.Id = v
	}
	if v, ok := structValue[1].(common.Address); ok {
		positionInfo.Owner = v
	}
	if v, ok := structValue[2].(common.Address); ok {
		positionInfo.Token0 = v
	}
	if v, ok := structValue[3].(common.Address); ok {
		positionInfo.Token1 = v
	}
	if v, ok := structValue[4].(uint32); ok {
		positionInfo.Index = v
	}
	if v, ok := structValue[5].(uint32); ok {
		positionInfo.Fee = v
	} else if v, ok := structValue[5].(uint8); ok {
		// uint24 可能被解析为 uint8，需要转换
		positionInfo.Fee = uint32(v)
	}
	if v, ok := structValue[6].(*big.Int); ok {
		positionInfo.Liquidity = v
	}
	if v, ok := structValue[7].(int32); ok {
		positionInfo.TickLower = v
	}
	if v, ok := structValue[8].(int32); ok {
		positionInfo.TickUpper = v
	}
	if v, ok := structValue[9].(*big.Int); ok {
		positionInfo.TokensOwed0 = v
	}
	if v, ok := structValue[10].(*big.Int); ok {
		positionInfo.TokensOwed1 = v
	}
	if v, ok := structValue[11].(*big.Int); ok {
		positionInfo.FeeGrowthInside0LastX128 = v
	}
	if v, ok := structValue[12].(*big.Int); ok {
		positionInfo.FeeGrowthInside1LastX128 = v
	}

	return positionInfo, nil
}

// updatePositionFromMint 更新或创建 position 记录（有 NFT position ID 的情况）
// 通过 RPC 调用 PositionManager.positions(positionID) 获取准确的 tick 范围
func (s *Scanner) updatePositionFromMint(positionID big.Int, owner common.Address, poolAddr common.Address, liquidity *big.Int, blockNumber uint64) {
	// 尝试通过 RPC 查询 PositionManager 获取 position 信息
	positionInfo, err := s.queryPositionFromContract(&positionID, blockNumber)
	if err != nil {
		log.Printf("Warning: Failed to query position %s from contract: %v, falling back to pool info", positionID.String(), err)
		// 如果查询失败，回退到使用池子的 tick 范围
		positionInfo = nil
	}

	var token0, token1 string
	var tickLower, tickUpper int

	if positionInfo != nil {
		// 使用从合约查询到的信息
		token0 = positionInfo.Token0.Hex()
		token1 = positionInfo.Token1.Hex()
		tickLower = int(positionInfo.TickLower)
		tickUpper = int(positionInfo.TickUpper)
		// 使用合约中的流动性（更准确）
		if positionInfo.Liquidity != nil {
			liquidity = positionInfo.Liquidity
		}
		// 使用合约中的 owner（更准确）
		owner = positionInfo.Owner
		log.Printf("Successfully queried position %s from contract: tickLower=%d, tickUpper=%d, liquidity=%s",
			positionID.String(), tickLower, tickUpper, liquidity.String())
	} else {
		// 回退：从数据库查询 Pool 信息
		err := s.DB.QueryRow(`
			SELECT token0, token1 FROM pools WHERE address = $1
		`, poolAddr.Hex()).Scan(&token0, &token1)
		if err != nil {
			log.Printf("Error querying pool info: %v", err)
			return
		}

		// 查询 Pool 的 tick_lower 和 tick_upper（这是池子的整体范围，不是 position 的范围）
		err = s.DB.QueryRow(`
			SELECT tick_lower, tick_upper FROM pools WHERE address = $1
		`, poolAddr.Hex()).Scan(&tickLower, &tickUpper)
		if err != nil {
			log.Printf("Error querying pool ticks: %v", err)
			return
		}
		log.Printf("Using pool tick range for position %s: tickLower=%d, tickUpper=%d (fallback)",
			positionID.String(), tickLower, tickUpper)
	}

	// 尝试更新或插入 position
	// 如果是新创建的 position，则插入；如果是增加流动性，则更新
	result, err := s.DB.Exec(`
		INSERT INTO positions (
			id, owner, pool_address, token0, token1, 
			tick_lower, tick_upper, liquidity, 
			fee_growth_inside0_last_x128, fee_growth_inside1_last_x128,
			tokens_owed0, tokens_owed1
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, 0)
		ON CONFLICT (id) DO UPDATE SET
			liquidity = positions.liquidity + $8,
			updated_at = NOW()
	`, positionID.String(), owner.Hex(), poolAddr.Hex(), token0, token1,
		tickLower, tickUpper, liquidity.String())

	if err != nil {
		log.Printf("Error upserting position %s: %v", positionID.String(), err)
	} else {
		rowsAffected, _ := result.RowsAffected()
		log.Printf("Successfully upserted position %s (owner=%s, pool=%s, liquidity=%s, rowsAffected=%d)",
			positionID.String(), owner.Hex(), poolAddr.Hex(), liquidity.String(), rowsAffected)
	}
}

// updatePositionFromBurn 更新 position 记录（减少流动性）
func (s *Scanner) updatePositionFromBurn(owner common.Address, poolAddr common.Address, liquidity *big.Int, blockNumber uint64, txHash common.Hash) {
	// 对于 Burn，owner 通常是 PositionManager 合约地址
	// 我们需要找到该池子中属于某个 position 的记录
	// 由于 Burn 事件没有 position ID，我们需要通过其他方式关联

	positionManagerAddr := common.HexToAddress(s.Config.Contracts.PositionManager)

	// 方法1: 尝试从同一交易中查找 PositionManager 的 Transfer 事件（burn，to = 0x0）
	// 注意：NFT 销毁发生在 collect() 中，而不是 burn() 中，所以这里可能找不到
	receipt, err := s.Client.TransactionReceipt(context.Background(), txHash)
	if err == nil {
		for _, vLog := range receipt.Logs {
			if vLog.Address == positionManagerAddr && len(vLog.Topics) >= 4 {
				// 检查是否是 Transfer 事件（burn，to = 0x0）
				if vLog.Topics[0] == SigTransfer {
					to := common.BytesToAddress(vLog.Topics[2].Bytes())
					// 如果是 burn（to = 0x0），获取 position ID
					if to == (common.Address{}) {
						positionID := new(big.Int).SetBytes(vLog.Topics[3].Bytes())
						log.Printf("Found PositionManager Transfer (burn) event in tx %s: positionId=%s",
							txHash.Hex(), positionID.String())

						// 更新对应的 position
						_, err := s.DB.Exec(`
							UPDATE positions 
							SET liquidity = GREATEST(0, liquidity - $1),
								updated_at = NOW()
							WHERE id = $2 AND pool_address = $3
						`, liquidity.String(), positionID.String(), poolAddr.Hex())
						if err != nil {
							log.Printf("Error updating position %s on burn: %v", positionID.String(), err)
						} else {
							log.Printf("Successfully updated position %s: reduced liquidity by %s",
								positionID.String(), liquidity.String())
						}
						return // 找到了 position ID，直接返回
					}
				}
			}
		}
	}

	// 方法2: 如果没找到 Transfer 事件，可能是通过 TestLP 直接调用的
	// 或者 NFT 还没有被销毁（因为 collect 还没调用）
	// 查询数据库中该池子的所有 position，找到流动性匹配的进行更新
	// 注意：这种方法不够精确，因为可能有多个 position 有相同的流动性
	rows, err := s.DB.Query(`
		SELECT id, liquidity FROM positions 
		WHERE pool_address = $1 AND liquidity > 0
		ORDER BY liquidity DESC
	`, poolAddr.Hex())
	if err != nil {
		log.Printf("Error querying positions for pool %s: %v", poolAddr.Hex(), err)
		return
	}
	defer rows.Close()

	// 尝试找到流动性匹配的 position（允许一定的误差）
	var matchedPositionID *big.Int
	var matchedLiquidity *big.Int

	for rows.Next() {
		var positionIDStr string
		var currentLiquidityStr string
		if err := rows.Scan(&positionIDStr, &currentLiquidityStr); err != nil {
			continue
		}

		currentLiquidity, ok := new(big.Int).SetString(currentLiquidityStr, 10)
		if !ok {
			continue
		}

		// 如果当前流动性大于等于要减少的流动性，可能是匹配的 position
		if currentLiquidity.Cmp(liquidity) >= 0 {
			matchedPositionID, _ = new(big.Int).SetString(positionIDStr, 10)
			matchedLiquidity = currentLiquidity
			break // 找到第一个匹配的
		}
	}

	if matchedPositionID != nil {
		// 更新找到的 position
		_, err := s.DB.Exec(`
			UPDATE positions 
			SET liquidity = GREATEST(0, liquidity - $1),
				updated_at = NOW()
			WHERE id = $2 AND pool_address = $3
		`, liquidity.String(), matchedPositionID.String(), poolAddr.Hex())
		if err != nil {
			log.Printf("Error updating position %s on burn (matched by liquidity): %v",
				matchedPositionID.String(), err)
		} else {
			log.Printf("Successfully updated position %s (matched by liquidity %s): reduced by %s",
				matchedPositionID.String(), matchedLiquidity.String(), liquidity.String())
		}
	} else {
		// 如果找不到匹配的 position，可能是虚拟 position（没有 NFT）
		// 或者流动性已经被其他事件更新了
		log.Printf("No matching position found for burn: pool=%s, liquidity=%s, tx=%s",
			poolAddr.Hex(), liquidity.String(), txHash.Hex())
	}
}
