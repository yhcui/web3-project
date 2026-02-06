package types

import "math/big"

// TokenCreatedEvent 代币创建事件
type TokenCreatedEvent struct {
	TokenAddress    string   `json:"token_address"`
	CreatorAddress  string   `json:"creator_address"`
	Name            string   `json:"name"`
	Symbol          string   `json:"symbol"`
	TotalSupply     *big.Int `json:"total_supply"`
	RequestID       string   `json:"request_id"`
	TransactionHash string   `json:"transaction_hash"`
	BlockNumber     uint64   `json:"block_number"`
	BlockTimestamp  uint64   `json:"block_timestamp"`
	LogIndex        uint     `json:"log_index"`
}

// TokenBoughtEvent 代币购买事件
type TokenBoughtEvent struct {
	TokenAddress        string   `json:"token_address"`
	BuyerAddress        string   `json:"buyer_address"`
	BnbAmount           *big.Int `json:"bnb_amount"`
	TokenAmount         *big.Int `json:"token_amount"`
	TradingFee          *big.Int `json:"trading_fee"`
	VirtualBNBReserve   *big.Int `json:"virtual_bnb_reserve"`
	VirtualTokenReserve *big.Int `json:"virtual_token_reserve"`
	AvailableTokens     *big.Int `json:"available_tokens"`
	CollectedBNB        *big.Int `json:"collected_bnb"`
	TransactionHash     string   `json:"transaction_hash"`
	BlockNumber         uint64   `json:"block_number"`
	BlockTimestamp      uint64   `json:"block_timestamp"`
	LogIndex            uint     `json:"log_index"`
}

// TokenSoldEvent 代币卖出事件
type TokenSoldEvent struct {
	TokenAddress        string   `json:"token_address"`
	SellerAddress       string   `json:"seller_address"`
	TokenAmount         *big.Int `json:"token_amount"`
	BnbAmount           *big.Int `json:"bnb_amount"`
	TradingFee          *big.Int `json:"trading_fee"`
	VirtualBNBReserve   *big.Int `json:"virtual_bnb_reserve"`
	VirtualTokenReserve *big.Int `json:"virtual_token_reserve"`
	AvailableTokens     *big.Int `json:"available_tokens"`
	CollectedBNB        *big.Int `json:"collected_bnb"`
	TransactionHash     string   `json:"transaction_hash"`
	BlockNumber         uint64   `json:"block_number"`
	BlockTimestamp      uint64   `json:"block_timestamp"`
	LogIndex            uint     `json:"log_index"`
}

// TokenGraduatedEvent 代币毕业事件
type TokenGraduatedEvent struct {
	TokenAddress    string   `json:"token_address"`
	LiquidityBNB    *big.Int `json:"liquidity_bnb"`
	LiquidityTokens *big.Int `json:"liquidity_tokens"`
	LiquidityResult *big.Int `json:"liquidity_result"`
	TransactionHash string   `json:"transaction_hash"`
	BlockNumber     uint64   `json:"block_number"`
	BlockTimestamp  uint64   `json:"block_timestamp"`
	LogIndex        uint     `json:"log_index"`
}

