package parse

import (
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/signer/fourbyte"
)

var fourbyteDB *fourbyte.Database

func init() {
	fourbyteDB, _ = fourbyte.New()
}

type InputData struct {
	Raw    hexutil.Bytes          `json:"raw"`
	Method string                 `json:"method"`
	Params []ParsedInputDataParam `json:"params"`
}

type ParsedInputDataParam struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Value any    `json:"value"`
}

// ParseInputData 尝试解析十六进制输入数据
func ParseInputData(input []byte) *InputData {
	result := &InputData{Raw: input}
	if len(input) < 4 {
		return result
	}

	// 1. 提取 Selector (前4字节)
	selector := input[:4]

	// 2. 从 4byte 数据库中查找对应的 ABI 字符串
	// 返回值通常是类似 "transfer(address,uint256)" 的格式
	abistr, err := fourbyteDB.Selector(selector)
	if err != nil {
		result.Method = hexutil.Encode(selector)
		return result
	}

	// 3. 构造一个临时的 ABI 对象
	// 4byte 返回的是函数签名，我们需要将其包装成标准的 JSON ABI 格式才能解析
	methodName := abistr[:strings.Index(abistr, "(")]

	// 解析参数类型
	paramTypes := abistr[strings.Index(abistr, "(")+1 : len(abistr)-1]
	var args abi.Arguments
	if paramTypes != "" {
		for t := range strings.SplitSeq(paramTypes, ",") {
			argType, err := abi.NewType(t, "", nil)
			if err != nil {
				return result
			}
			args = append(args, abi.Argument{Type: argType})
		}
	}

	// 4. 解析参数值 (跳过前4字节)
	values, err := args.Unpack(input[4:])
	if err != nil {
		return result
	}

	result.Method = methodName
	result.Params = make([]ParsedInputDataParam, 0)

	for i, v := range values {
		result.Params = append(result.Params, ParsedInputDataParam{
			Name:  fmt.Sprintf("arg%d", i), // 4byte 不提供参数名，只能编号
			Type:  args[i].Type.String(),
			Value: formatValue(v),
		})
	}

	return result
}

func formatValue(v any) any {
	switch t := v.(type) {
	case []byte:
		return hexutil.Bytes(t)
	default:
		return v
	}
}
