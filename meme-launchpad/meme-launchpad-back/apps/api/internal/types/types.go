package types

// Response 通用响应
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Success 成功响应
func Success(data interface{}) *Response {
	return &Response{
		Code:    200,
		Message: "success",
		Data:    data,
	}
}

// Error 错误响应
func Error(code int, message string) *Response {
	return &Response{
		Code:    code,
		Message: message,
	}
}

// PageResponse 分页响应
type PageResponse struct {
	PageNo    int         `json:"pageNo"`
	PageSize  int         `json:"pageSize"`
	Total     int         `json:"total"`
	TotalPage int         `json:"totalPage"`
	Result    interface{} `json:"result,omitempty"`
	List      interface{} `json:"list,omitempty"`
}

// NewPageResponse 创建分页响应
func NewPageResponse(pageNo, pageSize, total int, data interface{}) *PageResponse {
	totalPage := total / pageSize
	if total%pageSize > 0 {
		totalPage++
	}
	return &PageResponse{
		PageNo:    pageNo,
		PageSize:  pageSize,
		Total:     total,
		TotalPage: totalPage,
		Result:    data,
	}
}

// ==================== 请求/响应类型 ====================

// GetSignMsgRequest 获取签名消息请求
type GetSignMsgRequest struct {
	Address string `form:"address"`
}

// GetSignMsgResponse 获取签名消息响应
type GetSignMsgResponse struct {
	Message string `json:"message"`
	Nonce   string `json:"nonce"`
	Expiry  int64  `json:"expiry"`
}

// WalletLoginRequest 钱包登录请求
type WalletLoginRequest struct {
	Address   string `json:"address"`
	Signature string `json:"signature"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refreshToken"`
	ExpiresIn    int64       `json:"expiresIn"`
	TokenType    string      `json:"tokenType"`
	User         interface{} `json:"user"`
}

// RefreshTokenRequest 刷新令牌请求
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken"`
}

// TokenListRequest 代币列表请求
type TokenListRequest struct {
	PageNo          int    `form:"pn,default=1"`
	PageSize        int    `form:"ps,default=10"`
	Sort            string `form:"sort,optional"`
	LaunchMode      int    `form:"lunchMode,optional"`
	Status          string `form:"status,optional"`
	LaunchTimeStart int64  `form:"launchTimeStart,optional"`
	LaunchTimeEnd   int64  `form:"launchTimeEnd,optional"`
}

// TokenDetailRequest 代币详情请求
type TokenDetailRequest struct {
	TokenAddress string `form:"tokenAddress"`
}

// TokenHoldersRequest 代币持有者请求
type TokenHoldersRequest struct {
	TokenAddress string `form:"tokenAddress"`
	PageNo       int    `form:"pn,default=1"`
	PageSize     int    `form:"ps,default=10"`
}

// CreateTokenRequest 创建代币请求
type CreateTokenRequest struct {
	Name              string    `json:"name"`
	Symbol            string    `json:"symbol"`
	Description       string    `json:"description,optional"`
	LaunchMode        int       `json:"launchMode"`
	LaunchTime        int64     `json:"launchTime"`
	Logo              string    `json:"logo"`
	Banner            string    `json:"banner,optional"`
	Website           string    `json:"website,optional"`
	Twitter           string    `json:"twitter,optional"`
	Telegram          string    `json:"telegram,optional"`
	Discord           string    `json:"discord,optional"`
	Whitepaper        string    `json:"whitepaper,optional"`
	AdditionalLink2   string    `json:"additionalLink2,optional"`
	Tags              []string  `json:"tags,optional"`
	PreBuyPercent     float64   `json:"preBuyPercent"`
	PreBuyUsedPercent []float64 `json:"preBuyUsedPercent,optional"`
	PreBuyUsedType    []int     `json:"preBuyUsedType,optional"`
	PreBuyLockTime    []float64 `json:"preBuyLockTime,optional"`
	PreBuyUsedName    []string  `json:"preBuyUsedName,optional"`
	PreBuyUsedDesc    []string  `json:"preBuyUsedDesc,optional"`
	MarginBnb         float64   `json:"marginBnb"`
	MarginTime        int64     `json:"marginTime"`
	ContractTg        string    `json:"contractTg,optional"`
	ContractEmail     string    `json:"contractEmail,optional"`
	Digits            string    `json:"digits,optional"`
	PredictedAddress  string    `json:"predictedAddress,optional"`
	// IDO模式字段
	TotalFundsRaised  float64 `json:"totalFundsRaised,optional"`
	FundraisingCycle  float64 `json:"fundraisingCycle,optional"`
	PreUserLimit      float64 `json:"preUserLimit,optional"`
	UserLockupTime    float64 `json:"userLockupTime,optional"`
	AddLiquidity      float64 `json:"addLiquidity,optional"`
	ProtocolRevenue   float64 `json:"protocolRevenue,optional"`
	CoreTeam          float64 `json:"coreTeam,optional"`
	CommunityTreasury float64 `json:"communityTreasury,optional"`
	BuybackReserve    float64 `json:"buybackReserve,optional"`
}

// CreateTokenResponse 创建代币响应
type CreateTokenResponse struct {
	Create2Salt      string `json:"create2Salt"`
	CreateArg        string `json:"createArg"`
	Nonce            int    `json:"nonce"`
	PredictedAddress string `json:"predictedAddress"`
	RequestID        string `json:"requestId"`
	Signature        string `json:"signature"`
	Timestamp        int64  `json:"timestamp"`
}

// CalculateAddressRequest 计算地址请求
type CalculateAddressRequest struct {
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
	Digits string `json:"digits,optional"`
}

// CalculateAddressResponse 计算地址响应
type CalculateAddressResponse struct {
	PredictedAddress string `json:"predictedAddress"`
	Salt             string `json:"salt"`
}

// FavoriteTokenRequest 收藏代币请求
type FavoriteTokenRequest struct {
	TokenID int64 `json:"tokenId"`
}

// CommentListRequest 评论列表请求
type CommentListRequest struct {
	TokenID   int64 `form:"tokenId"`
	PageNo    int   `form:"pn,default=1"`
	PageSize  int   `form:"ps,default=20"`
	StartTime int64 `form:"startTime,optional"`
}

// PostCommentRequest 发布评论请求
type PostCommentRequest struct {
	TokenID int64  `json:"tokenId"`
	Content string `json:"content"`
}

// PostImgCommentRequest 发布图片评论请求
type PostImgCommentRequest struct {
	TokenID int64  `json:"tokenId"`
	Img     string `json:"img"`
}

// DeleteCommentRequest 删除评论请求
type DeleteCommentRequest struct {
	CommentID int64 `json:"commentId"`
}

// TradeListRequest 交易列表请求
type TradeListRequest struct {
	TokenAddress string  `form:"tokenAddress"`
	PageNo       int     `form:"pn,default=1"`
	PageSize     int     `form:"ps,default=10"`
	OrderBy      string  `form:"orderBy,optional"`
	OrderDesc    bool    `form:"orderDesc,optional"`
	MinUsdAmount float64 `form:"minUsdAmount,optional"`
	MaxUsdAmount float64 `form:"maxUsdAmount,optional"`
}

// KlineHistoryRequest K线历史请求
type KlineHistoryRequest struct {
	TokenAddr string `form:"tokenAddr"`
	Interval  string `form:"interval"`
	From      int64  `form:"from"`
	To        int64  `form:"to"`
}

// KlineHistoryWithCursorRequest 带游标的K线请求
type KlineHistoryWithCursorRequest struct {
	TokenAddr string `form:"tokenAddr"`
	Interval  string `form:"interval"`
	Cursor    string `form:"cursor,optional"`
	Limit     int    `form:"limit,optional"`
}

// PresignRequest 预签名上传请求
type PresignRequest struct {
	MimeType string `form:"mimeType"`
	ChainID  int    `form:"chainId"`
}

// UploadConfirmRequest 确认上传请求
type UploadConfirmRequest struct {
	Key         string            `json:"key"`
	UploadedUrl string            `json:"uploadedUrl"`
	Metadata    map[string]string `json:"metadata,optional"`
}

// UserStatusRequest 用户状态请求
type UserStatusRequest struct {
	Address string `form:"address"`
}

// UserInvitesRequest 用户邀请列表请求
type UserInvitesRequest struct {
	Address string `form:"address"`
	Page    int    `form:"page,default=1"`
	Size    int    `form:"size,default=10"`
}

// CreateEventRequest 创建活动请求
type CreateEventRequest struct {
	Name                  string `json:"name"`
	Description           string `json:"description"`
	CategoryType          int    `json:"categoryType"`
	PlayType              int    `json:"playType"`
	RewardTokenType       int    `json:"rewardTokenType"`
	RewardAmount          string `json:"rewardAmount"`
	RewardSlots           string `json:"rewardSlots"`
	StartAt               string `json:"startAt"`
	EndAt                 string `json:"endAt"`
	CoverImage            string `json:"coverImage"`
	TokenID               int64  `json:"tokenId"`
	InitiatorType         int    `json:"initiatorType"`
	AudienceType          int    `json:"audienceType"`
	MinDailyTradeAmount   string `json:"minDailyTradeAmount,optional"`
	InviteMinCount        string `json:"inviteMinCount,optional"`
	InviteeMinTradeAmount string `json:"inviteeMinTradeAmount,optional"`
	HeatVoteTarget        string `json:"heatVoteTarget,optional"`
	CommentMinCount       string `json:"commentMinCount,optional"`
	RewardTokenID         int64  `json:"rewardTokenId,optional"`
	RewardTokenAddress    string `json:"rewardTokenAddress,optional"`
}

// UserActivityListRequest 用户活动列表请求
type UserActivityListRequest struct {
	PageNo    int    `form:"pn,default=1"`
	PageSize  int    `form:"ps,default=10"`
	UserID    int64  `form:"userId,optional"`
	Status    int    `form:"status,optional"`
	SortField string `form:"sortField,optional"`
	SortType  string `form:"sortType,optional"`
}

// RankingTokenListRequest 排行榜代币请求
type RankingTokenListRequest struct {
	PageNo      int    `form:"pn,default=1"`
	PageSize    int    `form:"ps,default=10"`
	Platform    int    `form:"platform,optional"`
	Category    string `form:"category,optional"`
	TokenSymbol string `form:"tokenSymbol,optional"`
	PageType    int    `form:"pageType,optional"`
	SortField   string `form:"sortField,optional"`
	SortType    string `form:"sortType,optional"`
}

// OverviewRankingsRequest 概览排行榜请求
type OverviewRankingsRequest struct {
	Top int `form:"top,default=5"`
}

// AdvancedTokenListRequest 高级代币列表请求
type AdvancedTokenListRequest struct {
	PageNo               int     `form:"pn,default=1"`
	PageSize             int     `form:"ps,default=10"`
	VolumeStatisticsType int     `form:"volumeStatisticsType,optional"`
	MarketCapMin         float64 `form:"marketCapMin,optional"`
	MarketCapMax         float64 `form:"marketCapMax,optional"`
	HoldersMin           int     `form:"holdersMin,optional"`
	HoldersMax           int     `form:"holdersMax,optional"`
	VolumeMin            float64 `form:"volumeMin,optional"`
	VolumeMax            float64 `form:"volumeMax,optional"`
	TokenIssuanceMode    int     `form:"tokenIssuanceMode,optional"`
	IsTop10              bool    `form:"isTop10,optional"`
	IsSign               bool    `form:"isSign,optional"`
	IsPancakeV3          bool    `form:"isPancakeV3,optional"`
	SortType             int     `form:"sortType,optional"`
}

// OverviewStatsRequest 概览统计请求
type OverviewStatsRequest struct {
	Address string `form:"address,optional"`
}

// MyTokenListRequest 我的代币列表请求
type MyTokenListRequest struct {
	PageNo    int    `form:"pn,default=1"`
	PageSize  int    `form:"ps,default=10"`
	SortField string `form:"sortField,optional"`
	SortType  string `form:"sortType,optional"`
	Search    string `form:"search,optional"`
}

// PageRequest 分页请求
type PageRequest struct {
	PageNo   int `form:"pn,default=1"`
	PageSize int `form:"ps,default=10"`
}

