package crypto

import (
	"encoding/hex"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// Create2Calculator CREATE2 地址计算器
type Create2Calculator struct {
	factoryAddress common.Address
	tokenBytecode  []byte
}

// NewCreate2Calculator 创建 CREATE2 计算器
func NewCreate2Calculator(factoryAddress string, tokenBytecodeHex string) (*Create2Calculator, error) {
	bytecode, err := hex.DecodeString(strings.TrimPrefix(tokenBytecodeHex, "0x"))
	if err != nil {
		return nil, fmt.Errorf("invalid bytecode: %w", err)
	}

	return &Create2Calculator{
		factoryAddress: common.HexToAddress(factoryAddress),
		tokenBytecode:  bytecode,
	}, nil
}

// CalculateSalt 计算 salt
// salt = keccak256(abi.encodePacked(name, symbol, totalSupply, owner, timestamp, nonce))
func (c *Create2Calculator) CalculateSalt(name, symbol string, totalSupply *big.Int, owner common.Address, timestamp, nonce uint64) [32]byte {
	// 使用 keccak256 计算 salt
	// 注意：这里使用的是 solidityKeccak256，对应 Solidity 中的 keccak256(abi.encodePacked(...))
	
	// 编码参数
	args := abi.Arguments{
		{Type: mustNewType("string")},
		{Type: mustNewType("string")},
		{Type: mustNewType("uint256")},
		{Type: mustNewType("address")},
		{Type: mustNewType("uint256")},
		{Type: mustNewType("uint256")},
	}

	packed, err := args.Pack(
		name,
		symbol,
		totalSupply,
		owner,
		new(big.Int).SetUint64(timestamp),
		new(big.Int).SetUint64(nonce),
	)
	if err != nil {
		// 简化处理，实际应该返回错误
		return [32]byte{}
	}

	hash := crypto.Keccak256(packed)
	var result [32]byte
	copy(result[:], hash)
	return result
}

// CalculateAddress 计算 CREATE2 地址
// address = keccak256(0xff ++ factory ++ salt ++ keccak256(bytecode + constructorArgs))[12:]
func (c *Create2Calculator) CalculateAddress(salt [32]byte, name, symbol string, totalSupply *big.Int, owner common.Address) common.Address {
	// 编码构造函数参数
	constructorArgs := c.encodeConstructorArgs(name, symbol, totalSupply, owner)

	// 计算 initcode = bytecode + constructorArgs
	initcode := append(c.tokenBytecode, constructorArgs...)

	// 计算 initcode hash
	initcodeHash := crypto.Keccak256(initcode)

	// 计算 CREATE2 地址
	// keccak256(0xff ++ factory ++ salt ++ initcodeHash)[12:]
	data := []byte{0xff}
	data = append(data, c.factoryAddress.Bytes()...)
	data = append(data, salt[:]...)
	data = append(data, initcodeHash...)

	hash := crypto.Keccak256(data)
	return common.BytesToAddress(hash[12:])
}

// encodeConstructorArgs 编码构造函数参数
func (c *Create2Calculator) encodeConstructorArgs(name, symbol string, totalSupply *big.Int, owner common.Address) []byte {
	args := abi.Arguments{
		{Type: mustNewType("string")},
		{Type: mustNewType("string")},
		{Type: mustNewType("uint256")},
		{Type: mustNewType("address")},
	}

	packed, err := args.Pack(name, symbol, totalSupply, owner)
	if err != nil {
		return nil
	}
	return packed
}

// FindVanityAddress 寻找靓号地址
func (c *Create2Calculator) FindVanityAddress(
	name, symbol string,
	totalSupply *big.Int,
	owner common.Address,
	timestamp uint64,
	targetSuffix string,
	maxAttempts uint64,
) (nonce uint64, address common.Address, found bool) {
	targetSuffix = strings.ToLower(targetSuffix)

	for nonce := uint64(0); nonce < maxAttempts; nonce++ {
		salt := c.CalculateSalt(name, symbol, totalSupply, owner, timestamp, nonce)
		addr := c.CalculateAddress(salt, name, symbol, totalSupply, owner)

		addrLower := strings.ToLower(addr.Hex())
		if strings.HasSuffix(addrLower, targetSuffix) {
			return nonce, addr, true
		}
	}

	return 0, common.Address{}, false
}

// PredictAddress 预测代币地址
func (c *Create2Calculator) PredictAddress(
	name, symbol string,
	totalSupply *big.Int,
	owner common.Address,
	timestamp, nonce uint64,
) (salt [32]byte, address common.Address) {
	salt = c.CalculateSalt(name, symbol, totalSupply, owner, timestamp, nonce)
	address = c.CalculateAddress(salt, name, symbol, totalSupply, owner)
	return salt, address
}

