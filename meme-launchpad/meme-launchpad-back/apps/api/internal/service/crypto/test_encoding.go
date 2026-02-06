package crypto

import (
	"encoding/hex"
	"fmt"
	"os/exec"
	"strings"

	"github.com/ethereum/go-ethereum/common"
)

// TestEncodingWithJS 使用 JS 脚本生成编码数据，用于对比
func TestEncodingWithJS(params *CreateTokenParams, chainID int64, contractAddress common.Address) ([]byte, error) {
	// 构建 JS 脚本参数
	jsScript := fmt.Sprintf(`
const { ethers } = require("ethers");

const params = {
    name: "%s",
    symbol: "%s",
    totalSupply: "%s",
    saleAmount: "%s",
    virtualBNBReserve: "%s",
    virtualTokenReserve: "%s",
    launchTime: %d,
    creator: "%s",
    timestamp: %d,
    requestId: "%s",
    nonce: %d,
    initialBuyPercentage: %d,
    marginBnb: "%s",
    marginTime: %d,
    vestingAllocations: []
};

const types = [
    "string", "string", "uint256", "uint256", "uint256", "uint256",
    "uint256", "address", "uint256", "bytes32", "uint256",
    "uint256", "uint256", "uint256",
    "tuple(uint256,uint256,uint256,uint8)[]"
];

const values = [
    params.name,
    params.symbol,
    params.totalSupply,
    params.saleAmount,
    params.virtualBNBReserve,
    params.virtualTokenReserve,
    params.launchTime,
    params.creator,
    params.timestamp,
    params.requestId,
    params.nonce,
    params.initialBuyPercentage,
    params.marginBnb,
    params.marginTime,
    params.vestingAllocations
];

const data = ethers.utils.defaultAbiCoder.encode(
    ["tuple(" + types.join(",") + ")"], 
    [values]
);

console.log(data);
`, params.Name, params.Symbol,
		params.TotalSupply.String(), params.SaleAmount.String(),
		params.VirtualBNBReserve.String(), params.VirtualTokenReserve.String(),
		params.LaunchTime, params.Creator.Hex(), params.Timestamp,
		hex.EncodeToString(params.RequestID[:]), params.Nonce,
		params.InitialBuyPercentage,
		params.MarginBnb.String(), params.MarginTime)

	// 执行 JS 脚本
	cmd := exec.Command("node", "-e", jsScript)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to execute JS script: %w", err)
	}

	// 解析输出（去掉换行符）
	dataHex := strings.TrimSpace(string(output))
	if !strings.HasPrefix(dataHex, "0x") {
		dataHex = "0x" + dataHex
	}

	// 转换为字节数组
	data, err := hex.DecodeString(strings.TrimPrefix(dataHex, "0x"))
	if err != nil {
		return nil, fmt.Errorf("failed to decode hex: %w", err)
	}

	return data, nil
}

// CompareEncodings 对比 Go 和 JS 生成的编码数据
func CompareEncodings(goEncoded []byte, jsEncoded []byte) {
	fmt.Printf("=== 对比编码数据 ===\n")
	fmt.Printf("Go 编码长度: %d bytes\n", len(goEncoded))
	fmt.Printf("JS 编码长度: %d bytes\n", len(jsEncoded))

	if len(goEncoded) != len(jsEncoded) {
		fmt.Printf("❌ 长度不匹配！\n")
		return
	}

	differences := 0
	for i := 0; i < len(goEncoded) && i < 200; i++ { // 只检查前 200 字节
		if goEncoded[i] != jsEncoded[i] {
			fmt.Printf("差异位置 %d: Go=0x%02x, JS=0x%02x\n", i, goEncoded[i], jsEncoded[i])
			differences++
			if differences > 10 {
				fmt.Printf("... (还有更多差异)\n")
				break
			}
		}
	}

	if differences == 0 {
		fmt.Printf("✓ 前 200 字节完全一致\n")
	}
}
