import { IChartingLibraryWidget } from '@/public/static/charting_library'

interface QuoteToggleButtonProps {
  tvWidget: IChartingLibraryWidget
  currentQuote: 'SOL' | 'USD'
  onQuoteChange: (quote: 'SOL' | 'USD') => void
  datafeed?: any // 添加数据源参数
}

export const createQuoteToggleButton = ({
  tvWidget,
  currentQuote,
  onQuoteChange,
  datafeed,
}: QuoteToggleButtonProps) => {
  const button = tvWidget.createButton()
  button.setAttribute('title', 'Switch quote currency')

  // 使用闭包来跟踪当前状态
  let currentState = currentQuote

  const updateButtonStyle = () => {
    button.innerHTML = `
      <span style="
        ${currentState === 'USD' ? 'color: var(--tv-color-toolbar-button-text-active,var(--themed-color-toolbar-button-text-active,#2962ff));' : 'color: #888;'}
      ">USD</span>
      /
      <span style="
        ${currentState === 'SOL' ? 'color: var(--tv-color-toolbar-button-text-active,var(--themed-color-toolbar-button-text-active,#2962ff));' : 'color: #888;'}
      ">SOL</span>
    `
  }

  const handleQuoteChange = (newQuote: 'SOL' | 'USD') => {
    currentState = newQuote // 更新内部状态
    updateButtonStyle() // 立即更新按钮样式

    // 如果提供了数据源，直接更新
    if (datafeed && datafeed.updateQuote) {
      datafeed.updateQuote(newQuote)
    }

    // 调用外部回调
    onQuoteChange(newQuote)

    // 重置图表数据
    tvWidget.activeChart().resetData()
  }

  button.addEventListener('click', function () {
    const newQuote = currentState === 'USD' ? 'SOL' : 'USD'
    handleQuoteChange(newQuote)
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
