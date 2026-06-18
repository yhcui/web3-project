package parse

import (
	"evm-scanner/types"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
)

type LogParser interface {
	ParseLog(tx *Transaction, vLog *types.Log) any
}

func ParseLogToMap(contractABI *abi.ABI, vLog *types.Log) (string, map[string]any, error) {
	if len(vLog.Topics) == 0 && len(vLog.Data) == 0 {
		return "", nil, fmt.Errorf("empty log")
	}

	var event *abi.Event

	// --- 第一步：尝试匹配具名事件 (Named Event) ---
	if len(vLog.Topics) > 0 {
		// EventByID 内部会计算哈希并匹配 Topics[0]
		e, err := contractABI.EventByID(vLog.Topics[0])
		if err == nil {
			event = e
		}
	}

	// --- 第二步：如果具名匹配失败，尝试寻找匿名的 (Anonymous) ---
	if event == nil {
		for _, e := range contractABI.Events {
			if e.Anonymous {
				// 匹配逻辑：Topics 的数量必须等于 Indexed 参数的数量
				indexedCount := 0
				for _, input := range e.Inputs {
					if input.Indexed {
						indexedCount++
					}
				}
				if indexedCount == len(vLog.Topics) {
					event = &e
					break // 找到第一个参数匹配的匿名事件
				}
			}
		}
	}

	// 如果依然没找到，说明该 ABI 不支持此 Log
	if event == nil {
		return "", nil, fmt.Errorf("no matching named or anonymous event found")
	}

	// --- 第三步：统一解析逻辑 ---
	result := make(map[string]any)

	// 1. 解析非 indexed 参数 (Data)
	if len(vLog.Data) > 0 {
		if err := event.Inputs.UnpackIntoMap(result, vLog.Data); err != nil {
			return event.Name, nil, fmt.Errorf("unpack data error: %v", err)
		}
	}

	// 2. 解析 indexed 参数 (Topics)
	var indexedArgs abi.Arguments
	for _, arg := range event.Inputs {
		if arg.Indexed {
			indexedArgs = append(indexedArgs, arg)
		}
	}

	if len(indexedArgs) > 0 {
		var topicsToParse []common.Hash
		if event.Anonymous {
			// 匿名事件：Topics 数组全是参数数据
			topicsToParse = vLog.Topics
		} else {
			// 具名事件：跳过 Topics[0] (签名哈希)
			if len(vLog.Topics) > 1 {
				topicsToParse = vLog.Topics[1:]
			}
		}

		// 确保提供的 Topics 数量与 ABI 预期的 Indexed 数量一致
		if len(topicsToParse) == len(indexedArgs) {
			if err := abi.ParseTopicsIntoMap(result, indexedArgs, topicsToParse); err != nil {
				return event.Name, nil, fmt.Errorf("parse topics error: %v", err)
			}
		}
	}

	return event.Name, result, nil
}

func ParseRawLog(tx *Transaction, log *types.Log) any {
	var method string

	// 检查 Topics 是否为空
	if len(log.Topics) > 0 {
		selector := log.Topics[0].Bytes()[:4]
		sig, err := fourbyteDB.Selector(selector)
		if err == nil {
			// 仅取名称: Transfer(address,address,uint256) -> Transfer
			if idx := strings.Index(sig, "("); idx != -1 {
				method = sig[:idx]
			}
		}
		if method == "" {
			method = hexutil.Encode(selector)
		}
	} else {
		method = "unknown"
	}
	return &RawEvent{
		Type:    "raw",
		Name:    method,
		Topics:  log.Topics,
		Data:    log.Data,
		Address: log.Address,
	}
}
