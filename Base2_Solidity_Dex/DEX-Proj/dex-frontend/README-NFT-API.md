# NFT API 文档

## zan_getNFTsByOwner 接口

本项目集成了 Zan API 的 `zan_getNFTsByOwner` 接口，用于获取指定地址拥有的NFT。

### API 端点

```
POST /api/nfts
```

### 请求参数

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| owner | string | 是 | - | 钱包地址 |
| tokenType | string | 否 | "ERC721" | 代币类型 ("ERC721" 或 "ERC1155") |
| limit | number | 否 | 100 | 每页返回的NFT数量 |
| page | number | 否 | 1 | 页码 |

### 请求示例

```javascript
const response = await fetch('/api/nfts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    owner: '0xd46c8648f2ac4ce1a1aace620460fbd24f640853',
    tokenType: 'ERC721',
    limit: 20,
    page: 1,
  }),
})

const result = await response.json()
```

### 响应格式

成功响应：
```json
{
  "success": true,
  "data": [
    {
      "contractAddress": "0x...",
      "tokenId": "123",
      "tokenType": "ERC721",
      "name": "NFT Name",
      "symbol": "NFT",
      "tokenUri": "https://...",
      "metadata": {
        "name": "NFT Name",
        "description": "NFT Description",
        "image": "https://...",
        "attributes": [...]
      },
      "balance": "1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 20
  }
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 使用方法

### 1. React Hook

使用提供的 `useNFTs` hook：

```typescript
import { useNFTs } from '@/hooks/useNFTs'

function MyComponent() {
  const { nfts, loading, error, fetchNFTs } = useNFTs({
    tokenType: 'ERC721',
    limit: 50,
    autoFetch: true
  })

  return (
    <div>
      {loading && <p>加载中...</p>}
      {error && <p>错误: {error}</p>}
      {nfts.map(nft => (
        <div key={`${nft.contractAddress}-${nft.tokenId}`}>
          {nft.metadata?.name || nft.name}
        </div>
      ))}
    </div>
  )
}
```

### 2. 直接API调用

```typescript
const fetchNFTs = async (ownerAddress: string) => {
  try {
    const response = await fetch('/api/nfts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        owner: ownerAddress,
        tokenType: 'ERC721',
        limit: 100,
        page: 1,
      }),
    })

    const result = await response.json()
    
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('获取NFT失败:', error)
    throw error
  }
}
```

## 组件示例

项目中包含以下NFT相关组件：

- `NFTGallery`: 完整的NFT画廊组件，支持网格/列表视图、筛选、分页
- `NFTDemo`: API演示组件，可以测试任意地址的NFT查询
- `useNFTs`: React Hook，封装了NFT数据获取逻辑

## 页面路由

- `/nfts` - NFT收藏页面，包含用户NFT画廊和API演示

## 特性

- ✅ 支持 ERC721 和 ERC1155 代币类型
- ✅ 响应式设计，支持暗黑模式
- ✅ 图片懒加载和错误处理
- ✅ 分页加载
- ✅ 按合约地址筛选
- ✅ 网格和列表视图切换
- ✅ TypeScript 类型支持

## 注意事项

1. 该API调用的是以太坊主网数据
2. 需要有效的以太坊地址
3. 图片资源可能来自不同的IPFS或HTTP源
4. 部分NFT可能没有metadata或图片
5. API调用有频率限制，请适度使用

## 错误处理

常见错误及解决方案：

- `缺少owner参数`: 确保传入有效的钱包地址
- `HTTP error! status: 429`: API调用频率过高，请稍后重试
- `获取NFT失败`: 网络问题或API服务不可用 