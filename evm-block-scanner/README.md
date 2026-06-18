# EVM Block Scanner

Lightweight EVM block scanner that scans configured chains and pushes activities upstream to `blockchain-activity-gateway`.

## Quick Start

1. Copy `config.example.yaml` to `config.yaml`.
2. Update RPC endpoints, explorer keys, and `gateway.url`.
3. Start the scanner:

```bash
go run . -c ./config.yaml
```

## Runtime Model

The scanner only pushes activities to the gateway over `gateway.url` (`ws://.../ws/upstream`).
Downstream websocket and webhook delivery should be handled by the gateway, not by the scanner.

## Local HTTP Endpoints

The scanner still exposes a small local HTTP service on `server_address` for internal features such as:

- `GET /approval-list`
- `GET /ws/tx-status`

### Approval List

```bash
curl "http://localhost:7788/approval-list?chain_id=1&address=0x4be7d10ecabc162de32a31e3f5be3dfc7459d04b"
```

Notes:

- Successful responses use `Content-Type: application/json`
- Approval amount field is `value`
- Token decimals are returned in `token_info.decimals`

## History Fallback

History backfill supports multiple explorer providers. Current order:

1. `etherscan-v2`
2. `blockscout-v1` as optional fallback

Example:

```yaml
history_fallback:
  blockscout_prs: 2
  blockscout_hosts:
    "8453": "https://base.blockscout.com/api"
```
