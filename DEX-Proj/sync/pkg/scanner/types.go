package scanner

import (
	"database/sql"
	"math/big"
	"meta-node-dex-sync/pkg/config"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// PositionInfo 表示 PositionManager 合约中的 PositionInfo 结构体
type PositionInfo struct {
	Id                       *big.Int
	Owner                    common.Address
	Token0                   common.Address
	Token1                   common.Address
	Index                    uint32
	Fee                      uint32
	Liquidity                *big.Int
	TickLower                int32
	TickUpper                int32
	TokensOwed0              *big.Int
	TokensOwed1              *big.Int
	FeeGrowthInside0LastX128 *big.Int
	FeeGrowthInside1LastX128 *big.Int
}

// Scanner handles the blockchain scanning logic
type Scanner struct {
	Client  *ethclient.Client
	DB      *sql.DB
	Config  config.Config
	Pools   map[common.Address]bool // Cache of known pools
	Current uint64                  // Current scan block
	// PositionManager ABI for querying positions
	positionManagerABI abi.ABI
}

// Event Signatures - 所有事件签名的定义
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

	// ERC721 Transfer: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
	SigTransfer = crypto.Keccak256Hash([]byte("Transfer(address,address,uint256)"))
)
