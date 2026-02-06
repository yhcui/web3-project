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

> 创建时间: 2025-07-18 13:11:27

> 更新时间: 2025-07-20 16:54:03

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

## Token

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-20 00:34:10

> 更新时间: 2025-07-20 23:24:24

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

> 创建时间: 2025-07-20 00:34:29

> 更新时间: 2025-08-15 13:56:07

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/create-token

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "name": "Burger",
    "symbol": "bge",
    "description": "这是一个演示代币，用于测试平台功能",
    "launchMode": "1",
    "launchTime": 0,
    "logo": "https://static.coinroll.io/token/logo/97/8c81519444.png",
    "banner": "https://static.coinroll.io/token/banner/97/2150c4d117.png",
    "website": "https://demo.com",
    "twitter": "https://x.com/demo",
    "telegram": "https://t.me/demo",
    "discord": "https://discord.gg/demo",
    "whitepaper": "https://medium.com/@demo",
    "additionalLink2": "https://github.com/demo",
    "tags": [
        "meme",
        "ai"
    ],
    "preBuyPercent": 0,
    "preBuyUsedPercent": [
        0.5,
        0.6
    ],
    "preBuyUsedType": [
        1,
        2
    ],
    "preBuyLockTime": [
        1000,
        2000
    ],
    "preBuyUsedDesc": [
        "砸盘",
        "砸盘"
    ],
    "preBuyUsedName":[
        "锁仓",
        "锁仓"
    ],
    "marginBnb": 0,
    "marginTime": 0,
    "digits": "",
    "predictedAddress": "",
    "contactTg": "",
    "contactEmail": ""
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

> 创建时间: 2025-08-01 00:59:46

> 更新时间: 2025-08-08 18:35:05

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/create-token

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
    "whitepaper": "https://medium.com/@demo",
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
    "preBuyLockTime": [
        1000,
        2000
    ],
    "preBuyUsedDesc": [
        "砸盘",
        "砸盘"
    ],
    "preBuyUsedName":[
        "锁仓",
        "锁仓"
    ],
    "marginBnb": 100,
    "marginTime": 60,
    "digits": "abcd",
    "predictedAddress": "0xf9c21f45c8075e5b2160f64b0ec0b6557720abcd",
    "contactTg": "",
    "contactEmail": "",
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

> 创建时间: 2025-07-21 11:09:03

> 更新时间: 2025-08-18 14:28:41

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/trade/list?tokenAddress=0x6a1c4745b8457c300a2befe7cbf05b4e5a7b3e37&ps=&pn=&orderBy=created_at&orderDesc=true&minUsdAmount=&maxUsdAmount=

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述                                                    |
| ------------ | ------------------------------------------ | -------- | -------- | ----------------------------------------------------------- |
| tokenAddress | 0x6a1c4745b8457c300a2befe7cbf05b4e5a7b3e37 | string   | 是       | -                                                           |
| ps           | -                                          | string   | 是       | -                                                           |
| pn           | -                                          | string   | 是       | -                                                           |
| orderBy      | created_at                                 | string   | 是       | created_at，usd_amount,token_amount，bnb_amount，event_type |
| orderDesc    | true                                       | boolean  | 是       | ture ,false                                                 |
| minUsdAmount | -                                          | number   | 是       | -                                                           |
| maxUsdAmount | -                                          | number   | 是       | -                                                           |

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
        "total": 74,
        "totalPage": 8,
        "result": [
            {
                "blockNumber": 60406648,
                "blockTimestamp": "2025-08-02T12:52:45Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:52:45Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1159515393358093967757388",
                "tradeType": 10,
                "transactionHash": "0xc296e918659a676ea7ec32c72c400ef3fdc116263c17e688cad972925c22706d",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60406648,
                "blockTimestamp": "2025-08-02T12:52:43Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:52:44Z",
                "price": "0.0000000086242926",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1159515393358093967757388",
                "tradeType": 10,
                "transactionHash": "0xc296e918659a676ea7ec32c72c400ef3fdc116263c17e688cad972925c22706d",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60406231,
                "blockTimestamp": "2025-08-02T12:47:32Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:47:32Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1162177841601444243510540",
                "tradeType": 10,
                "transactionHash": "0xe0eb986da82a7eeaca018b9d05421830f4bc83b820077469a6d9fe43ab1fb7a1",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60406231,
                "blockTimestamp": "2025-08-02T12:47:30Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:47:31Z",
                "price": "0.0000000086045351",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1162177841601444243510540",
                "tradeType": 10,
                "transactionHash": "0xe0eb986da82a7eeaca018b9d05421830f4bc83b820077469a6d9fe43ab1fb7a1",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60405631,
                "blockTimestamp": "2025-08-02T12:40:00Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:40:02Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1164849470548740583961179",
                "tradeType": 10,
                "transactionHash": "0xe5a550f0bdfd357eb681e525b519e991b515f2717e90e66a7a33e2676e742065",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60405631,
                "blockTimestamp": "2025-08-02T12:40:02Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:40:01Z",
                "price": "8584800200",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1164849470548740583961179",
                "tradeType": 10,
                "transactionHash": "0xe5a550f0bdfd357eb681e525b519e991b515f2717e90e66a7a33e2676e742065",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60405579,
                "blockTimestamp": "2025-08-02T12:39:21Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:39:24Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1167530322457988515569626",
                "tradeType": 10,
                "transactionHash": "0xbf3c92c626585bf336b64b116fa13b57280e4c70f183f5fd53f0e7b465a17381",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60405579,
                "blockTimestamp": "2025-08-02T12:39:23Z",
                "bnbAmount": "10000000000000000",
                "createdAt": "2025-08-02T12:39:23Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "1167530322457988515569626",
                "tradeType": 10,
                "transactionHash": "0xbf3c92c626585bf336b64b116fa13b57280e4c70f183f5fd53f0e7b465a17381",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60405461,
                "blockTimestamp": "2025-08-02T12:37:52Z",
                "bnbAmount": "2317848471999082",
                "createdAt": "2025-08-02T12:37:56Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "270855000000000000000000",
                "tradeType": 20,
                "transactionHash": "0x39a658c8512c88a1fb360fdbdefb988c25e1637f4ffe79790ed34d4e1a425082",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            },
            {
                "blockNumber": 60405461,
                "blockTimestamp": "2025-08-02T12:37:54Z",
                "bnbAmount": "2317848471999082",
                "createdAt": "2025-08-02T12:37:54Z",
                "price": "0",
                "tokenAddress": "0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77",
                "tokenAmount": "270855000000000000000000",
                "tradeType": 20,
                "transactionHash": "0x39a658c8512c88a1fb360fdbdefb988c25e1637f4ffe79790ed34d4e1a425082",
                "userAddress": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd"
            }
        ]
    }
}
```

| 参数名                      | 示例值                                                             | 参数类型 | 参数描述 |
| --------------------------- | ------------------------------------------------------------------ | -------- | -------- |
| code                        | 200                                                                | number   | -        |
| message                     | success                                                            | string   | -        |
| data                        | -                                                                  | object   | -        |
| data.pageSize               | 10                                                                 | number   | -        |
| data.pageNo                 | 1                                                                  | number   | -        |
| data.total                  | 74                                                                 | number   | -        |
| data.totalPage              | 8                                                                  | number   | -        |
| data.result                 | -                                                                  | array    | -        |
| data.result.blockNumber     | 60406648                                                           | number   | -        |
| data.result.blockTimestamp  | 2025-08-02T12:52:45Z                                               | string   | -        |
| data.result.bnbAmount       | 10000000000000000                                                  | string   | -        |
| data.result.createdAt       | 2025-08-02T12:52:45Z                                               | string   | -        |
| data.result.price           | 0                                                                  | string   | -        |
| data.result.tokenAddress    | 0x7e8f0e2BDfc9586Dc2499b2cA2948A7fF7e4Dc77                         | string   | -        |
| data.result.tokenAmount     | 1159515393358093967757388                                          | string   | -        |
| data.result.tradeType       | 10                                                                 | number   | -        |
| data.result.transactionHash | 0xc296e918659a676ea7ec32c72c400ef3fdc116263c17e688cad972925c22706d | string   | -        |
| data.result.userAddress     | 0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd                         | string   | -        |

- 失败(404)

```javascript
暂无数据
```

**Query**

### 获取Token详情

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-21 11:18:16

> 更新时间: 2025-08-18 14:47:48

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/detail?tokenAddress=0x6a1c4745b8457c300a2befe7cbf05b4e5a7b3e37

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------------ | -------- | -------- | -------- |
| tokenAddress | 0x6a1c4745b8457c300a2befe7cbf05b4e5a7b3e37 | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "additionalLink1": "",
        "additionalLink2": "",
        "banner": "https://static.coinroll.io/token/banner/97/f7b3e6ade8.png",
        "bnbCurrent": "0.0074977194436692",
        "bnbTarget": "200",
        "buyCount24H": 4,
        "contactEmail": "",
        "contactTg": "",
        "creatorAddress": "0x4a8898143b6b13c628812fca56ba8673b2ba8aed",
        "currentPrice": "0.0000000076693622",
        "currentPriceUsdt": "0.000006584454223188",
        "description": "川普吃TM的汉堡",
        "discord": "",
        "holdersCount": 2,
        "id": 362799288578080,
        "launchMode": 1,
        "launchTime": 1754984913,
        "logo": "https://static.coinroll.io/token/logo/97/f39109f027.png",
        "marketCap": "7.6693622",
        "marketCapUsdt": "6459.060151218",
        "name": "Crypto Burger",
        "nonce": 10775862,
        "preBuyUsed": [],
        "priceChangePercentage24H": "0",
        "progressPct": "0",
        "sellCount24H": 2,
        "symbol": "BURGER",
        "tags": [],
        "telegram": "",
        "tokenContractAddress": "0x79a57fb299f66cc53e8d7dfe3c5d7dd16ba86666",
        "top10": "0",
        "totalLock": "0",
        "totalSupply": "1000000000",
        "totalVolume24H": "0.1225022805563308",
        "turnoverRate": "1.59729423857868",
        "twitter": "",
        "website": ""
    }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 计算地址

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-07-31 20:56:42

> 更新时间: 2025-08-05 11:54:13

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/calculate-address

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "name": "Bai",
    "symbol": "BAI",
    "digits": "1122"
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

> 创建时间: 2025-08-04 01:10:51

> 更新时间: 2025-08-11 22:55:52

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/token-list?pn=1&ps=10&sort=2&lunchMode=&status=&launchTimeStart=&launchTimeEnd=

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名          | 示例值 | 参数类型 | 是否必填 | 参数描述                                                              |
| --------------- | ------ | -------- | -------- | --------------------------------------------------------------------- |
| pn              | 1      | number   | 是       | -                                                                     |
| ps              | 10     | number   | 是       | -                                                                     |
| sort            | 2      | number   | 是       | 1 newest 2 full Raised 3 hot 4.Market Cap 5.Trade Volume 6.holder cnt |
| lunchMode       | -      | number   | 是       | -                                                                     |
| status          | -      | number   | 是       | 20 已创建 30 已发射                                                   |
| launchTimeStart | -      | number   | 是       | 时间戳                                                                |
| launchTimeEnd   | -      | number   | 是       | 时间戳                                                                |

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
        "total": 22,
        "totalPage": 3,
        "result": [
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "https://static.coinroll.io/token/banner/97/4c59652cfa.png",
                "createdAt": "2025-08-05T01:41:21+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/fab6335299.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [
                    "",
                    "",
                    "",
                    "ai",
                    "meme",
                    "defi"
                ],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0x17015a7fc384b7f2fcfebd70de9b1f0e01f54321",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:40:46+08:00",
                "currentBnb": "0",
                "desc": "R",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/ed1cbbbd1a.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0xd94c1022f254dff4b224f7917ca2142a4dd42cb0",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:28:29+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/35dc562469.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0x27efd799fc1c082875fd2ca165b71c0c73e11a05",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:25:53+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token3333",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "啊啊啊啊",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0x379ce12627d4b6a3c1780b09da04ab5552801221",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:24:45+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/c73cf6a0b2.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0x09b5500e92822197f66d3b1ed18b9c6a15debd57",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:23:16+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/982f6921b1.png",
                "marginBnb": "0",
                "name": "RRR",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "RRR",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0xf6e8ae9f1e3185e22a84da3818275116462c6b7e",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:18:57+08:00",
                "currentBnb": "0",
                "desc": "RR",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/525f04d9e0.png",
                "marginBnb": "0",
                "name": "RR",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "RR",
                "tags": [],
                "targetBnb": "200",
                "telegram": "",
                "tokenAddr": "0x09Df359E57874B0A2eD161f15218bAC00e7bd932",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:14:48+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token18",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0x5cde4667df1042fcced7fbecf6093b990a9e1111",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:09:34+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token18",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0x3937d1b1455e38e775cfa0f80812aa8da56e1111",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:06:52+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token18",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0xa5310598cfa657207384c46f78e6819a2d011111",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
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

### TrendingToken列表

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-06 11:06:10

> 更新时间: 2025-08-16 11:14:52

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/trending-token?lunchMode=&launchTimeStart=&launchTimeEnd=

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名          | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| --------------- | ------ | -------- | -------- | -------- |
| lunchMode       | -      | string   | 是       | -        |
| launchTimeStart | -      | string   | 是       | -        |
| launchTimeEnd   | -      | string   | 是       | 时间戳   |

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
        "total": 22,
        "totalPage": 3,
        "result": [
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "https://static.coinroll.io/token/banner/97/4c59652cfa.png",
                "createdAt": "2025-08-05T01:41:21+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/fab6335299.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [
                    "",
                    "",
                    "",
                    "ai",
                    "meme",
                    "defi"
                ],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0x17015a7fc384b7f2fcfebd70de9b1f0e01f54321",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:40:46+08:00",
                "currentBnb": "0",
                "desc": "R",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/ed1cbbbd1a.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0xd94c1022f254dff4b224f7917ca2142a4dd42cb0",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:28:29+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/35dc562469.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0x27efd799fc1c082875fd2ca165b71c0c73e11a05",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:25:53+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token3333",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "啊啊啊啊",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0x379ce12627d4b6a3c1780b09da04ab5552801221",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:24:45+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/c73cf6a0b2.png",
                "marginBnb": "0",
                "name": "R",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "R",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0x09b5500e92822197f66d3b1ed18b9c6a15debd57",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:23:16+08:00",
                "currentBnb": "0",
                "desc": "",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/982f6921b1.png",
                "marginBnb": "0",
                "name": "RRR",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "RRR",
                "tags": [],
                "targetBnb": "0",
                "telegram": "",
                "tokenAddr": "0xf6e8ae9f1e3185e22a84da3818275116462c6b7e",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "",
                "additionalLink2": "",
                "banner": "",
                "createdAt": "2025-08-05T01:18:57+08:00",
                "currentBnb": "0",
                "desc": "RR",
                "discord": "",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/token/logo/97/525f04d9e0.png",
                "marginBnb": "0",
                "name": "RR",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "RR",
                "tags": [],
                "targetBnb": "200",
                "telegram": "",
                "tokenAddr": "0x09Df359E57874B0A2eD161f15218bAC00e7bd932",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "",
                "website": ""
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:14:48+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token18",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0x5cde4667df1042fcced7fbecf6093b990a9e1111",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:09:34+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token18",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0x3937d1b1455e38e775cfa0f80812aa8da56e1111",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
            },
            {
                "additionalLink1": "https://medium.com/@demo",
                "additionalLink2": "https://github.com/demo",
                "banner": "https://static.coinroll.io/images/demo-banner.jpg",
                "createdAt": "2025-08-05T01:06:52+08:00",
                "currentBnb": "0",
                "desc": "这是一个演示代币，用于测试平台功能",
                "discord": "https://discord.gg/demo",
                "hot": 0,
                "launchMode": 1,
                "launchTime": 0,
                "lockupTime": "",
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "name": "Demo Token18",
                "preUserLimit": "",
                "progressPct": "0",
                "symbol": "DEMO11",
                "tags": [
                    "",
                    "",
                    "meme",
                    "ai"
                ],
                "targetBnb": "200",
                "telegram": "https://t.me/demo",
                "tokenAddr": "0xa5310598cfa657207384c46f78e6819a2d011111",
                "tokenLaunchReservation": null,
                "tokenLv": 1,
                "tokenRank": 2,
                "twitter": "https://x.com/demo",
                "website": "https://demo.com"
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

### 首页顶部推荐

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-06 11:07:34

> 更新时间: 2025-08-13 09:11:45

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/hot-pick

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
    "data": [
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xcfda986293dc81be024a50ed6788e4bc93b5933f",
            "tokenID": 359322605262880,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token11",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x7e8f0e2bdfc9586dc2499b2ca2948a7ff7e4dc77",
            "tokenID": 359325992871968,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token11",
            "tokenPrice": "0.0000000086242926",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x2141dc6185b6d2b4dd65a926820fc4d0d2e26666",
            "tokenID": 360287194355744,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xF1Ed2a302163c432dc50Cc6C94b65D67D5d532b9",
            "tokenID": 361435705423904,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/2feddce4cb.png",
            "tokenName": "Teset",
            "tokenPrice": "0",
            "tokenSymbol": "TESET"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x5A6Be8fB6853D5Cd30C3225740eE9273969e0008",
            "tokenID": 361442058493984,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xF5f44574EB680AF98503D4E82Ef9406D2b9e34f7",
            "tokenID": 361444386730016,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x1EB4FfF5B9d120a84023F2C1C2ae0e5595284444",
            "tokenID": 361445572878368,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/947778086a.png",
            "tokenName": "R",
            "tokenPrice": "0",
            "tokenSymbol": "RR"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x2c42a3829D79f426299B359D5d580cb90B6606Ee",
            "tokenID": 361445583632416,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/947778086a.png",
            "tokenName": "R",
            "tokenPrice": "0",
            "tokenSymbol": "RR"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x135b9ccebf97187380cba8613b28374fb70babcd",
            "tokenID": 361448056418336,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x15bcaaae36e367c15450e5499f5f366329d4abcd",
            "tokenID": 361449806372896,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x17a9911cc3a579bce11570351ae7a745ec3aabcd",
            "tokenID": 361450262634528,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xbcd9f8fdee89805c9dc28270903c87f33217abcd",
            "tokenID": 361450859184160,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token16",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xa5310598cfa657207384c46f78e6819a2d011111",
            "tokenID": 361452286535712,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token18",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x3937d1b1455e38e775cfa0f80812aa8da56e1111",
            "tokenID": 361452537647136,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token18",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x5cde4667df1042fcced7fbecf6093b990a9e1111",
            "tokenID": 361453268262944,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token18",
            "tokenPrice": "0",
            "tokenSymbol": "DEMO11"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x09Df359E57874B0A2eD161f15218bAC00e7bd932",
            "tokenID": 361453841977376,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/525f04d9e0.png",
            "tokenName": "RR",
            "tokenPrice": "0",
            "tokenSymbol": "RR"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xf6e8ae9f1e3185e22a84da3818275116462c6b7e",
            "tokenID": 361454370983968,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/982f6921b1.png",
            "tokenName": "RRR",
            "tokenPrice": "0",
            "tokenSymbol": "RRR"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x09b5500e92822197f66d3b1ed18b9c6a15debd57",
            "tokenID": 361454551756832,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/c73cf6a0b2.png",
            "tokenName": "R",
            "tokenPrice": "0",
            "tokenSymbol": "R"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x379ce12627d4b6a3c1780b09da04ab5552801221",
            "tokenID": 361454634369056,
            "tokenLogo": "https://static.coinroll.io/images/demo-logo.png",
            "tokenName": "Demo Token3333",
            "tokenPrice": "0",
            "tokenSymbol": "啊啊啊啊"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x27efd799fc1c082875fd2ca165b71c0c73e11a05",
            "tokenID": 361455013773344,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/35dc562469.png",
            "tokenName": "R",
            "tokenPrice": "0",
            "tokenSymbol": "R"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0xd94c1022f254dff4b224f7917ca2142a4dd42cb0",
            "tokenID": 361456482017312,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/ed1cbbbd1a.png",
            "tokenName": "R",
            "tokenPrice": "0",
            "tokenSymbol": "R"
        },
        {
            "isFavorite": false,
            "priceChange": "0",
            "tokenAddr": "0x17015a7fc384b7f2fcfebd70de9b1f0e01f54321",
            "tokenID": 361456595918880,
            "tokenLogo": "https://static.coinroll.io/token/logo/97/fab6335299.png",
            "tokenName": "R",
            "tokenPrice": "0",
            "tokenSymbol": "R"
        }
    ]
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 即将上线

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-06 17:43:41

> 更新时间: 2025-08-06 17:47:53

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/trade/upcoming-token

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
        "pageSize": 30,
        "pageNo": 1,
        "total": 22,
        "totalPage": 1,
        "result": [
            {
                "createdAt": "2025-08-05T00:55:10+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0xbcd9f8fdee89805c9dc28270903c87f33217abcd"
            },
            {
                "createdAt": "2025-08-05T01:41:21+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/fab6335299.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "R",
                "targetBnb": "0",
                "tokenAddr": "0x17015a7fc384b7f2fcfebd70de9b1f0e01f54321"
            },
            {
                "createdAt": "2025-08-05T01:40:46+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/ed1cbbbd1a.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "R",
                "targetBnb": "0",
                "tokenAddr": "0xd94c1022f254dff4b224f7917ca2142a4dd42cb0"
            },
            {
                "createdAt": "2025-08-05T01:28:29+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/35dc562469.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "R",
                "targetBnb": "0",
                "tokenAddr": "0x27efd799fc1c082875fd2ca165b71c0c73e11a05"
            },
            {
                "createdAt": "2025-08-05T01:25:53+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token3333",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "啊啊啊啊",
                "targetBnb": "200",
                "tokenAddr": "0x379ce12627d4b6a3c1780b09da04ab5552801221"
            },
            {
                "createdAt": "2025-08-05T01:24:45+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/c73cf6a0b2.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "R",
                "targetBnb": "0",
                "tokenAddr": "0x09b5500e92822197f66d3b1ed18b9c6a15debd57"
            },
            {
                "createdAt": "2025-08-05T01:23:16+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/982f6921b1.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "RRR",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "RRR",
                "targetBnb": "0",
                "tokenAddr": "0xf6e8ae9f1e3185e22a84da3818275116462c6b7e"
            },
            {
                "createdAt": "2025-08-05T01:18:57+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/525f04d9e0.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "RR",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "RR",
                "targetBnb": "200",
                "tokenAddr": "0x09Df359E57874B0A2eD161f15218bAC00e7bd932"
            },
            {
                "createdAt": "2025-08-05T01:14:48+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token18",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x5cde4667df1042fcced7fbecf6093b990a9e1111"
            },
            {
                "createdAt": "2025-08-05T01:09:34+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token18",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x3937d1b1455e38e775cfa0f80812aa8da56e1111"
            },
            {
                "createdAt": "2025-08-05T01:06:52+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token18",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0xa5310598cfa657207384c46f78e6819a2d011111"
            },
            {
                "createdAt": "2025-07-23T16:16:08+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token11",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "0",
                "tokenAddr": "0xcfda986293dc81be024a50ed6788e4bc93b5933f"
            },
            {
                "createdAt": "2025-08-05T00:50:37+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x17a9911cc3a579bce11570351ae7a745ec3aabcd"
            },
            {
                "createdAt": "2025-08-05T00:46:52+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x15bcaaae36e367c15450e5499f5f366329d4abcd"
            },
            {
                "createdAt": "2025-08-05T00:39:26+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "100",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x135b9ccebf97187380cba8613b28374fb70babcd"
            },
            {
                "createdAt": "2025-08-05T00:11:44+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/947778086a.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "RR",
                "targetBnb": "200",
                "tokenAddr": "0x2c42a3829D79f426299B359D5d580cb90B6606Ee"
            },
            {
                "createdAt": "2025-08-05T01:13:00+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/947778086a.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "RR",
                "targetBnb": "200",
                "tokenAddr": "0x1EB4FfF5B9d120a84023F2C1C2ae0e5595284444"
            },
            {
                "createdAt": "2025-08-05T01:10:57+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0xF5f44574EB680AF98503D4E82Ef9406D2b9e34f7"
            },
            {
                "createdAt": "2025-08-04T23:58:52+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x5A6Be8fB6853D5Cd30C3225740eE9273969e0008"
            },
            {
                "createdAt": "2025-08-04T22:51:26+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/token/logo/97/2feddce4cb.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Teset",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "TESET",
                "targetBnb": "200",
                "tokenAddr": "0xF1Ed2a302163c432dc50Cc6C94b65D67D5d532b9"
            },
            {
                "createdAt": "2025-07-29T03:14:21+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "0",
                "tokenAddr": "0x2141dc6185b6d2b4dd65a926820fc4d0d2e26666"
            },
            {
                "createdAt": "2025-07-23T16:43:35+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 0,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "8.6242926",
                "name": "Demo Token11",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x7e8f0e2bdfc9586dc2499b2ca2948a7ff7e4dc77"
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

### 即将打满

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-06 17:47:37

> 更新时间: 2025-08-06 20:47:07

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/trade/almost-full-token

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
        "pageSize": 30,
        "pageNo": 1,
        "total": 1,
        "totalPage": 1,
        "result": [
            {
                "createdAt": "2025-08-04T23:58:52+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 1754397101,
                "logo": "https://static.coinroll.io/images/demo-logo.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "Demo Token16",
                "priceChangePercentage24H": "0",
                "progressPct": "0.9",
                "symbol": "DEMO11",
                "targetBnb": "200",
                "tokenAddr": "0x5A6Be8fB6853D5Cd30C3225740eE9273969e0008"
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

### 今日毕业

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-06 20:47:54

> 更新时间: 2025-08-06 20:57:18

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/trade/today-launching-token?pn=&ps=&lunchMode=

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名    | 示例值 | 参数类型 | 是否必填 | 参数描述 |
| --------- | ------ | -------- | -------- | -------- |
| pn        | -      | string   | 是       | -        |
| ps        | -      | string   | 是       | -        |
| lunchMode | -      | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "pageSize": 30,
        "pageNo": 1,
        "total": 1,
        "totalPage": 1,
        "result": [
            {
                "createdAt": "2025-08-05T01:41:21+08:00",
                "currentBnb": "0",
                "hot": 0,
                "isFavorite": false,
                "launchMode": 1,
                "launchTime": 1754397101,
                "logo": "https://static.coinroll.io/token/logo/97/fab6335299.png",
                "marginBnb": "0",
                "marketCap": "0",
                "name": "R",
                "priceChangePercentage24H": "0",
                "progressPct": "0",
                "symbol": "R",
                "targetBnb": "0",
                "tokenAddr": "0x17015a7fc384b7f2fcfebd70de9b1f0e01f54321"
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

### 查询advanced列表

> 创建人: twodog

> 更新人: twodog

> 创建时间: 2025-08-07 22:49:03

> 更新时间: 2025-08-09 22:38:21

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> /api/v1/token/advanced-token-list?pn=1&ps=10

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名               | 示例值 | 参数类型 | 是否必填 | 参数描述                                                                                                                                 |
| -------------------- | ------ | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| volumeStatisticsType | 5      | number   | 是       | 交易额统计类型（1: 5 Min，2: 30 Min，3: 1 Hrs，4: 4 Hrs，5: 1 Day， 6: 7Days）                                                           |
| marketCapMin         | 1      | string   | 是       | 低市值（字符串格式）                                                                                                                     |
| marketCapMax         | 10000  | string   | 是       | 高市值（字符串格式）                                                                                                                     |
| holdersMin           | 1      | number   | 是       | 低持有者数量                                                                                                                             |
| holdersMax           | 100    | number   | 是       | 高持有者数量                                                                                                                             |
| volumeMin            | 1      | string   | 是       | 最小交易额（字符串格式）                                                                                                                 |
| volumeMax            | 100    | string   | 是       | 最大交易额（字符串格式）                                                                                                                 |
| tokenIssuanceMode    | 1      | number   | 是       | 代币发行模式 (1: 立即启动-Normal,2: 预约上线-Presale,3: IDO,4: 燃烧-Burn)                                                                |
| isTop10              | 1      | number   | 是       | 是否为Top10代币（1:是，2:否）                                                                                                            |
| isSign               | 1      | number   | 是       | 是否有金银标（1:是，2:否）                                                                                                               |
| isPancakeV3          | 1      | number   | 是       | 是否使用V3（1:是，2:否）                                                                                                                 |
| sortType             | 1      | number   | 是       | 1. 最新上线 2. 即将上线（时间权重，细分筛选热度） 3. 即将打满（85%以上） 4. 热度值 5. 交易量 6. 市值 7. 持币人数 8. 交易笔数 9. 已经毕业 |
| pn                   | 1      | number   | 是       | 分页页码，从1开始                                                                                                                        |
| ps                   | 10     | number   | 是       | 每页条数，最大100                                                                                                                        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
	"code": 30,
	"message": "Excepteur Duis nisi Ut",
	"data": {
		"list": [],
		"total": 12,
		"pageNo": 38,
		"pageSize": 71,
		"totalPage": 89
	}
}
```

- 失败(400)

```javascript
暂无数据
```

**Query**

### Holder列表

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-07 23:19:26

> 更新时间: 2025-08-07 23:27:46

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/holders?pn=1&ps=10&tokenAddress=0x06C854e50b30813a3212a37b27Fc9Ae379Fb6666

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------------ | -------- | -------- | -------- |
| pn           | 1                                          | string   | 是       | -        |
| ps           | 10                                         | string   | 是       | -        |
| tokenAddress | 0x06C854e50b30813a3212a37b27Fc9Ae379Fb6666 | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": [
        {
            "address": "0x4A8898143b6b13c628812fca56Ba8673B2bA8AEd",
            "balance": "10199643.0107174504389846",
            "percentage": "0.0101996430107175"
        },
        {
            "address": "0x1c316121044B261f81A9ef66f2e2E688aA43E442",
            "balance": "8000000",
            "percentage": "0.008"
        }
    ]
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 给Token投票

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-08 11:44:08

> 更新时间: 2025-08-08 15:52:58

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/vote

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "tokenId":1
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

### 查询代币排行榜列表Ranking

> 创建人: twodog

> 更新人: twodog

> 创建时间: 2025-08-08 20:05:19

> 更新时间: 2025-08-11 01:18:25

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> /api/v1/token/ranking-token-list?pn=1&ps=10

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名      | 示例值 | 参数类型 | 是否必填 | 参数描述                                                                                                                                     |
| ----------- | ------ | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| pn          | 1      | number   | 是       | 分页页码，从1开始                                                                                                                            |
| ps          | 10     | number   | 是       | 每页条数，最大100                                                                                                                            |
| platform    | 1      | number   | 是       | 数据来源平台（0:非Pancake V3，1:Pancake V3）                                                                                                 |
| category    | 0      | number   | 是       | 代币分类筛选（0 ：全部， 1: meme ，2: ai ， 3: defi， 4: game ， 5: infra ， 6: desci ， 7: depin ， 8: charity ， 9: others ， 10: social） |
| tokenSymbol | ETH    | string   | 是       | 代币符号                                                                                                                                     |
| pageType    | 2      | number   | 是       | 页面类型(1 : Favorites（收藏夹）：用户登录后收藏的币种。2 : Cryptos（全部加密货币列表）3 : New（新币列表）)                                  |
| sortField   | -      | string   | 是       | （hot,price,change24h,volume24h,market_cap,tx_count,holders,top10_percent,age_days）如果是多个用“,”连接 ，默认值是market_cap（市值），非必传 |
| sortType    | 1      | string   | 是       | 正序或者倒叙（asc/desc）与sortField按位置一一对应；，默认值为倒叙，非必传                                                                    |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(400)

```javascript
暂无数据
```

**Query**

### Overview排行榜

> 创建人: twodog

> 更新人: twodog

> 创建时间: 2025-08-08 20:21:41

> 更新时间: 2025-08-12 17:49:58

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> /api/v1/token/overview-rankings

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名 | 示例值 | 参数类型 | 是否必填 | 参数描述                      |
| ------ | ------ | -------- | -------- | ----------------------------- |
| top    | 3      | number   | 是       | 返回数据条数。默认10，最大100 |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
暂无数据
```

- 失败(400)

```javascript
暂无数据
```

**Query**

### 收藏Token

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-11 15:20:53

> 更新时间: 2025-08-13 09:11:47

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/favorite

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "tokenId": 359322605262880
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
    "data": null
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**

### 取消收藏

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-11 15:24:45

> 更新时间: 2025-08-11 15:26:17

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/unfavorite

**请求方式**

> POST

**Content-Type**

> json

**请求Body参数**

```javascript
{
    "tokenId": 359151996436512
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

### trading data列表查询

> 创建人: twodog

> 更新人: twodog

> 创建时间: 2025-08-12 17:53:03

> 更新时间: 2025-08-12 18:01:57

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> /api/v1/token/trade-rankings-list?rankingType=&platform=1

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名      | 示例值 | 参数类型 | 是否必填 | 参数描述                                                           |
| ----------- | ------ | -------- | -------- | ------------------------------------------------------------------ |
| rankingType | -      | number   | 是       | 1:HotCoins，2:TopGainers，3:TopLosers，4:TopVolume，5:TopMarketCap |
| platform    | 1      | number   | 是       | 数据来源平台（0:非Pancake V3，1:Pancake V3）                       |
| pn          | -      | number   | 是       | 页码，默认 1，最小 1，最大 100                                     |
| ps          | -      | number   | 是       | 每页数量，默认 10，最小 1，最大 100                                |

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

### 获取交易统计详情

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-14 15:56:31

> 更新时间: 2025-08-14 16:42:13

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/trade-info?tokenAddress=0x79a57fb299f66cc53e8d7dfe3c5d7dd16ba86666

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------------ | -------- | -------- | -------- |
| tokenAddress | 0x79a57fb299f66cc53e8d7dfe3c5d7dd16ba86666 | string   | 是       | -        |

**认证方式**

> 继承父级

**响应示例**

- 成功(200)

```javascript
{
    "code": 200,
    "message": "success",
    "data": {
        "capitalFlowMap15M": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "15 MINUTE"
        },
        "capitalFlowMap1D": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "1 DAY"
        },
        "capitalFlowMap1H": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "1 HOUR"
        },
        "capitalFlowMap1W": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "1 WEEK"
        },
        "capitalFlowMap2H": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "2 HOUR"
        },
        "capitalFlowMap30M": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "30 MINUTE"
        },
        "capitalFlowMap4H": {
            "level_1": {
                "bucket": 1,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_2": {
                "bucket": 2,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "level_3": {
                "bucket": 3,
                "buy_token": "0",
                "net_token": "0",
                "sell_token": "0"
            },
            "time_interval": "4 HOUR"
        },
        "capitalFlowStats12h": [
            {
                "buyVol": "0",
                "sellVol": "0",
                "timeBucket": "2025-08-14T08:00:00Z"
            }
        ],
        "largeOrderNetFlowLast5Days": [
            {
                "buyVol": "0",
                "timeBucket": "2025-08-10"
            },
            {
                "buyVol": "0",
                "timeBucket": "2025-08-11"
            },
            {
                "buyVol": "0",
                "timeBucket": "2025-08-12"
            },
            {
                "buyVol": "0",
                "timeBucket": "2025-08-13"
            },
            {
                "buyVol": "0",
                "timeBucket": "2025-08-14"
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

### 用户持仓分布

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-14 18:01:27

> 更新时间: 2025-08-15 13:56:24

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/current-holder-distribution?tokenAddress=0x79a57fb299f66cc53e8d7dfe3c5d7dd16ba86666

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------------ | -------- | -------- | -------- |
| tokenAddress | 0x79a57fb299f66cc53e8d7dfe3c5d7dd16ba86666 | string   | 是       | -        |

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

### 用户持仓分布列表

> 创建人: baiqi

> 更新人: baiqi

> 创建时间: 2025-08-15 11:20:21

> 更新时间: 2025-08-15 14:11:13

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> api/v1/token/holder-distribution-list?tokenAddress=0x79A57FB299F66CC53E8d7dfe3c5D7DD16Ba86666&startTime=1754755200&endTime=1755187200

**请求方式**

> GET

**Content-Type**

> none

**请求Query参数**

| 参数名       | 示例值                                     | 参数类型 | 是否必填 | 参数描述 |
| ------------ | ------------------------------------------ | -------- | -------- | -------- |
| tokenAddress | 0x79A57FB299F66CC53E8d7dfe3c5D7DD16Ba86666 | string   | 是       | -        |
| startTime    | 1754755200                                 | string   | 是       | -        |
| endTime      | 1755187200                                 | string   | 是       | -        |

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

### 根据token地址获取token的详细信息

> 创建人: twodog

> 更新人: twodog

> 创建时间: 2025-08-16 10:12:00

> 更新时间: 2025-08-16 10:13:23

```text
暂无描述
```

**接口状态**

> 已完成

**接口URL**

> /api/v1/token/detail?tokenAddress=

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
{
  "code": 200,
  "message": "success",
  "data": {
    // 基本信息
    "id": 12345,
    "name": "Token Name",
    "symbol": "TKN",
    "description": "Token description",
    "tokenContractAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "creatorAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
    "totalSupply": "1000000.0",
    "nonce": 1,

    // 发行信息
    "launchMode": 1,
    "launchTime": 1640995200,

    // 社交链接
    "website": "https://example.com",
    "twitter": "https://twitter.com/token",
    "telegram": "https://t.me/token",
    "discord": "https://discord.gg/token",
    "additionalLink1": "https://link1.com",
    "additionalLink2": "https://link2.com",
    "contactTg": "@contact",
    "contactEmail": "contact@example.com",

    // 图片资源
    "logo": "https://example.com/logo.png",
    "banner": "https://example.com/banner.png",

    // 市场数据
    "currentPrice": "0.000123456789",
    "currentPriceUsdt": "0.123456789",
    "marketCapUsdt": "123456.789",
    "priceChangePercentage24H": "5.67",
    "marketCap": "123.456789",
    "totalVolume24H": "1000.123456789",
    "holdersCount": 1500,
    "buyCount24H": 250,
    "sellCount24H": 180,
    "top10": "25.5",
    "turnoverRate": "8.1",

    // 众筹信息
    "bnbTarget": "100.0",
    "bnbCurrent": "75.5",
    "progressPct": "75.5",

    // 标签
    "tags": ["DeFi", "Gaming", "NFT"],

    // 预购信息
    "preBuyUsed": [
      {
        "remark": "团队锁仓",
        "percent": "20.0",
        "tip": "团队代币锁仓说明"
      }
    ],
    "totalLock": "200000.0"
  }
}
```

- 失败(404)

```javascript
暂无数据
```

**Query**
