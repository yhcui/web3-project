package indexer

// MEMECoreABI 合约ABI定义（仅包含需要解析的事件）
const MEMECoreABI = `[
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "token", "type": "address"},
			{"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
			{"indexed": false, "internalType": "string", "name": "name", "type": "string"},
			{"indexed": false, "internalType": "string", "name": "symbol", "type": "string"},
			{"indexed": false, "internalType": "uint256", "name": "totalSupply", "type": "uint256"},
			{"indexed": false, "internalType": "bytes32", "name": "requestId", "type": "bytes32"}
		],
		"name": "TokenCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "token", "type": "address"},
			{"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "bnbAmount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "tradingFee", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "virtualBNBReserve", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "virtualTokenReserve", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "availableTokens", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "collectedBNB", "type": "uint256"}
		],
		"name": "TokenBought",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "token", "type": "address"},
			{"indexed": true, "internalType": "address", "name": "seller", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "bnbAmount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "tradingFee", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "virtualBNBReserve", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "virtualTokenReserve", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "availableTokens", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "collectedBNB", "type": "uint256"}
		],
		"name": "TokenSold",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "token", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "liquidityBNB", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "liquidityTokens", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "liquidityResult", "type": "uint256"}
		],
		"name": "TokenGraduated",
		"type": "event"
	}
]`

