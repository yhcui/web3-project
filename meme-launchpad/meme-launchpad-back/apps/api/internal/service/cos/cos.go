package cos

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/meme-launchpad/api/internal/config"
)

// CosService 腾讯云 COS 服务
type CosService struct {
	secretID  string
	secretKey string
	bucket    string
	region    string
	appID     string
	domain    string
}

// NewCosService 创建 COS 服务
func NewCosService(cfg config.Config) *CosService {
	return &CosService{
		secretID:  cfg.Cos.SecretID,
		secretKey: cfg.Cos.SecretKey,
		bucket:    cfg.Cos.Bucket,
		region:    cfg.Cos.Region,
		appID:     cfg.Cos.AppID,
		domain:    cfg.Cos.Domain,
	}
}

// PresignResult 预签名结果
type PresignResult struct {
	UploadUrl string `json:"uploadUrl"`
	PublicUrl string `json:"publicUrl"`
	FileName  string `json:"fileName"`
	Key       string `json:"key"`
	ExpiresAt int64  `json:"expiresAt"`
}

// GeneratePresignedUrl 生成预签名上传 URL
func (s *CosService) GeneratePresignedUrl(folder string, mimeType string, chainId int) (*PresignResult, error) {
	// 生成唯一文件名
	ext := getExtFromMimeType(mimeType)
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	key := fmt.Sprintf("%s/%d/%s", folder, chainId, fileName)

	// 计算过期时间 (1小时)
	expireTime := time.Now().Add(1 * time.Hour)
	expiresAt := expireTime.Unix()

	// 生成预签名 URL
	uploadUrl, err := s.generatePresignedPutUrl(key, expireTime)
	if err != nil {
		return nil, err
	}

	// 生成公开访问 URL
	publicUrl := s.getPublicUrl(key)

	return &PresignResult{
		UploadUrl: uploadUrl,
		PublicUrl: publicUrl,
		FileName:  fileName,
		Key:       key,
		ExpiresAt: expiresAt,
	}, nil
}

// generatePresignedPutUrl 生成 PUT 预签名 URL
func (s *CosService) generatePresignedPutUrl(key string, expireTime time.Time) (string, error) {
	// COS 主机
	host := fmt.Sprintf("%s.cos.%s.myqcloud.com", s.bucket, s.region)

	// 签名有效期
	startTime := time.Now().Unix()
	endTime := expireTime.Unix()

	// 构建签名
	httpMethod := "put"
	uriPathname := "/" + key

	// 签名算法
	keyTime := fmt.Sprintf("%d;%d", startTime, endTime)
	signKey := hmacSha1(s.secretKey, keyTime)

	// HttpParameters (空)
	httpParameters := ""
	httpParametersList := ""

	// HttpHeaders (空，简化处理)
	httpHeaders := ""
	httpHeadersList := ""

	// 构建 StringToSign
	formatString := fmt.Sprintf("%s\n%s\n%s\n%s\n", httpMethod, uriPathname, httpParameters, httpHeaders)
	stringToSign := fmt.Sprintf("sha1\n%s\n%s\n", keyTime, sha1Hash(formatString))

	// 计算签名
	signature := hmacSha1(signKey, stringToSign)

	// 构建 Authorization
	authorization := fmt.Sprintf(
		"q-sign-algorithm=sha1&q-ak=%s&q-sign-time=%s&q-key-time=%s&q-header-list=%s&q-url-param-list=%s&q-signature=%s",
		s.secretID,
		keyTime,
		keyTime,
		httpHeadersList,
		httpParametersList,
		signature,
	)

	// 构建完整 URL
	uploadUrl := fmt.Sprintf("https://%s%s?%s", host, uriPathname, url.QueryEscape(authorization))

	// 返回简化的预签名 URL (使用查询参数方式)
	params := url.Values{}
	params.Set("q-sign-algorithm", "sha1")
	params.Set("q-ak", s.secretID)
	params.Set("q-sign-time", keyTime)
	params.Set("q-key-time", keyTime)
	params.Set("q-header-list", httpHeadersList)
	params.Set("q-url-param-list", httpParametersList)
	params.Set("q-signature", signature)

	uploadUrl = fmt.Sprintf("https://%s%s?%s", host, uriPathname, params.Encode())

	return uploadUrl, nil
}

// getPublicUrl 获取公开访问 URL
func (s *CosService) getPublicUrl(key string) string {
	if s.domain != "" {
		// 使用自定义域名
		domain := strings.TrimSuffix(s.domain, "/")
		return fmt.Sprintf("%s/%s", domain, key)
	}
	// 使用默认 COS 域名
	return fmt.Sprintf("https://%s.cos.%s.myqcloud.com/%s", s.bucket, s.region, key)
}

// GenerateSTSCredential 生成 STS 临时凭证 (用于前端直传)
func (s *CosService) GenerateSTSCredential(folder string, chainId int, durationSeconds int64) (map[string]interface{}, error) {
	// 这里使用简化的方式，返回预签名 URL
	// 完整的 STS 方案需要调用腾讯云 STS API

	expireTime := time.Now().Add(time.Duration(durationSeconds) * time.Second)
	expiresAt := expireTime.Unix()

	// 生成唯一文件名
	fileName := fmt.Sprintf("%s.png", uuid.New().String())
	key := fmt.Sprintf("%s/%d/%s", folder, chainId, fileName)

	uploadUrl, err := s.generatePresignedPutUrl(key, expireTime)
	if err != nil {
		return nil, err
	}

	publicUrl := s.getPublicUrl(key)

	return map[string]interface{}{
		"uploadUrl": uploadUrl,
		"publicUrl": publicUrl,
		"fileName":  fileName,
		"key":       key,
		"expiresAt": expiresAt,
		"bucket":    s.bucket,
		"region":    s.region,
	}, nil
}

// Helper functions

func hmacSha1(key, data string) string {
	mac := hmac.New(sha1.New, []byte(key))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}

func sha1Hash(data string) string {
	h := sha1.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func getExtFromMimeType(mimeType string) string {
	mimeType = strings.ToLower(mimeType)
	switch mimeType {
	case "png", "image/png":
		return ".png"
	case "jpg", "jpeg", "image/jpeg":
		return ".jpg"
	case "gif", "image/gif":
		return ".gif"
	case "webp", "image/webp":
		return ".webp"
	case "svg", "image/svg+xml":
		return ".svg"
	default:
		return ".png"
	}
}

// base64Encode 用于 STS
func base64Encode(data []byte) string {
	return base64.StdEncoding.EncodeToString(data)
}

// jsonEncode 用于 STS
func jsonEncode(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

