package token

import (
	"context"
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/meme-launchpad/api/internal/model"
	"github.com/meme-launchpad/api/internal/service/crypto"
)

// 默认的代币经济参数
var (
	DefaultTotalSupply         = new(big.Int).Mul(big.NewInt(1e9), big.NewInt(1e18))        // 1,000,000,000 * 10^18
	DefaultSaleAmount          = new(big.Int).Mul(big.NewInt(8e8), big.NewInt(1e18))        // 800,000,000 * 10^18
	DefaultVirtualBNBReserve   = big.NewInt(8219178082191780000)                            // ~8.22 BNB
	DefaultVirtualTokenReserve = new(big.Int).Mul(big.NewInt(1073972602), big.NewInt(1e18)) // 1,073,972,602 * 10^18

	// 默认代币字节码（实际生产中应从配置中读取）
	DefaultTokenBytecode = ""
)

// TokenService 代币服务
type TokenService struct {
	tokenModel      *model.TokenModel
	signer          *crypto.Signer
	create2Calc     *crypto.Create2Calculator
	coreContract    common.Address
	factoryContract common.Address
	rpcURL          string
	chainID         int64
}

// NewTokenService 创建代币服务
func NewTokenService(
	signerPrivateKey string,
	coreContract string,
	factoryContract string,
	tokenBytecode string,
	rpcURL string,
	chainID int64,
	tokenModel *model.TokenModel,
) *TokenService {
	var signer *crypto.Signer
	var create2Calc *crypto.Create2Calculator

	if signerPrivateKey != "" {
		var err error
		signer, err = crypto.NewSigner(signerPrivateKey)
		if err != nil {
			fmt.Printf("Warning: Failed to create signer: %v\n", err)
		}
	}

	// 使用传入的字节码，如果为空则使用默认值
	bytecode := tokenBytecode
	if bytecode == "" {
		bytecode = DefaultTokenBytecode
	}

	if factoryContract != "" && bytecode != "" {
		var err error
		create2Calc, err = crypto.NewCreate2Calculator(factoryContract, bytecode)
		if err != nil {
			fmt.Printf("Warning: Failed to create CREATE2 calculator: %v\n", err)
		}
	}

	return &TokenService{
		tokenModel:      tokenModel,
		signer:          signer,
		create2Calc:     create2Calc,
		coreContract:    common.HexToAddress(coreContract),
		factoryContract: common.HexToAddress(factoryContract),
		rpcURL:          rpcURL,
		chainID:         chainID,
	}
}

// CreateTokenRequest 创建代币请求
type CreateTokenRequest struct {
	Name                 string
	Symbol               string
	Description          string
	Logo                 string
	Banner               string
	Creator              string
	LaunchMode           int
	LaunchTime           int64
	InitialBuyPercentage int // basis points (0-9990)
	MarginBnb            *big.Int
	MarginTime           int64 // seconds
	VestingAllocations   []VestingAllocationInput
	Website              string
	Twitter              string
	Telegram             string
	Discord              string
	Whitepaper           string
	ContactEmail         string
	ContactTg            string
	Tags                 []string
	// 靓号相关
	Digits           string // 目标地址后缀
	PredictedAddress string // 预先计算的地址（可选）
}

// VestingAllocationInput 归属分配输入
// 与合约 IVestingParams.VestingAllocation 结构一致
type VestingAllocationInput struct {
	Amount    int   // basis points (0-10000)
	LaunchTime int64 // 归属起始时间（Unix 时间戳，0 表示使用代币创建时间）
	Duration  int64 // 归属期限（秒）
	Mode      int   // 归属模式：0=BURN, 1=CLIFF, 2=LINEAR
}

// CreateTokenResponse 创建代币响应
type CreateTokenResponse struct {
	RequestID        string `json:"requestId"`
	Create2Salt      string `json:"create2Salt"`
	CreateArg        string `json:"createArg"`
	Nonce            int64  `json:"nonce"`
	PredictedAddress string `json:"predictedAddress"`
	Signature        string `json:"signature"`
	Timestamp        int64  `json:"timestamp"`
}

// CreateToken 创建代币签名
func (s *TokenService) CreateToken(ctx context.Context, req *CreateTokenRequest) (*CreateTokenResponse, error) {
	// 1. 获取下一个 nonce
	nonce, err := s.getNextNonce(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}

	// 2. 准备参数
	timestamp := uint64(time.Now().Unix())
	creator := common.HexToAddress(req.Creator)

	// 3. 计算预测地址
	var salt [32]byte
	var predictedAddress common.Address

	if req.Digits != "" {
		// 寻找靓号
		foundNonce, addr, found := s.create2Calc.FindVanityAddress(
			req.Name, req.Symbol,
			DefaultTotalSupply,
			s.coreContract, // owner 是 Core 合约
			timestamp,
			req.Digits,
			1000000, // 最大尝试次数
		)
		if found {
			nonce = int64(foundNonce)
			predictedAddress = addr
		}
		salt, predictedAddress = s.create2Calc.PredictAddress(
			req.Name, req.Symbol,
			DefaultTotalSupply,
			s.coreContract,
			timestamp, uint64(nonce),
		)
	} else {
		salt, predictedAddress = s.create2Calc.PredictAddress(
			req.Name, req.Symbol,
			DefaultTotalSupply,
			s.coreContract,
			timestamp, uint64(nonce),
		)
	}

	// 4. 生成 requestID
	requestID := crypto.GenerateRequestID("mainnet_", creator, timestamp, uint64(nonce))

	// 5. 准备创建代币参数
	vestingAllocations := make([]crypto.VestingAllocation, len(req.VestingAllocations))
	for i, v := range req.VestingAllocations {
		launchTime := big.NewInt(v.LaunchTime)
		if v.LaunchTime == 0 {
			launchTime = big.NewInt(0) // 0 表示使用代币创建时间
		}
		
		vestingAllocations[i] = crypto.VestingAllocation{
			Amount:    big.NewInt(int64(v.Amount)),
			LaunchTime: launchTime,
			Duration:  big.NewInt(v.Duration),
			Mode:      uint8(v.Mode), // 0=BURN, 1=CLIFF, 2=LINEAR
		}
	}

	marginBnb := req.MarginBnb
	if marginBnb == nil {
		marginBnb = big.NewInt(0)
	}

	params := &crypto.CreateTokenParams{
		Name:                 req.Name,
		Symbol:               req.Symbol,
		TotalSupply:          DefaultTotalSupply,
		SaleAmount:           DefaultSaleAmount,
		VirtualBNBReserve:    DefaultVirtualBNBReserve,
		VirtualTokenReserve:  DefaultVirtualTokenReserve,
		LaunchTime:           uint64(req.LaunchTime),
		CreationFee:          big.NewInt(0),
		Creator:              creator,
		Timestamp:            timestamp,
		RequestID:            requestID,
		Nonce:                uint64(nonce),
		InitialBuyPercentage: uint64(req.InitialBuyPercentage),
		MarginBnb:            marginBnb,
		MarginTime:           uint64(req.MarginTime),
		VestingAllocations:   vestingAllocations,
	}

	// 6. 签名
	if s.signer == nil {
		return nil, fmt.Errorf("signer not initialized")
	}

	fmt.Printf("[CreateToken] Signer address: %s\n", s.signer.Address().Hex())
	fmt.Printf("[CreateToken] Creator: %s\n", creator.Hex())
	fmt.Printf("[CreateToken] Timestamp: %d\n", timestamp)
	fmt.Printf("[CreateToken] Nonce: %d\n", nonce)
	fmt.Printf("[CreateToken] RequestID: %s\n", crypto.Bytes32ToHex(requestID))
	fmt.Printf("[CreateToken] ChainID: %d\n", s.chainID)
	fmt.Printf("[CreateToken] CoreContract: %s\n", s.coreContract.Hex())

	encodedData, signature, err := s.signer.SignCreateTokenParams(params, s.chainID, s.coreContract)
	if err != nil {
		return nil, fmt.Errorf("failed to sign params: %w", err)
	}

	fmt.Printf("[CreateToken] EncodedData length: %d\n", len(encodedData))
	fmt.Printf("[CreateToken] Signature length: %d\n", len(signature))

	// 7. 保存请求到数据库
	err = s.saveCreationRequest(ctx, req, params, encodedData, signature, salt, predictedAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to save creation request: %w", err)
	}

	return &CreateTokenResponse{
		RequestID:        crypto.Bytes32ToHex(requestID),
		Create2Salt:      crypto.Bytes32ToHex(salt),
		CreateArg:        "0x" + hex.EncodeToString(encodedData),
		Nonce:            nonce,
		PredictedAddress: predictedAddress.Hex(),
		Signature:        "0x" + hex.EncodeToString(signature),
		Timestamp:        int64(timestamp),
	}, nil
}

// CalculateAddressRequest 计算地址请求
type CalculateAddressRequest struct {
	Name   string
	Symbol string
	Digits string // 靓号后缀
}

// CalculateAddressResponse 计算地址响应
type CalculateAddressResponse struct {
	PredictedAddress string `json:"predictedAddress"`
	Salt             string `json:"salt"`
	Nonce            int64  `json:"nonce"`
}

// CalculateAddress 计算代币地址
func (s *TokenService) CalculateAddress(ctx context.Context, req *CalculateAddressRequest) (*CalculateAddressResponse, error) {
	timestamp := uint64(time.Now().Unix())

	var nonce uint64 = 0
	var salt [32]byte
	var predictedAddress common.Address

	if req.Digits != "" {
		// 寻找靓号
		foundNonce, addr, found := s.create2Calc.FindVanityAddress(
			req.Name, req.Symbol,
			DefaultTotalSupply,
			s.coreContract,
			timestamp,
			req.Digits,
			100000, // 最大尝试次数
		)
		if found {
			nonce = foundNonce
			predictedAddress = addr
			salt = s.create2Calc.CalculateSalt(
				req.Name, req.Symbol,
				DefaultTotalSupply,
				s.coreContract,
				timestamp, nonce,
			)
		} else {
			// 没找到靓号，使用默认
			salt, predictedAddress = s.create2Calc.PredictAddress(
				req.Name, req.Symbol,
				DefaultTotalSupply,
				s.coreContract,
				timestamp, 0,
			)
		}
	} else {
		salt, predictedAddress = s.create2Calc.PredictAddress(
			req.Name, req.Symbol,
			DefaultTotalSupply,
			s.coreContract,
			timestamp, 0,
		)
	}

	return &CalculateAddressResponse{
		PredictedAddress: predictedAddress.Hex(),
		Salt:             crypto.Bytes32ToHex(salt),
		Nonce:            int64(nonce),
	}, nil
}

// getNextNonce 获取下一个 nonce
func (s *TokenService) getNextNonce(ctx context.Context) (int64, error) {
	if s.tokenModel == nil {
		return 0, fmt.Errorf("token model is not initialized")
	}

	db := s.tokenModel.GetDB()
	if db == nil {
		return 0, fmt.Errorf("database connection is not available")
	}

	var nonce int64
	err := db.QueryRow(ctx, `
		UPDATE nonce_sequence 
		SET current_nonce = current_nonce + 1, updated_at = NOW()
		WHERE chain_id = $1
		RETURNING current_nonce
	`, s.chainID).Scan(&nonce)
	if err != nil {
		// 如果表不存在或记录不存在，尝试创建
		_, _ = db.Exec(ctx, `
			INSERT INTO nonce_sequence (chain_id, current_nonce, created_at, updated_at)
			VALUES ($1, 1, NOW(), NOW())
			ON CONFLICT (chain_id) DO UPDATE SET current_nonce = nonce_sequence.current_nonce + 1, updated_at = NOW()
		`, s.chainID)
		err = db.QueryRow(ctx, `SELECT current_nonce FROM nonce_sequence WHERE chain_id = $1`, s.chainID).Scan(&nonce)
		if err != nil {
			return 0, err
		}
	}
	return nonce, nil
}

// saveCreationRequest 保存创建请求
func (s *TokenService) saveCreationRequest(
	ctx context.Context,
	req *CreateTokenRequest,
	params *crypto.CreateTokenParams,
	encodedData, signature []byte,
	salt [32]byte,
	predictedAddress common.Address,
) error {
	if s.tokenModel == nil {
		return fmt.Errorf("token model is not initialized")
	}

	db := s.tokenModel.GetDB()
	if db == nil {
		return fmt.Errorf("database connection is not available")
	}

	vestingJSON := "[]"
	if len(req.VestingAllocations) > 0 {
		// 简化处理，实际应该使用 JSON 编码
		parts := make([]string, len(req.VestingAllocations))
		for i, v := range req.VestingAllocations {
			parts[i] = fmt.Sprintf(`{"amount":%d,"duration":%d}`, v.Amount, v.Duration)
		}
		vestingJSON = "[" + strings.Join(parts, ",") + "]"
	}

	_, err := db.Exec(ctx, `
		INSERT INTO token_creation_requests (
			request_id, creator_address, name, symbol, description, logo, banner,
			total_supply, sale_amount, virtual_bnb_reserve, virtual_token_reserve,
			launch_mode, launch_time, creation_fee, nonce, salt, predicted_address,
			signature, encoded_data, initial_buy_percentage, margin_bnb, margin_time,
			vesting_allocations, website, twitter, telegram, discord, whitepaper,
			contact_email, contact_tg, tags, status, timestamp, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21, $22, $23::jsonb, $24, $25, $26, $27, $28, $29, $30, $31,
			0, $32, NOW(), NOW()
		)
	`,
		crypto.Bytes32ToHex(params.RequestID),
		strings.ToLower(req.Creator),
		req.Name,
		req.Symbol,
		req.Description,
		req.Logo,
		req.Banner,
		params.TotalSupply.String(),
		params.SaleAmount.String(),
		params.VirtualBNBReserve.String(),
		params.VirtualTokenReserve.String(),
		req.LaunchMode,
		req.LaunchTime,
		params.CreationFee.String(),
		params.Nonce,
		crypto.Bytes32ToHex(salt),
		strings.ToLower(predictedAddress.Hex()),
		"0x"+hex.EncodeToString(signature),
		"0x"+hex.EncodeToString(encodedData),
		req.InitialBuyPercentage,
		params.MarginBnb.String(),
		req.MarginTime,
		vestingJSON,
		req.Website,
		req.Twitter,
		req.Telegram,
		req.Discord,
		req.Whitepaper,
		req.ContactEmail,
		req.ContactTg,
		req.Tags,
		params.Timestamp,
	)
	return err
}
