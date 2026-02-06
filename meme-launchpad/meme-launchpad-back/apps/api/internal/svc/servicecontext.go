package svc

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/meme-launchpad/api/internal/config"
	"github.com/meme-launchpad/api/internal/model"
	"github.com/meme-launchpad/api/internal/service/chain"
	"github.com/meme-launchpad/api/internal/service/cos"
	tokenservice "github.com/meme-launchpad/api/internal/service/token"
	"github.com/redis/go-redis/v9"
)

type ServiceContext struct {
	Config config.Config

	// 数据库
	DB *pgxpool.Pool

	// Redis
	Redis *redis.Client

	// Models
	UserModel     *model.UserModel
	TokenModel    *model.TokenModel
	TradeModel    *model.TradeModel
	KlineModel    *model.KlineModel
	CommentModel  *model.CommentModel
	ActivityModel *model.ActivityModel
	InviteModel   *model.InviteModel

	// Services
	TokenService *tokenservice.TokenService
	EventService *chain.EventService
	CosService   *cos.CosService
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 初始化数据库连接
	dbURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
		c.Database.SSLMode,
	)

	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		panic(fmt.Sprintf("Failed to parse database config: %v", err))
	}

	poolConfig.MaxConns = int32(c.Database.MaxOpenConns)
	poolConfig.MinConns = int32(c.Database.MaxIdleConns)

	db, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// 初始化 Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     c.Redis.Host,
		Password: c.Redis.Pass,
		DB:       c.Redis.DB,
	})

	// 测试 Redis 连接
	if _, err := rdb.Ping(context.Background()).Result(); err != nil {
		fmt.Printf("Warning: Failed to connect to Redis: %v\n", err)
	}

	// 初始化 Models
	tokenModel := model.NewTokenModel(db)
	tradeModel := model.NewTradeModel(db)

	log.Println("SignerPrivateKey: ", c.SignerPrivateKey)

	// 初始化 Services
	tokenService := tokenservice.NewTokenService(
		c.SignerPrivateKey,
		c.Chain.CoreContract,
		c.Chain.FactoryContract,
		c.Chain.TokenBytecode,
		c.Chain.RPC,
		c.Chain.ChainID,
		tokenModel,
	)

	eventService := chain.NewEventService(
		c.Chain.RPC,
		c.Chain.CoreContract,
		tokenModel,
		tradeModel,
	)

	// 初始化 COS 服务
	var cosService *cos.CosService
	if c.Cos.SecretID != "" && c.Cos.SecretKey != "" {
		cosService = cos.NewCosService(c)
	}

	return &ServiceContext{
		Config: c,
		DB:     db,
		Redis:  rdb,

		// 初始化 Models
		UserModel:     model.NewUserModel(db),
		TokenModel:    tokenModel,
		TradeModel:    tradeModel,
		KlineModel:    model.NewKlineModel(db),
		CommentModel:  model.NewCommentModel(db),
		ActivityModel: model.NewActivityModel(db),
		InviteModel:   model.NewInviteModel(db),

		// 初始化 Services
		TokenService: tokenService,
		EventService: eventService,
		CosService:   cosService,
	}
}
