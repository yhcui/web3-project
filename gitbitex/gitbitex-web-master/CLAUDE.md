# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm start

# Build for production
npm run build
```

### Backend Proxy Configuration

Edit `gulpfile.js` to configure the backend API proxy:

```javascript
apiProxy = 'http://localhost:8080/';  // Change to your backend host
```

Configure WebSocket server in `src/script/constant.ts`:

```typescript
static SOCKET_SERVER = 'ws://localhost:8080/ws';
```

## Architecture

GitBitEx Web is a cryptocurrency exchange frontend built with Vue 2, TypeScript, and Webpack.

### Project Structure

```
src/
├── script/
│   ├── app.ts              # Application entry point, initializes stores and WebSocket
│   ├── framework.ts        # Vue.js framework setup with routing
│   ├── main.ts             # Bootstraps all pages and components
│   ├── constant.ts         # Global constants (WebSocket URL, currency symbols)
│   ├── store/              # Vuex-style state management
│   │   ├── store.ts        # Base store class
│   │   ├── service.ts      # Store service aggregator
│   │   ├── trade.ts        # Trading state (products, candles, orders, tickers)
│   │   ├── account.ts      # Account state (user, balances)
│   │   └── channel.ts      # WebSocket channel handling
│   ├── service/            # API and WebSocket services
│   │   ├── http.ts         # HTTP service aggregator
│   │   ├── websocket.ts    # WebSocket connection management
│   │   ├── trade.ts        # Trade API calls
│   │   ├── account.ts      # Account API calls
│   │   └── order.ts        # Order API calls
│   ├── page/               # Page components (routes)
│   │   ├── home/           # Home page
│   │   ├── trade/          # Trading page
│   │   └── account/        # Account pages (signin, signup, wallet, orders)
│   └── component/          # Reusable Vue components
│       ├── header/         # Navigation headers
│       ├── panel/          # Trading panels (order book, trade history, wallet)
│       ├── form/           # Forms (order, deposit, withdrawal)
│       ├── chart/          # Chart components (candle, depth, tradingview)
│       ├── modal/          # Modal dialogs
│       └── icon/           # Icon components
├── style/                  # LESS stylesheets
├── font/                   # Web fonts
└── image/                  # Images and SVGs
```

### Core Patterns

**Component Architecture:**
- Components use TypeScript with Vue class-style decorators (`vue-class-component`, `vue-property-decorator`)
- Templates use Jade/Pug (`.jade` files) loaded via `jade-loader`
- Components define `elementName` static property for registration (e.g., `'trade-panel'`)

**State Management:**
- Custom store pattern extending `BaseStore`
- Stores are singletons accessed via `StoreService.Trade` and `StoreService.Account`
- WebSocket messages are parsed and dispatched to update store state

**WebSocket Communication:**
- `WebSocketService` manages connection to backend WebSocket server
- Subscribes to channels: `candle`, `ticker`, `orderBook`, `order`, `account`
- Messages are parsed in `TradeStore.parseWebSocketMessage()`

**HTTP Services:**
- Services in `src/script/service/` wrap REST API calls
- Use `axios` for HTTP requests
- Base URL configured via proxy in `gulpfile.js`

### Build System

**Gulp + Webpack:**
- `gulpfile.js` - Main build configuration
- `gulp/gulp.config.js` - Defines tasks for scripts, styles, assets
- `gulp/webpack.config.js` - TypeScript/webpack configuration

**Build Tasks:**
- `base.vendor.script` - Concatenates vendor JS (moment, collect.js, highcharts, qrcodejs)
- `base.app.script` - Webpack build of TypeScript app code
- `base.app.style` - LESS compilation
- `prod.*` - MD5 hash and minification for production

### Key Dependencies

| Package | Usage |
|---------|-------|
| `vue` ^2.5.17 | Framework |
| `vuex` ^3.0.1 | State management |
| `vue-router` ^3.0.1 | Routing |
| `vue-class-component` ^6.2.0 | Class-style Vue components |
| `vue-property-decorator` ^6.1.0 | Property decorators |
| `typescript` ^2.9.2 | TypeScript |
| `webpack` 3.10.0 | Module bundler |
| `gulp` ^3.9.1 | Build system |
| `highcharts` ^7.2.0 | Charts |
| `axios` ^0.19.0 | HTTP client |
| `moment` ^2.22.2 | Date/time |
| `collect.js` ^4.0.22 | Collection utilities |
