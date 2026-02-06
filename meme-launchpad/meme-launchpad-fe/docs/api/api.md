# 全局公共参数

**全局Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**全局Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**全局Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**全局认证方式**

> 无需认证

# 状态码说明

| 状态码   | 中文描述 |
| -------- | -------- |
| 暂无参数 |

# CoinRoll

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-18 14:11:27

> 更新时间: 2025-07-20 17:54:03

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> Bearer Token

> 在Header添加参数 Authorization，其值为在Bearer之后拼接空格和访问令牌

> Authorization: Bearer your_access_token

**Query**

## 用户

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-18 14:28:57

> 更新时间: 2025-07-18 14:28:57

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> 继承父级

**Query**

### 获取登录签名

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-18 14:29:13

> 更新时间: 2025-07-20 18:06:14

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/user/sign-msg?address=0x7f53be9fd432bd2dc936b06cc986986aacc55cde

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/user/sign-msg?apipost_id=3b2807ff3a60f7

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名  | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------- | ------------------------------------------ | -------- | -------- | -------- |
| address | 0x7f53be9fd432bd2dc936b06cc986986aacc55cde | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 登录

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-18 14:32:01

> 更新时间: 2025-07-19 00:28:08

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/user/wallet-login

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/user/wallet-login?apipost_id=3b28c8b5fa6157

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "address": "0x7f53be9fd432bd2dc936b06cc986986aacc55cde",
    "signature": "f09b55ff9483d996b6eae49b6c5e7951926b050eb3c6df34203728f3ca4000b501999e71b7d24bf33998bd6594ecd9a62694e07311a72947d5e13246c30945f600"
}
```

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg3ZjUzYmU5ZmQ0MzJiZDJkYzkzNmIwNmNjOTg2OTg2YWFjYzU1Y2RlIiwiZXhwIjoxNzU0MTE3MTY4LCJpYXQiOjE3NTI4MjExNjgsImlkIjoyLCJpc3MiOiJjb2lucm9sbCIsIm5iZiI6MTc1MjgyMTE2OH0.LxgF8ruz7K5xjvYAGaF8GERZRVLnpEkgkC8DJjBHNHFnNGcZQGpCYIjIbNTZGyFdAHEEQdlOtRitvlzWI4oqz6v7Vv93bP2-qkq1GxHqj-m2eVnISYLONH7Np8BpMWQ3Y8Ocxu2zCxRocwaL2YNpWhdeLb0qM2qbA1wCZo0eqkPstBCWLCILi87xqrvCFbOdQNDWc9XQww3wrww7YilCQlDbdqrsVnPdgGCRPVn35-EgPo8RXoSpMYwWdGCQIPeowRyxgSDGlwgdFldIisKtpo0UsmQ8sS9CDw7u8yPUuplb85DxcgZ_31JGyugqqguV4a6CaBdeh4vfNgnDMnzueA"
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

## Token

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 01:34:10

> 更新时间: 2025-07-21 00:24:24

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> 继承父级

**Query**

### 创建Token

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 01:34:29

> 更新时间: 2025-08-01 12:51:18

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/create-token

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/token/create-token?apipost_id=3d09fa267a620c

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "name": "Demo Token16",
    "symbol": "DEMO11",
    "description": "这是一个演示代币，用于测试平台功能",
    "launchMode": "1",
    "launchTime": 0,
    "logo": "https://static.coinroll.io/images/demo-logo.png",
    "banner": "https://static.coinroll.io/images/demo-banner.jpg",
    "website": "https://demo.com",
    "twitter": "https://x.com/demo",
    "telegram": "https://t.me/demo",
    "discord": "https://discord.gg/demo",
    "additionalLink1": "https://medium.com/@demo",
    "additionalLink2": "https://github.com/demo",
    "tags": [
        "meme",
        "ai"
    ],
    "preBuyPercent": 0.1456,
    "preBuyUsedPercent": [
        0.5,
        0.5
    ],
    "preBuyUsedType": [
        1,
        2
    ],
    "preBuyUsedDesc": [
        "砸盘",
        "砸盘"
    ],
    "marginBnb": 100,
    "marginTime": 60,
    "digits": "abcd",
    "predictedAddress": "0x422da096ffd3796e704d1b283fa4edf23b80abcd"
}
```

| 参数名            | 示例值                                            | 参数类型 | 是否必填 | 参数描述           |
| ----------------- | ------------------------------------------------- | -------- | -------- | ------------------ |
| name              | Demo Token16                                      | string   | 是       | 用户名             |
| symbol            | DEMO11                                            | string   | 是       | -                  |
| description       | 这是一个演示代币，用于测试平台功能                | string   | 是       | -                  |
| launchMode        | 1                                                 | string   | 是       | -                  |
| launchTime        | 0                                                 | number   | 是       | -                  |
| logo              | https://static.coinroll.io/images/demo-logo.png   | string   | 是       | -                  |
| banner            | https://static.coinroll.io/images/demo-banner.jpg | string   | 是       | -                  |
| website           | https://demo.com                                  | string   | 是       | -                  |
| twitter           | https://x.com/demo                                | string   | 是       | -                  |
| telegram          | https://t.me/demo                                 | string   | 是       | -                  |
| discord           | https://discord.gg/demo                           | string   | 是       | -                  |
| additionalLink1   | https://medium.com/@demo                          | string   | 是       | -                  |
| additionalLink2   | https://github.com/demo                           | string   | 是       | -                  |
| tags              | -                                                 | array    | 是       | -                  |
| preBuyPercent     | 0.1456                                            | number   | 是       | -                  |
| preBuyUsedPercent | -                                                 | array    | 是       | 预购各个部分百分比 |
| preBuyUsedType    | -                                                 | array    | 是       | 预购使用类型       |
| preBuyUsedDesc    | -                                                 | array    | 是       | 预购使用描述       |
| marginBnb         | 100                                               | number   | 是       | 保证金             |
| marginTime        | 60                                                | number   | 是       | 保证时间，分钟     |
| digits            | abcd                                              | string   | 是       | 后缀               |
| predictedAddress  | 0x422da096ffd3796e704d1b283fa4edf23b80abcd        | string   | 是       | 提前计算的地址     |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 创建IDO Token

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-01 01:59:46

> 更新时间: 2025-08-01 12:51:22

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/create-token

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/token/create-token?apipost_id=c82d6a23a6584

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "name": "Demo Token16",
    "symbol": "DEMO11",
    "description": "这是一个演示代币，用于测试平台功能",
    "launchMode": "1",
    "launchTime": 0,
    "logo": "https://static.coinroll.io/images/demo-logo.png",
    "banner": "https://static.coinroll.io/images/demo-banner.jpg",
    "website": "https://demo.com",
    "twitter": "https://x.com/demo",
    "telegram": "https://t.me/demo",
    "discord": "https://discord.gg/demo",
    "additionalLink1": "https://medium.com/@demo",
    "additionalLink2": "https://github.com/demo",
    "tags": [
        "meme",
        "ai"
    ],
    "preBuyPercent": 0.14,
    "preBuyUsedPercent": [
        0.5,
        0.5
    ],
    "preBuyUsedType": [
        1,
        2
    ],
    "preBuyUsedDesc": [
        "砸盘",
        "砸盘"
    ],
    "marginBnb": 100,
    "marginTime": 60,
    "digits": "abcd",
    "predictedAddress": "0xf9c21f45c8075e5b2160f64b0ec0b6557720abcd",
    "totalFundsRaised": 50,
    "fundraisingCycle": 60,
    "preUserLimit": 1.3,
    "userLockupTime": 24,
    "addLiquidity": 0.65,
    "protocolRevenue": 0.03,
    "coreTeam": 0.04,
    "communityTreasury": 0.4,
    "buybackReserve": 0.1
}
```

| 参数名            | 示例值                                            | 参数类型 | 是否必填 | 参数描述           |
| ----------------- | ------------------------------------------------- | -------- | -------- | ------------------ |
| name              | Demo Token16                                      | string   | 是       | 用户名             |
| symbol            | DEMO11                                            | string   | 是       | -                  |
| description       | 这是一个演示代币，用于测试平台功能                | string   | 是       | -                  |
| launchMode        | 1                                                 | string   | 是       | -                  |
| launchTime        | 0                                                 | number   | 是       | -                  |
| logo              | https://static.coinroll.io/images/demo-logo.png   | string   | 是       | -                  |
| banner            | https://static.coinroll.io/images/demo-banner.jpg | string   | 是       | -                  |
| website           | https://demo.com                                  | string   | 是       | -                  |
| twitter           | https://x.com/demo                                | string   | 是       | -                  |
| telegram          | https://t.me/demo                                 | string   | 是       | -                  |
| discord           | https://discord.gg/demo                           | string   | 是       | -                  |
| additionalLink1   | https://medium.com/@demo                          | string   | 是       | -                  |
| additionalLink2   | https://github.com/demo                           | string   | 是       | -                  |
| tags              | -                                                 | array    | 是       | -                  |
| preBuyPercent     | 0.14                                              | number   | 是       | -                  |
| preBuyUsedPercent | -                                                 | array    | 是       | 预购各个部分百分比 |
| preBuyUsedType    | -                                                 | array    | 是       | 预购使用类型       |
| preBuyUsedDesc    | -                                                 | array    | 是       | 预购使用描述       |
| marginBnb         | 100                                               | number   | 是       | 保证金             |
| marginTime        | 60                                                | number   | 是       | 保证时间，分钟     |
| digits            | abcd                                              | string   | 是       | 后缀               |
| predictedAddress  | 0xf9c21f45c8075e5b2160f64b0ec0b6557720abcd        | string   | 是       | -                  |
| totalFundsRaised  | 50                                                | number   | 是       | -                  |
| fundraisingCycle  | 60                                                | number   | 是       | 小时               |
| preUserLimit      | 1.3                                               | number   | 是       | -                  |
| userLockupTime    | 24                                                | number   | 是       | 小时               |
| addLiquidity      | 0.65                                              | number   | 是       | -                  |
| protocolRevenue   | 0.03                                              | number   | 是       | -                  |
| coreTeam          | 0.04                                              | number   | 是       | -                  |
| communityTreasury | 0.4                                               | number   | 是       | -                  |
| buybackReserve    | 0.1                                               | number   | 是       | -                  |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 获取交易记录

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-21 12:09:03

> 更新时间: 2025-07-21 12:51:25

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/trade/list?tokenAddress=

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/trade/list?apipost_id=3ee4d24bba6709

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------ | -------- | -------- | -------- |
| tokenAddress | -      | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 获取Token详情

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-21 12:18:16

> 更新时间: 2025-07-21 12:22:49

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/detail?tokenAddress=0x7f53be9fd432bd2dc936b06cc986986aacc55cde

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/token/detail?apipost_id=3ee6ee92fa6736

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------------ | -------- | -------- | -------- |
| tokenAddress | 0x7f53be9fd432bd2dc936b06cc986986aacc55cde | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 计算地址

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-31 21:56:42

> 更新时间: 2025-08-01 00:45:02

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/calculate-address

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/token/calculate-address?apipost_id=c4b329dba652d

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "name": "Demo Token16",
    "symbol": "DEMO11",
    "digits": "abcd"
}
```

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 查询token列表

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-04 02:10:51

> 更新时间: 2025-08-04 10:01:22

```text
暂无描述
```

**接口状态**

> 开发中

**接口URL**

> api/v1/token/token-list

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/token/token-list?apipost_id=106221ce3a66ff

**请求方式**

> GET

**Content-Type**

> none

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "pageSize": 10,
        "pageNo": 1,
        "total": 3,
        "totalPage": 1,
        "result": [
            {
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-07-29T03:14:21+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "hot": 0,
                "launchMode": 1,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "name": "Demo Token16",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "0",
                "tokenLaunchReservation": null
            },
            {
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-07-23T16:43:35+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "hot": 0,
                "launchMode": 1,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "name": "Demo Token11",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "tokenLaunchReservation": null
            },
            {
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-07-23T16:16:08+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "hot": 0,
                "launchMode": 1,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "name": "Demo Token11",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "0",
                "tokenLaunchReservation": null
            }
        ]
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

## 文件

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 17:46:15

> 更新时间: 2025-07-20 17:46:15

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> 继承父级

**Query**

### 获取到LOGO文件上传路径

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 17:49:45

> 更新时间: 2025-07-20 17:55:58

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/file/token-logo-presign?mimeType=jpg&chainId=97

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/file/token-logo-presign?apipost_id=3de93bfa7a6340

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| mimeType | jpg    | string   | 是       | -        |
| chainId  | 97     | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "fileName": "token/logo/97/cbc819f039.jpg",
        "uploadUrl": "https://token.PqbWB1ICYCGEvR4v-VjeQpKxTZHc2tvQ4UrdsDoL.r2.cloudflarestorage.com/token/logo/97/cbc819f039.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256\u0026X-Amz-Credential=572347eec9fd41661d9cafab6ac4a1d3%2F20250720%2Fauto%2Fs3%2Faws4_request\u0026X-Amz-Date=20250720T085455Z\u0026X-Amz-Expires=900\u0026X-Amz-SignedHeaders=host\u0026x-id=PutObject\u0026X-Amz-Signature=9aab9fdc369ced80b2f12622c44ad22ead0e67373164b740050717095defb12b"
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 获取到BANNER文件上传路径

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 17:55:39

> 更新时间: 2025-07-20 17:56:12

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/file/token-banner-presign?mimeType=jpg&chainId=97

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/file/token-banner-presign?apipost_id=3dea99637a6426

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| mimeType | jpg    | string   | 是       | -        |
| chainId  | 97     | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "fileName": "token/logo/97/cbc819f039.jpg",
        "uploadUrl": "https://token.PqbWB1ICYCGEvR4v-VjeQpKxTZHc2tvQ4UrdsDoL.r2.cloudflarestorage.com/token/logo/97/cbc819f039.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256\u0026X-Amz-Credential=572347eec9fd41661d9cafab6ac4a1d3%2F20250720%2Fauto%2Fs3%2Faws4_request\u0026X-Amz-Date=20250720T085455Z\u0026X-Amz-Expires=900\u0026X-Amz-SignedHeaders=host\u0026x-id=PutObject\u0026X-Amz-Signature=9aab9fdc369ced80b2f12622c44ad22ead0e67373164b740050717095defb12b"
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

## 评论

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 18:53:18

> 更新时间: 2025-07-20 18:53:18

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> 继承父级

**Query**

### 发布评论

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 18:53:33

> 更新时间: 2025-07-20 19:13:26

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/comment/post-comment

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/comment/post-comment?apipost_id=3df7cee4fa64df

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "tokenId": 1,
    "content": "测试"
}
```

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "commentId": 358747281653792
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 获取评论列表

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 19:13:43

> 更新时间: 2025-07-20 19:15:39

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/comment/list?tokenId=1&pn=&ps=

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/comment/list?apipost_id=3dfc6cb83a65cc

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名  | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| ------- | ------ | -------- | -------- | -------- |
| tokenId | 1      | string   | 是       | -        |
| pn      | -      | string   | 是       | -        |
| ps      | -      | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "comments": [
            {
                "content": "测试",
                "holdingAmount": "0",
                "id": 358747281653792,
                "walletAddress": "0x7f53be9fd432bd2dc936b06cc986986aacc55cde"
            }
        ]
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 删除评论

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 21:21:18

> 更新时间: 2025-07-20 21:22:41

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/comment/delete

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/comment/delete?apipost_id=3e19978f3a6693

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "commentId": 1
}
```

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

## K线

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-25 14:49:55

> 更新时间: 2025-07-25 14:50:00

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> 继承父级

**Query**

### 获取历史K线

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-25 14:50:32

> 更新时间: 2025-07-26 18:57:05

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/kline/history?tokenAddr=0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77&interval=1m&from=2025-07-15 14:20:15&to=2025-07-25 14:20:15

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/kline/history?apipost_id=43023dafa6031

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名    | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| --------- | ------------------------------------------ | -------- | -------- | -------- |
| tokenAddr | 0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77 | string   | 是       | -        |
| interval  | 1m                                         | string   | 是       | -        |
| from      | 2025-07-15 14:20:15                        | string   | 是       | -        |
| to        | 2025-07-25 14:20:15                        | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "s": "",
        "t": [
            1753329780,
            1753329840,
            1753332900,
            1753333020,
            1753333042,
            1753345920,
            1753346040,
            1753346260,
            1753347960,
            1753348020,
            1753349520,
            1753349640,
            1753378380,
            1753378560,
            1753378620,
            1753378800,
            1753419509
        ],
        "o": [
            "0.0000000078498431",
            "0.0000000078687148",
            "0.0000000078761466",
            "0.0000000078984543",
            "0.0000000078721179",
            "0.0000000079173843",
            "0.0000000079363369",
            "0.0000000079553122",
            "0.0000000079702109",
            "0.0000000079892266",
            "0.000000008008265",
            "0.0000000080157263",
            "0.0000000080912672",
            "0.0000000080987456",
            "0.0000000080945449",
            "0.0000000080903476",
            "0.000000008105302"
        ],
        "h": [
            "0.0000000078498431",
            "0.0000000078687148",
            "0.0000000078761466",
            "0.0000000078984543",
            "0.000000007879547",
            "0.0000000079173843",
            "0.0000000079363369",
            "0.0000000079627625",
            "0.0000000079702109",
            "0.0000000079892266",
            "0.000000008008265",
            "0.0000000080157263",
            "0.0000000080912672",
            "0.0000000080987456",
            "0.0000000080945449",
            "0.0000000080903476",
            "0.000000008105302"
        ],
        "l": [
            "0.0000000078498431",
            "0.0000000078687148",
            "0.0000000078761466",
            "0.0000000078984543",
            "0.0000000078721179",
            "0.0000000079173843",
            "0.0000000079363369",
            "0.0000000079553122",
            "0.0000000079702109",
            "0.0000000079892266",
            "0.000000008008265",
            "0.0000000080157263",
            "0.0000000080912672",
            "0.0000000080987456",
            "0.0000000080945449",
            "0.0000000080903476",
            "0.0000000080978223"
        ],
        "c": [
            "0.0000000078498431",
            "0.0000000078687148",
            "0.0000000078761466",
            "0.0000000078984543",
            "0.000000007879547",
            "0.0000000079173843",
            "0.0000000079363369",
            "0.0000000079627625",
            "0.0000000079702109",
            "0.0000000079892266",
            "0.000000008008265",
            "0.0000000080157263",
            "0.0000000080912672",
            "0.0000000080987456",
            "0.0000000080945449",
            "0.0000000080903476",
            "0.0000000080978223"
        ],
        "v": [
            "1273910.8137693190703599",
            "1270855.570671705551032",
            "270855",
            "1266070.5029540564890889",
            "1539963.4964300270883357",
            "1263043.4049660353389623",
            "1260027.1504272690913224",
            "1527876.6876093746834974",
            "1254671.9472446413716388",
            "1251685.6128268994409608",
            "1248709.9277176982130501",
            "270855",
            "0.0000000000012359",
            "270855",
            "270855",
            "270855",
            "270855.0000000000012349"
        ]
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 长链接

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-21 01:25:06

> 更新时间: 2025-07-25 20:46:56

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/kline/conn?connectionId=f429fe4a-9928-4947-ad98-ce230525d7df

**请求Query参数**

| 参数名       | 示例值                               | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------ | -------- | -------- | -------- |
| connectionId | f429fe4a-9928-4947-ad98-ce230525d7df | string   | 是       | -        |

**设置**

| 启用服务器证书验证 | 否 |
| 最大内容大小 | 5 |
| 连接超时设置 | 0 |

**Socket消息**

> PING

- 请求(json)

```javascript
{
  "type": "ping",
  "requestId": "ping_001",
  "timestamp": 1640995200,
  "data": {
    "clientTime": 1640995200000
  }
}
```

- 响应(text)

```javascript
暂无数据
```

> 订阅

- 请求(json)

```javascript
{
  "type": "subscribe",
  "requestId": "sub_001",
  "timestamp": 1640995200,
  "data": {
    "tokens": [
      "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77"
    ],
    "channels": ["kline"],
    "intervals": ["1m"],
    "options": {
      "realTimeOnly": false
    }
  }
}
```

- 响应(text)

```javascript
暂无数据
```

> 取消订阅

- 请求(json)

```javascript
{
    "type": "unsubscribe",
    "requestId": "unsub_001",
    "timestamp": 1640995200,
    "data": {
        "tokens": [
            "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77"
        ],
        "channels": [
            "kline"
        ]
    }
}
```

- 响应(text)

```javascript
暂无数据
```

**Query**

## K线测试

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-22 18:36:15

> 更新时间: 2025-07-22 18:36:15

```text
暂无描述
```

**目录Header参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Query参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录Body参数**

| 参数名   | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| -------- | ------ | -------- | -------- | -------- |
| 暂无参数 |

**目录认证信息**

> 继承父级

**Query**

### K线测试

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-22 18:37:01

> 更新时间: 2025-07-22 18:38:28

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/kline/test-publish?event_type=

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/kline/test-publish?apipost_id=872ca47a6938

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名     | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| ---------- | ------ | -------- | -------- | -------- |
| event_type | -      | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### K线更新

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-22 18:39:14

> 更新时间: 2025-07-22 18:40:19

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/kline/test-publish

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/kline/test-publish?apipost_id=87b530ba6993

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名     | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| ---------- | ------ | -------- | -------- | -------- |
| symbol     | -      | string   | 是       | -        |
| price      | -      | string   | 是       | -        |
| volume     | -      | string   | 是       | -        |
| interval   | -      | string   | 是       | -        |
| trade_type | -      | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### K线测试

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-22 18:42:00

> 更新时间: 2025-07-22 18:43:50

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/kline/test-simulate-trading

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/kline/test-simulate-trading?apipost_id=885b3bba6aa0

**请求方式**

> GET

**Content-Type**

> none

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### rabbitMq状态

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-22 18:41:12

> 更新时间: 2025-07-22 18:42:42

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/kline/test-stats

| 环境       | URL                          |
| ---------- | ---------------------------- |
| 测试服务器 | https://api-dev.coinroll.io/ |

**Mock URL**

> /v1/kline/test-stats?apipost_id=881cb4ba6a9b

**请求方式**

> GET

**Content-Type**

> none

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(404)

```javascript
暂无数据
```

**Query**
