package multi

import (
	"fmt"

	"github.com/shopspring/decimal"
)

// NFT市场活动类型常量解释
// (1:Buy,2:Mint,3:List,4:Cancel Listing,5:Cancler Offer,6.Make Offer,7.Sell,8.Transfer.)
const (
	//购买活动，表示用户购买NFT
	Buy = 1
	//铸造活动，表示新NFT被创建/铸造
	Mint = 2
	//列表或上架活动，表示NFT被挂单出售
	Listing = 3
	//取消列表，表示取消NFT出售挂单
	CancelListing = 4
	//取消报价，表示取消对某个NFT的出价
	CancelOffer = 5
	//报价/出价活动，表示用户对某个NFT进行出价
	MakeOffer = 6
	//销售活动，表示NFT实际成交销售
	Sale = 7
	//NFT在钱包间的转移
	Transfer = 8
	//合出价，表示对整个NFT集合的批量出价
	CollectionBid = 9
	//项目出价，表示对特定单个NFT项目的出价
	ItemBid = 10
	//取消集合出价，表示撤销对NFT集合的出价
	CancelCollectionBid = 16
	//取消项目出价，表示撤销对特定NFT的出价
	CancelItemBid = 17
)

// 不同NFT市场平台的常量组
const (
	//集线器/中心平台，可能是自建或聚合平台
	Hub int = iota
	//OpenSea，最大的NFT市场平台
	Opensea
	//LooksRare，知名NFT交易市场
	Looksrare
	//X2Y2，NFT交易市场平台
	X2Y2
	//Blur，专注于蓝筹NFT的交易市场
	Blur
	//单簿去中心化交易所
	OrderBookDex
)

type Activity struct {
	Id int64 `json:"id" gorm:"primaryKey;autoIncrement;column:id;not null"`
	//1:Buy,2:Mint,3:List,4:Cancel List,5:Cancel Offer,6.Make Offer,7.Sell,8.Transfer.
	ActivityType      int             `json:"activity_type" gorm:"column:activity_type;type:tinyint(1);not null"`
	Maker             string          `json:"maker" gorm:"column:maker;type:varchar(42);not null"`
	Taker             string          `json:"taker" gorm:"column:taker;type:varchar(42);not null"`
	MarketplaceID     int             `json:"marketplace_id" gorm:"column:marketplace_id;type:tinyint;not null;default:0"`
	CollectionAddress string          `json:"collection_address" gorm:"column:collection_address;type:varchar(64);not null;default:''"`
	TokenId           string          `json:"token_id" gorm:"column:token_id"`
	CurrencyAddress   string          `gorm:"column:currency_address" json:"currency_address"`
	Price             decimal.Decimal `gorm:"column:price" json:"price"`
	SellPrice         decimal.Decimal `json:"sell_price" gorm:"column:sell_price;type:decimal(30);not null;default:0"`
	BuyPrice          decimal.Decimal `json:"buy_price" gorm:"column:buy_price;type:decimal(30);not null;default:0"`
	BlockNumber       int64           `json:"block_number" gorm:"column:block_number;type:bigint(20);not null"`
	TxHash            string          `json:"tx_hash" gorm:"column:tx_hash;type:varchar(255);not null"`
	EventTime         int64           `json:"event_time" gorm:"column:event_time;type:bigint(20);default:0;comment:链上事件发生的时间"`
	CreateTime        int64           `json:"create_time" gorm:"column:create_time;type:bigint(20);autoCreateTime:milli;comment:创建时间"` // 创建时间
	UpdateTime        int64           `json:"update_time" gorm:"column:update_time;type:bigint(20);autoUpdateTime:milli;comment:更新时间"` // 更新时间
}

func ActivityTableName(chainName string) string {
	return fmt.Sprintf("ob_activity_%s", chainName)
}
