package models

import (
	"encoding/json"
	"errors"
	"pledge-backend/api/models/request"
	"pledge-backend/db"

	"gorm.io/gorm"
)

// MultiSign multi-sign signature
type MultiSign struct {
	Id               int32  `gorm:"column:id;primaryKey"`
	SpName           string `json:"sp_name" gorm:"column:sp_name"`
	ChainId          int    `json:"chain_id" gorm:"column:chain_id"`
	SpToken          string `json:"_spToken" gorm:"column:sp_token"`
	JpName           string `json:"jp_name" gorm:"column:jp_name"`
	JpToken          string `json:"_jpToken" gorm:"column:jp_token"`
	SpAddress        string `json:"sp_address" gorm:"column:sp_address"`
	JpAddress        string `json:"jp_address" gorm:"column:jp_address"`
	SpHash           string `json:"spHash" gorm:"column:sp_hash"`
	JpHash           string `json:"jpHash" gorm:"column:jp_hash"`
	MultiSignAccount string `json:"multi_sign_account" gorm:"column:multi_sign_account"`
}

func NewMultiSign() *MultiSign {
	return &MultiSign{}
}

// Set Multi-Sign
// 先删除后增加 多签信息
func (m *MultiSign) Set(multiSign *request.SetMultiSign) error {

	MultiSignAccountByteArr, _ := json.Marshal(multiSign.MultiSignAccount)
	/*

		Where("chain_id", multiSign.ChainId)
			设置删除条件：查找 chain_id 等于传入参数 multiSign.ChainId 的记录

		Delete(&m)
			执行删除操作，删除满足条件的所有记录
			注意这里传递的是 m（当前实例指针），但实际删除条件只依赖 Where 子句
			&m 可以被替换为 &MultiSign{} 而不影响功能

	*/
	err := db.Mysql.Table("multi_sign").Where("chain_id", multiSign.ChainId).Delete(&m).Debug().Error
	if err != nil {
		return errors.New("record select err " + err.Error())
	}
	/*
		这里的Where估计是没有用的。
	*/
	err = db.Mysql.Table("multi_sign").Where("id=?", m.Id).Create(&MultiSign{
		ChainId:          multiSign.ChainId,
		SpName:           multiSign.SpName,
		SpToken:          multiSign.SpToken,
		JpName:           multiSign.JpName,
		JpToken:          multiSign.JpToken,
		SpAddress:        multiSign.SpAddress,
		JpAddress:        multiSign.JpAddress,
		SpHash:           multiSign.SpHash,
		JpHash:           multiSign.JpHash,
		MultiSignAccount: string(MultiSignAccountByteArr),
	}).Debug().Error
	if err != nil {
		return err
	}
	return nil
}

// Get Multi-Sign
func (m *MultiSign) Get(chainId int) error {
	err := db.Mysql.Table("multi_sign").Where("chain_id", chainId).First(&m).Debug().Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		} else {
			return errors.New("record select err " + err.Error())
		}
	}
	return nil
}
