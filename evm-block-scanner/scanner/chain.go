package scanner

func chainNameFromID(id uint64) string {
	switch id {
	case 1:
		return "eth"
	case 56:
		return "bsc"
	case 137:
		return "polygon"
	case 10:
		return "optimism"
	case 42161:
		return "arbitrum"
	case 43114:
		return "avalanche"
	case 8453:
		return "base"
	case 324:
		return "zksync"
	case 59144:
		return "linea"
	case 534352:
		return "scroll"
	default:
		return ""
	}
}
