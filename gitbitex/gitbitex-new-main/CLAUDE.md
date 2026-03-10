# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Build (skip tests)
mvn clean package -Dmaven.test.skip=true

# Run
cd target
java -jar gitbitex-0.0.1-SNAPSHOT.jar

# Start dependencies (Redis, MongoDB replica set, Kafka)
docker compose up -d
```

## Architecture

GitBitEX is a cryptocurrency exchange with an in-memory matching engine supporting 100,000+ orders/second.

### Core Components

- **Matching Engine** (`matchingengine/`) - In-memory order matching with snapshot/restore capability
  - Processes commands via Kafka: `PlaceOrderCommand`, `CancelOrderCommand`, `DepositCommand`, `PutProductCommand`
  - Maintains `OrderBook` per product with L3 order book data
  - Outputs messages via Kafka for persistence and real-time feeds

- **Market Data** (`marketdata/`) - Consumes matching engine messages to persist data and generate feeds
  - Multiple consumer threads: `OrderPersistenceThread`, `TradePersistenceThread`, `TickerThread`, `CandleMakerThread`
  - Manages L2 order book snapshots via `OrderBookSnapshotManager`

- **WebSocket Feed** (`feed/`) - Real-time market data and account updates to clients

- **Wallet** (`wallet/`) - Coinbase integration for deposits/withdrawals (sends commands to matching engine)

### Data Flow

```
User/API → Command → Kafka → Matching Engine → Messages → Kafka
                                                    ↓
    Market Data Consumers ← ← ← ← ← ← ← ← ← ← ← ← ← ←┘
    (persist to MongoDB, generate candles/tickers)
```

### Key Infrastructure

- **MongoDB**: Replica set (3 nodes) for data persistence
- **Kafka**: Command/message bus between components
- **Redis**: Session/cache storage

### Configuration

Edit `src/main/resources/application.properties`:
- `mongodb.uri` - MongoDB replica set connection string
- `kafka.bootstrap-servers` - Kafka broker address
- `redis.address` - Redis connection

API runs on port 80, actuator/metrics on port 7002.
