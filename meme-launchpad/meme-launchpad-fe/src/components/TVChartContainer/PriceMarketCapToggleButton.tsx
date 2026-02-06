import { IChartingLibraryWidget } from '@/public/static/charting_library'

interface PriceMarketCapToggleButtonProps {
  tvWidget: IChartingLibraryWidget
  currentMode: 'PRICE' | 'MARKET_CAP'
  onModeChange: (mode: 'PRICE' | 'MARKET_CAP') => void
  datafeed?: any // 添加数据源参数
}

export const createPriceMarketCapToggleButton = ({
  tvWidget,
  currentMode,
  onModeChange,
  datafeed,
}: PriceMarketCapToggleButtonProps) => {
  const button = tvWidget.createButton()
  button.setAttribute('title', 'Switch between price and market cap')

  // 使用闭包来跟踪当前状态
  let currentState = currentMode

  const updateButtonStyle = () => {
    button.innerHTML = `
      <span style="
        ${currentState === 'PRICE' ? 'color: var(--tv-color-toolbar-button-text-active,var(--themed-color-toolbar-button-text-active,#2962ff));' : 'color: #888;'}
      ">Price</span>
      /
      <span style="
        ${currentState === 'MARKET_CAP' ? 'color: var(--tv-color-toolbar-button-text-active,var(--themed-color-toolbar-button-text-active,#2962ff));' : 'color: #888;'}
      ">MC</span>
    `
  }

  const handleModeChange = (newMode: 'PRICE' | 'MARKET_CAP') => {
    currentState = newMode // 更新内部状态
    updateButtonStyle() // 立即更新按钮样式

    // 如果提供了数据源，直接更新
    if (datafeed && datafeed.updateMode) {
      datafeed.updateMode(newMode)
    }

    // 调用外部回调
    onModeChange(newMode)

    // 重置图表数据
    tvWidget.activeChart().resetData()
  }

  button.addEventListener('click', function () {
    const newMode = currentState === 'PRICE' ? 'MARKET_CAP' : 'PRICE'
    handleModeChange(newMode)
  })

  updateButtonStyle()
  button.style.cssText = `
    padding: 4px 8px;
    margin-right: 4px;
    margin-left: 4px;
    background-color: #000000;
    font-weight: 500;
    font-size: 12px;
    cursor: pointer;
  `

  return button
}
