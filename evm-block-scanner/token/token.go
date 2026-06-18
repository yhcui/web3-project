package token

import (
	"context"
	"encoding/gob"
	"evm-scanner/client"
	"fmt"
	"log"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/shopspring/decimal"
	"golang.org/x/sync/singleflight"
)

type Info struct {
	Symbol   string `json:"symbol"`
	Decimals uint8  `json:"decimals"`
	Name     string `json:"name"`
}

func (i *Info) ParseFloatAmount(amount *big.Int) string {
	if i == nil || amount == nil {
		return "0"
	}
	d := decimal.NewFromBigInt(amount, 0).Shift(-int32(i.Decimals))
	return d.String()
}

type Provider interface {
	GetClient() *client.Endpoint
	ChainId() *big.Int
	Origin() string
}

type Manager struct {
	cache    sync.Map // key: Address, value: *Info
	invalid  sync.Map // key: Address, value: bool
	provider Provider
	cacheDir string
	sf       singleflight.Group
}

type Sing struct {
	Name     []byte
	Symbol   []byte
	Decimals []byte
}

var handlers map[string]*Sing = make(map[string]*Sing)

// 注册获取 Token 的调用的函数签名 (Method ID)
func Register(standard string, name []byte, symbol []byte, decimals []byte) {
	handlers[standard] = &Sing{
		Name:     name,
		Symbol:   symbol,
		Decimals: decimals,
	}
}

func NewManager(provider Provider, cacheDir string) *Manager {
	return &Manager{
		provider: provider,
		cacheDir: cacheDir,
		cache:    sync.Map{},
		invalid:  sync.Map{},
	}
}

var nativeAddr = common.Address{}

func (m *Manager) GetInfo(ctx context.Context, standard string, addr common.Address) (info *Info, err error) {
	if addr == nativeAddr {
		return nil, nil
	}

	if val, ok := m.cache.Load(addr); ok {
		return val.(*Info), nil
	}

	if _, ok := m.invalid.Load(addr); ok {
		return nil, fmt.Errorf("token is invalid (cached)")
	}

	// Use singleflight to prevent thundering herd
	key := addr.String()
	res, err, _ := m.sf.Do(key, func() (any, error) {
		// Double check cache
		if val, ok := m.cache.Load(addr); ok {
			return val, nil
		}
		if _, ok := m.invalid.Load(addr); ok {
			return nil, fmt.Errorf("token is invalid (cached)")
		}

		sing := handlers[standard]
		if sing == nil {
			return nil, fmt.Errorf("unsupported standard: %s", standard)
		}

		info = &Info{}
		start := time.Now()
		info.Name, info.Symbol, info.Decimals, err = m.provider.GetClient().GetToken(ctx, sing.Name, sing.Symbol, sing.Decimals, addr)

		if err != nil {
			// Cache failure as invalid to prevent penetration
			m.invalid.Store(addr, true)
			return nil, err
		}
		if elapsed := time.Since(start); elapsed >= time.Second {
			log.Printf("[%s] Slow token metadata fetch: token=%s duration=%s", strings.ToUpper(m.provider.Origin()), addr.Hex(), elapsed.Round(100*time.Millisecond))
		}

		log.Printf("[%s] Get token info, name: %s, symbol: %s, decimals: %d", strings.ToUpper(m.provider.Origin()), info.Name, info.Symbol, info.Decimals)

		m.cache.Store(addr, info)
		return info, nil
	})

	if err != nil {
		return nil, err
	}

	return res.(*Info), nil
}

func (m *Manager) getCacheFilepath() string {
	return filepath.Join(m.cacheDir, fmt.Sprintf("token_cache_%d", m.provider.ChainId()))
}

type cacheData struct {
	Cache   map[string]*Info
	Invalid map[string]bool
}

func (m *Manager) WriteCacheToFile() error {
	data := cacheData{
		Cache:   make(map[string]*Info),
		Invalid: make(map[string]bool),
	}
	m.cache.Range(func(key, value any) bool {
		addr := key.(common.Address)
		info := value.(*Info)
		data.Cache[addr.String()] = info
		return true
	})
	m.invalid.Range(func(key, value any) bool {
		addr := key.(common.Address)
		data.Invalid[addr.String()] = true
		return true
	})

	filePath := m.getCacheFilepath()
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()
	encoder := gob.NewEncoder(file)
	return encoder.Encode(data)
}

func (m *Manager) ReadCacheFromFile() (n int, err error) {
	filePath := m.getCacheFilepath()
	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		return
	}
	defer file.Close()

	var data cacheData
	decoder := gob.NewDecoder(file)
	err = decoder.Decode(&data)
	if err != nil {
		return 0, err
	}

	for addrStr, info := range data.Cache {
		addr := common.HexToAddress(addrStr)
		m.cache.Store(addr, info)
		n++
	}
	for addrStr := range data.Invalid {
		addr := common.HexToAddress(addrStr)
		m.invalid.Store(addr, true)
	}
	return
}
