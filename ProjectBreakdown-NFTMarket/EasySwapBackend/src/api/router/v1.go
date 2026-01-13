package router

import (
	"github.com/gin-gonic/gin"

	"github.com/ProjectsTask/EasySwapBackend/src/api/middleware"
	v1 "github.com/ProjectsTask/EasySwapBackend/src/api/v1"
	"github.com/ProjectsTask/EasySwapBackend/src/service/svc"
)

func loadV1(r *gin.Engine, svcCtx *svc.ServerCtx) {
	apiV1 := r.Group("/api/v1")

	/*
		钱包连接 + 签名验证。这叫Sign-In with Ethereum (SIWE)，基于EIP-4361标准
		一、连接钱包（Connect Wallet）
		1、用户点击“Connect Wallet”按钮。
		2、前端使用库（如ethers.js、web3.js 或 viem）调用钱包的API（通过浏览器注入的window.ethereum）。
		3、钱包弹出确认窗口，用户批准连接。
		4、应用获取用户的公钥地址（如0x123...abc），但不获取私钥（私钥永远留在用户设备）。
		二、签名消息（Sign Message 或 SIWE）
		1、服务器生成一个Nonce（随机数，防止重放攻击）和标准化消息（包含域名、时间、链ID等）。 /:address/login-message
		2、用户用钱包签名这个消息（钱包弹出“Sign”提示，用户确认）。
		3、签名不消耗Gas费（只是本地计算）。
		4、前端把签名发给后端，后端用公钥验证签名是否匹配消息。/login 接口
		5、验证通过 → 登录成功，后端颁发JWT/Session Token，让用户在应用中操作。

		后端也拿不到私钥，后端如何验证？
		后端确实永远拿不到私钥，但它仍然能100%可靠地验证签名是否由这个地址的持有者发出。这完全依赖**椭圆曲线数字签名算法（ECDSA）**的数学原理——这是以太坊、比特币等区块链的核心加密机制。
		核心原理：公钥加密的“签名-验证”机制

		私钥 → 可以生成签名（只有私钥持有者能做）
		公钥（即钱包地址的来源） → 可以验证签名（任何人都能做，不需要私钥）

		后端做的事：
		从地址恢复出公钥（以太坊地址本身就是公钥的Keccak-256哈希的最后20字节）
		用ECDSA算法验证：给定“原始消息 + 签名”，是否能匹配这个公钥
		如果匹配 → 证明这个签名一定是这个地址的私钥持有者发出的（数学上不可能伪造）
		额外检查Nonce是否正确、未过期、未重复使用，以及域名、链ID等是否匹配

	*/
	user := apiV1.Group("/user")
	{
		// 作用：获取需要签名的消息
		user.GET("/:address/login-message", v1.GetLoginMessageHandler(svcCtx)) // 生成login签名信息 -- DONE
		// 前端签完名后，调用login，验证签名是否正确。
		user.POST("/login", v1.UserLoginHandler(svcCtx))                 // 登陆 -- TODO 如何验证需要详细了解
		user.GET("/:address/sig-status", v1.GetSigStatusHandler(svcCtx)) // 获取用户签名状态 -- DONE

	}

	collections := apiV1.Group("/collections")
	{
		// 接口定义： 路由 + 中间件 + 处理函数
		collections.GET("/:address", v1.CollectionDetailHandler(svcCtx))                  // 指定Collection详情 -- DONE
		collections.GET("/:address/bids", v1.CollectionBidsHandler(svcCtx))               // 指定Collection的bids信息 -- DONE
		collections.GET("/:address/:token_id/bids", v1.CollectionItemBidsHandler(svcCtx)) // 指定Item的bid信息 -- 这个方法有疑问 -- DONE
		collections.GET("/:address/items", v1.CollectionItemsHandler(svcCtx))             // 指定Collection的items信息 -- TODO

		collections.GET("/:address/:token_id", v1.ItemDetailHandler(svcCtx))                                                  // 获取NFT Item的详细信息 -- TODO
		collections.GET("/:address/:token_id/traits", v1.ItemTraitsHandler(svcCtx))                                           //获取NFT Item的Attribute信息 -- TODO
		collections.GET("/:address/top-trait", v1.ItemTopTraitPriceHandler(svcCtx))                                           //获取NFT Item的Trait的最高价格信息 -- TODO
		collections.GET("/:address/:token_id/image", middleware.CacheApi(svcCtx.KvStore, 60), v1.GetItemImageHandler(svcCtx)) // 获取NFT Item的图片信息 -- DONE ob_item_external_sepolia
		collections.GET("/:address/history-sales", v1.HistorySalesHandler(svcCtx))                                            // NFT销售历史价格信息 -- DONE 查询 ob_activity_sepolia
		collections.GET("/:address/:token_id/owner", v1.ItemOwnerHandler(svcCtx))                                             // 获取NFT Item的owner信息 -- DONE 底层调用eth client
		collections.POST("/:address/:token_id/metadata", v1.ItemMetadataRefreshHandler(svcCtx))                               // 刷新NFT Item的metadata -- DONE 这个方法的后续在哪里？ -- 已整理

		collections.GET("/ranking", middleware.CacheApi(svcCtx.KvStore, 60), v1.TopRankingHandler(svcCtx)) // 获取NFT集合排名信息 -- Done
	}

	activities := apiV1.Group("/activities")
	{
		activities.GET("", v1.ActivityMultiChainHandler(svcCtx)) // 批量获取activity信息 -- 就是根据各种条件查活动条
	}

	portfolio := apiV1.Group("/portfolio")
	{

		portfolio.GET("/collections", v1.UserMultiChainCollectionsHandler(svcCtx)) // 获取用户拥有Collection信息-- DONE
		portfolio.GET("/items", v1.UserMultiChainItemsHandler(svcCtx))             // 查询用户拥有nft的Item基本信息-- TODO 1
		portfolio.GET("/listings", v1.UserMultiChainListingsHandler(svcCtx))       // 查询用户挂单的Listing信息-- TODO 1
		portfolio.GET("/bids", v1.UserMultiChainBidsHandler(svcCtx))               // 查询用户挂单的Bids信息-- TODO
	}

	orders := apiV1.Group("/bid-orders")
	{
		orders.GET("", v1.OrderInfosHandler(svcCtx)) // 批量查询出价信息
	}
}
