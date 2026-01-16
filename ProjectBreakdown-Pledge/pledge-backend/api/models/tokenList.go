package models

import (
	"errors"
	"pledge-backend/api/models/request"
	"pledge-backend/db"
)

// 质押池子里放的Token信息
type TokenInfo struct {
	Id      int32  `json:"-" gorm:"column:id;primaryKey"`
	Symbol  string `json:"symbol" gorm:"column:symbol"`
	Token   string `json:"token" gorm:"column:token"`
	ChainId int    `json:"chain_id" gorm:"column:chain_id"`
}

type TokenList struct {
	Id       int32  `json:"-" gorm:"column:id;primaryKey"`
	Symbol   string `json:"symbol" gorm:"column:symbol"`
	Decimals int    `json:"decimals" gorm:"column:decimals"`
	Token    string `json:"token" gorm:"column:token"`
	Logo     string `json:"logo" gorm:"column:logo"`
	ChainId  int    `json:"chain_id" gorm:"column:chain_id"`
}

func NewTokenInfo() *TokenInfo {
	return &TokenInfo{}
}

// 根据chain_id 获取token列表
func (m *TokenInfo) GetTokenInfo(req *request.TokenList) (error, []TokenInfo) {
	var tokenInfo = make([]TokenInfo, 0)
	err := db.Mysql.Table("token_info").Where("chain_id", req.ChainId).Find(&tokenInfo).Debug().Error
	if err != nil {
		return errors.New("record select err " + err.Error()), nil
	}
	return nil, tokenInfo
}

// 根据chain_id 获取token_list
func (m *TokenInfo) GetTokenList(req *request.TokenList) (error, []TokenList) {
	var tokenList = make([]TokenList, 0)
	err := db.Mysql.Table("token_info").Where("chain_id", req.ChainId).Find(&tokenList).Debug().Error
	if err != nil {
		return errors.New("record select err " + err.Error()), nil
	}
	return nil, tokenList
}
