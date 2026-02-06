/**
 * WebSocket configuration - On-demand connection strategy
 * 按需连接策略：仅在特定页面建立 WebSocket 连接
 */

export interface WebSocketConfig {
  routes: string[] // Routes that need WebSocket
  reconnectAttempts: number
  reconnectDelay: number
  pingInterval: number
  pongTimeout: number
}

/**
 * On-Demand WebSocket Configuration
 * 仅在以下页面建立 WebSocket 连接：
 * - /token/[address] - Token 详情页
 *
 * 优势：
 * - 最低资源消耗
 * - 按需建立连接
 * - 离开页面自动断开
 *
 * 性能指标：
 * - 首次连接：100-500ms
 * - 内存占用：0MB（未连接）/ 2-5MB（已连接）
 * - 服务器连接：仅在 token 页面
 */
export const websocketConfig: WebSocketConfig = {
  routes: ['/token'], // Only connect on token pages
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  pingInterval: 30000, // 30 seconds
  pongTimeout: 5000, // 5 seconds
}
