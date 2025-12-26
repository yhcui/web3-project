package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"pledge-backend/config"
	"pledge-backend/contract/bindings"
	"pledge-backend/db"
	"pledge-backend/log"
	serviceCommon "pledge-backend/schedule/common"
	"pledge-backend/schedule/models"
	"pledge-backend/utils"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type TokenPrice struct{}

func NewTokenPrice() *TokenPrice {
	return &TokenPrice{}
}

// UpdateContractPrice update contract price
/*
	更新合约代币价格
	流程：
		1、从数据库获取所有代币信息
		2、根据链ID调用不同网络的价格获取方法
		3、通过缓存比较判断是否需要更新数据
		4、将新价格数据保存到数据库
*/
func (s *TokenPrice) UpdateContractPrice() {
	var tokens []models.TokenInfo
	db.Mysql.Table("token_info").Find(&tokens)
	for _, t := range tokens {

		var err error
		var price int64 = 0

		if t.Token == "" {
			log.Logger.Sugar().Error("UpdateContractPrice token empty ", t.Symbol, t.ChainId)
			continue
		} else {
			if t.ChainId == config.Config.TestNet.ChainId {
				//获取测试网代币价格
				err, price = s.GetTestNetTokenPrice(t.Token)
			} else if t.ChainId == "56" {
				// if strings.ToUpper(t.Token) == config.Config.MainNet.PlgrAddress { // get PLGR price from ku-coin(Only main network price)
				// 	priceStr, _ := db.RedisGetString("plgr_price")
				// 	priceF, _ := decimal.NewFromString(priceStr)
				// 	e8 := decimal.NewFromInt(100000000)
				// 	priceF = priceF.Mul(e8)
				// 	price = priceF.IntPart()
				// } else {
				// 	err, price = s.GetMainNetTokenPrice(t.Token)
				// }

				//err, price = s.GetMainNetTokenPrice(t.Token)

			}

			if err != nil {
				log.Logger.Sugar().Error("UpdateContractPrice err ", t.Symbol, t.ChainId, err)
				continue
			}
		}
		// 保存价格数据到缓存
		hasNewData, err := s.CheckPriceData(t.Token, t.ChainId, utils.Int64ToString(price))
		if err != nil {
			log.Logger.Sugar().Error("UpdateContractPrice CheckPriceData err ", err)
			continue
		}

		if hasNewData {
			err = s.SavePriceData(t.Token, t.ChainId, utils.Int64ToString(price))
			if err != nil {
				log.Logger.Sugar().Error("UpdateContractPrice SavePriceData err ", err)
				continue
			}
		}
	}
}

// GetMainNetTokenPrice get contract price on main net
func (s *TokenPrice) GetMainNetTokenPrice(token string) (error, int64) {
	ethereumConn, err := ethclient.Dial(config.Config.MainNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	bscPledgeOracleMainNetToken, err := bindings.NewBscPledgeOracleMainnetToken(common.HexToAddress(config.Config.MainNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	price, err := bscPledgeOracleMainNetToken.GetPrice(nil, common.HexToAddress(token))
	if err != nil {
		log.Logger.Error(err.Error())
		return err, 0
	}

	return nil, price.Int64()
}

// GetTestNetTokenPrice get contract price on test net
func (s *TokenPrice) GetTestNetTokenPrice(token string) (error, int64) {
	ethereumConn, err := ethclient.Dial(config.Config.TestNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	bscPledgeOracleTestnetToken, err := bindings.NewBscPledgeOracleTestnetToken(common.HexToAddress(config.Config.TestNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	price, err := bscPledgeOracleTestnetToken.GetPrice(nil, common.HexToAddress(token))
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	return nil, price.Int64()
}

// CheckPriceData Saving price data to redis if it has new price
// 检查价格数据是否有更新，使用Redis缓存避免重复更新
func (s *TokenPrice) CheckPriceData(token, chainId, price string) (bool, error) {
	redisKey := "token_info:" + chainId + ":" + token
	redisTokenInfoBytes, err := db.RedisGet(redisKey)
	if len(redisTokenInfoBytes) <= 0 {
		//检查代币信息是否存在，不存在则创建
		err = s.CheckTokenInfo(token, chainId)
		if err != nil {
			log.Logger.Error(err.Error())
		}
		err = db.RedisSet(redisKey, models.RedisTokenInfo{
			Token:   token,
			ChainId: chainId,
			Price:   price,
		}, 0)
		if err != nil {
			log.Logger.Error(err.Error())
			return false, err
		}
	} else {
		redisTokenInfo := models.RedisTokenInfo{}
		err = json.Unmarshal(redisTokenInfoBytes, &redisTokenInfo)
		if err != nil {
			log.Logger.Error(err.Error())
			return false, err
		}

		if redisTokenInfo.Price == price {
			return false, nil
		}

		redisTokenInfo.Price = price
		err = db.RedisSet(redisKey, redisTokenInfo, 0)
		if err != nil {
			log.Logger.Error(err.Error())
			return true, err
		}
	}
	return true, nil
}

// CheckTokenInfo  Insert token information if it was not in mysql
// 检查代币信息是否存在，不存在则创建
func (s *TokenPrice) CheckTokenInfo(token, chainId string) error {
	tokenInfo := models.TokenInfo{}
	err := db.Mysql.Table("token_info").Where("token=? and chain_id=?", token, chainId).First(&tokenInfo).Debug().Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			tokenInfo = models.TokenInfo{}
			nowDateTime := utils.GetCurDateTimeFormat()
			tokenInfo.Token = token
			tokenInfo.ChainId = chainId
			tokenInfo.UpdatedAt = nowDateTime
			tokenInfo.CreatedAt = nowDateTime
			err = db.Mysql.Table("token_info").Create(tokenInfo).Debug().Error
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}
	return nil
}

// SavePriceData Saving price data to mysql if it has new price
func (s *TokenPrice) SavePriceData(token, chainId, price string) error {

	nowDateTime := utils.GetCurDateTimeFormat()

	err := db.Mysql.Table("token_info").Where("token=? and chain_id=? ", token, chainId).Updates(map[string]interface{}{
		"price":      price,
		"updated_at": nowDateTime,
	}).Debug().Error
	if err != nil {
		log.Logger.Sugar().Error("UpdateContractPrice SavePriceData err ", err)
		return err
	}

	return nil
}

// SavePlgrPrice Saving price data to mysql if it has new price
func (s *TokenPrice) SavePlgrPrice() {
	priceStr, _ := db.RedisGetString("plgr_price")
	priceF, _ := decimal.NewFromString(priceStr)
	e8 := decimal.NewFromInt(100000000)
	priceF = priceF.Mul(e8)
	price := priceF.IntPart()

	ethereumConn, err := ethclient.Dial(config.Config.MainNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}
	bscPledgeOracleMainNetToken, err := bindings.NewBscPledgeOracleMainnetToken(common.HexToAddress(config.Config.MainNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	privateKeyEcdsa, err := crypto.HexToECDSA(serviceCommon.PlgrAdminPrivateKey)
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	auth, err := bind.NewKeyedTransactorWithChainID(privateKeyEcdsa, big.NewInt(utils.StringToInt64(config.Config.MainNet.ChainId)))
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	transactOpts := bind.TransactOpts{
		From:      auth.From,
		Nonce:     nil,
		Signer:    auth.Signer, // Method to use for signing the transaction (mandatory)
		Value:     big.NewInt(0),
		GasPrice:  nil,
		GasFeeCap: nil,
		GasTipCap: nil,
		GasLimit:  0,
		Context:   ctx,
		NoSend:    false, // Do all transact steps but do not send the transaction
	}

	_, err = bscPledgeOracleMainNetToken.SetPrice(&transactOpts, common.HexToAddress(config.Config.MainNet.PlgrAddress), big.NewInt(price))

	log.Logger.Sugar().Info("SavePlgrPrice ", err)

	a, d := s.GetMainNetTokenPrice(config.Config.MainNet.PlgrAddress)
	log.Logger.Sugar().Info("GetMainNetTokenPrice ", a, d)
}

// SavePlgrPriceTestNet  Saving price data to mysql if it has new price
// 测试网设置PLGR代币价格（使用固定价格22222）
func (s *TokenPrice) SavePlgrPriceTestNet() {

	price := 22222
	// 接到测试网 (config.Config.TestNet.NetUrl)
	ethereumConn, err := ethclient.Dial(config.Config.TestNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}
	// 连接测试网预言机合约
	bscPledgeOracleTestNetToken, err := bindings.NewBscPledgeOracleMainnetToken(common.HexToAddress(config.Config.TestNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	//进行交易签名
	privateKeyEcdsa, err := crypto.HexToECDSA(serviceCommon.PlgrAdminPrivateKey)
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}
	// 使用测试网链ID创建交易授权器
	auth, err := bind.NewKeyedTransactorWithChainID(privateKeyEcdsa, big.NewInt(utils.StringToInt64(config.Config.TestNet.ChainId)))
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	transactOpts := bind.TransactOpts{
		From:      auth.From,
		Nonce:     nil,
		Signer:    auth.Signer, // Method to use for signing the transaction (mandatory)
		Value:     big.NewInt(0),
		GasPrice:  nil,
		GasFeeCap: nil,
		GasTipCap: nil,
		GasLimit:  0,
		Context:   ctx,
		NoSend:    false, // Do all transact steps but do not send the transaction
	}
	// 更新测试网预言机合约中 PLGR 代币的价格
	_, err = bscPledgeOracleTestNetToken.SetPrice(&transactOpts, common.HexToAddress(config.Config.TestNet.PlgrAddress), big.NewInt(int64(price)))

	log.Logger.Sugar().Info("SavePlgrPrice ", err)

	//方法获取的价格信息
	a, d := s.GetTestNetTokenPrice(config.Config.TestNet.PlgrAddress)
	fmt.Println(a, d, 5555)
}
