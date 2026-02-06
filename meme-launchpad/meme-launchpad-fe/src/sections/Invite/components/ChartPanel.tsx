import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  LineStyle,
  AreaSeries,
} from 'lightweight-charts'

interface ChartData {
  time: string
  value: number
}

interface ChartPanelProps {
  data: ChartData[]
  title: string
  unit?: string
  className?: string
}

export default function ChartPanel({
  data,
  title,
  unit = '',
  className = '',
}: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 创建图表实例 - 使用 v5.0 API
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 200,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#848E9C',
        fontSize: 11,
      },
      watermark: {
        visible: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#848E9C',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: '#848E9C',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
    } as any)

    console.log(chart)

    // 添加面积系列 - 使用 v5.0 API 的正确语法
    const areaSeries = (chart as any).addSeries(AreaSeries, {
      topColor: 'rgba(255, 214, 0, 0.4)',
      bottomColor: 'rgba(255, 214, 0, 0.0)',
      lineColor: '#FFD600',
      lineWidth: 1,
      crosshairMarkerVisible: true,
      lastValueVisible: false,
      priceLineVisible: false,
    })

    console.log('data:', data)

    // 转换数据格式 - 在 v5 中需要时间戳格式
    const chartData = data
      .map((item) => {
        // 解析 MM-DD 格式并转换为当前年份的时间戳
        const [month, day] = item.time.split('-')
        const currentYear = new Date().getFullYear()
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day))
        return {
          time: Math.floor(date.getTime() / 1000),
          value: item.value,
        }
      })
      .sort((a, b) => a.time - b.time) // 按时间排序，确保最早的数据在最左边

    areaSeries.setData(chartData)

    // 设置价格范围
    if (chartData.length > 0) {
      const values = chartData.map((d) => d.value)
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      const range = maxValue - minValue

      ;(chart as any).priceScale('right').applyOptions({
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      })

      // 设置时间轴范围，确保显示所有数据
      ;(chart as any).timeScale().setVisibleRange({
        from: chartData[0].time,
        to: chartData[chartData.length - 1].time,
      })
    }

    chartInstanceRef.current = chart

    // 响应式处理
    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
        })
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartInstanceRef.current = null
    }
  }, [data])

  return (
    <div className={`rounded-lg bg-[#181A20] p-4 ${className}`}>
      <div className="mb-4 text-[16px] font-medium text-white">{title}</div>
      <div ref={chartRef} className="h-[200px] w-full" />
    </div>
  )
}
