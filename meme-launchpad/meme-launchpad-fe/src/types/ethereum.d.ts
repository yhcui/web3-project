interface Window {
  ethereum?: {
    selectedAddress?: string
    isMetaMask?: boolean
    request?: (args: { method: string; params?: any[] }) => Promise<any>
    on?: (event: string, handler: (...args: any[]) => void) => void
    removeListener?: (event: string, handler: (...args: any[]) => void) => void
  }
}

declare module 'dayjs-plugin-utc'

declare module 'lodash'
