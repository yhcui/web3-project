# TVChartContainer - Real-time WebSocket Integration

## Overview

The `TVChartContainer` component now provides complete real-time data integration using WebSocket connections for live K-line updates in TradingView charts.

## Features

### ✅ Completed Implementation

1. **HTTP Historical Data**
   - Initial chart loading with historical K-line data
   - Pagination support with cursor-based loading
   - Time range filtering and caching

2. **WebSocket Real-time Updates**
   - Live K-line data streaming
   - Automatic price and volume updates
   - Proper data transformation for TradingView format

3. **Subscription Management**
   - Automatic WebSocket subscription/unsubscription
   - Listener cleanup on component unmount
   - Memory leak prevention

## Architecture

```
┌─────────────────┐    HTTP     ┌─────────────────┐
│  TVChartContainer│────────────▶│  Historical API │
│                 │             └─────────────────┘
│                 │    WebSocket ┌─────────────────┐
│                 │────────────▶│  Real-time WS   │
└─────────────────┘             └─────────────────┘
         │
         ▼
┌─────────────────┐
│  TradingView    │
│     Chart       │
└─────────────────┘
```

## Data Flow

### 1. Initial Load (HTTP)

```typescript
// When chart initializes
TradingView.getBars() → fetchKlineHistoryWithCursor() → Display historical data
```

### 2. Real-time Updates (WebSocket)

```typescript
// When chart subscribes to real-time data
TradingView.subscribeBars() → ws.subscribe() → Listen for 'kline_update' events
```

### 3. Live Data Processing

```typescript
// When WebSocket receives updates
WebSocket 'kline_update' → Transform to Bar format → onRealtimeCallback() → Update chart
```

## WebSocket Data Format

The component expects WebSocket messages in the following format:

```typescript
{
  type: 'kline_update',
  timestamp: number,
  success: boolean,
  data: {
    tokenAddress: string,
    channel: 'kline',
    interval: string, // '1m', '5m', etc.
    data: {
      t: number,    // timestamp (seconds)
      o: string,    // open price
      h: string,    // high price
      l: string,    // low price
      c: string,    // close price
      v: string,    // volume
    }
  }
}
```

## Usage Example

```tsx
import { TVChartContainer } from '@/components/TVChartContainer'

function TokenPage({ tokenData }) {
  return (
    <div className="chart-container">
      <TVChartContainer tokenInfo={tokenData} />
    </div>
  )
}
```

## Debug Information

The component provides comprehensive logging for debugging:

- `[TVChartContainer]` - Component lifecycle events
- `[TradingView]` - WebSocket subscription/unsubscription
- Real-time data processing and transformation

## Error Handling

The implementation includes proper error handling for:

- WebSocket connection failures
- Invalid data format
- Subscription management errors
- Component cleanup failures

## Performance Considerations

1. **Memory Management**: Automatic cleanup of WebSocket listeners
2. **Data Filtering**: Only processes updates for the current token/interval
3. **Connection Reuse**: Shares WebSocket client across components
4. **Caching**: HTTP data caching to reduce API calls

## Troubleshooting

### Common Issues

1. **Chart not updating in real-time**
   - Check WebSocket connection status
   - Verify token address matches exactly
   - Ensure interval format is correct

2. **Memory leaks**
   - Component automatically cleans up on unmount
   - Check browser dev tools for listener count

3. **Data inconsistency**
   - Verify timestamp conversion (seconds → milliseconds)
   - Check data transformation logic

### Debug Commands

```javascript
// Check WebSocket connection
ws.isConnected()

// View active subscriptions
console.log(realtimeListeners.size)

// Check last received data
console.log(lastData.current)
```

## Migration Notes

### From Previous Implementation

The previous implementation only supported HTTP data loading. The new version adds:

- Real-time WebSocket integration
- Proper subscription management
- Enhanced error handling
- Comprehensive logging

### Breaking Changes

None - the component interface remains the same.

## Future Enhancements

- [ ] Support for multiple quote currencies (USD/BNB toggle)
- [ ] Market cap vs Price mode switching
- [ ] Advanced WebSocket reconnection strategies
- [ ] Performance metrics and monitoring
