'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface CircularProgressProps {
  // 进度值，可以是百分比 (0-100) 或者实际数值
  progress?: number // 0-100 百分比
  // 动态计算进度所需的数据
  currentValue?: number // 当前值
  maxValue?: number // 最大值
  minValue?: number // 最小值，默认为 0
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  strokeWidth?: number
  trackColor?: string
  progressColor?: string
  // 进度文本格式化
  formatProgressText?: (
    progress: number,
    currentValue?: number,
    maxValue?: number
  ) => string
}

export function CircularProgress({
  progress,
  currentValue,
  maxValue,
  minValue = 0,
  size = 'md',
  className,
  strokeWidth = 2,
  trackColor = '#ccc',
  progressColor = '#FFD700',
}: CircularProgressProps) {
  // 计算进度百分比
  const calculateProgress = (): number => {
    // 如果直接提供了 progress，使用它
    if (progress !== undefined) {
      return Math.max(0, Math.min(100, progress))
    }

    // 如果提供了 currentValue 和 maxValue，动态计算
    if (currentValue !== undefined && maxValue !== undefined) {
      if (maxValue <= minValue) return 0
      const calculatedProgress =
        ((currentValue - minValue) / (maxValue - minValue)) * 100
      return Math.max(0, Math.min(100, calculatedProgress))
    }

    // 默认返回 0
    return 0
  }

  const clampedProgress = calculateProgress()

  // 尺寸配置
  const sizeConfig = {
    sm: { width: 40, height: 40, radius: 10 },
    md: { width: 50, height: 50, radius: 10 },
    lg: { width: 64, height: 64, radius: 10 }, // 移动端
    xl: { width: 70, height: 70, radius: 10 }, // 桌面端
  }

  const { width, height, radius } = sizeConfig[size]

  // 计算圆角矩形的周长
  const rectWidth = width - strokeWidth * 2
  const rectHeight = height - strokeWidth * 2
  const circumference =
    2 * (rectWidth + rectHeight) - 8 * radius + 2 * Math.PI * radius

  const strokeDasharray = circumference
  const strokeDashoffset =
    circumference - (clampedProgress / 100) * circumference

  return (
    <div className={cn('relative inline-block', className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* 背景轨道 */}
        <rect
          x={strokeWidth}
          y={strokeWidth}
          width={width - strokeWidth * 2}
          height={height - strokeWidth * 2}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* 进度轨道 */}
        <rect
          x={strokeWidth}
          y={strokeWidth}
          width={width - strokeWidth * 2}
          height={height - strokeWidth * 2}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
    </div>
  )
}

// 使用示例：
/*
// 基础用法 - 直接提供百分比
<CircularProgress progress={75} />

// 动态计算进度 - 根据实际数值
<CircularProgress 
  currentValue={750} 
  maxValue={1000} 
  size="xl" 
  trackColor="#2B3139" 
  progressColor="" 
/>

// 移动端和桌面端响应式
<CircularProgress currentValue={750} maxValue={1000} size="lg" className="md:hidden" />
<CircularProgress currentValue={750} maxValue={1000} size="xl" className="hidden md:block" />


// 带最小值的计算
<CircularProgress 
  currentValue={150} 
  maxValue={200} 
  minValue={100} 
/>
*/
