package parse

import (
	"evm-scanner/token"
)

var BEP20 ERC20Like = ERC20Like{56, "BEP-20"}

func init() {
	registerProtocol(BEP20)
	token.Register(BEP20.String(), erc20MethodId_Name, erc20MethodId_Symbol, erc20MethodId_Decimals)
}
