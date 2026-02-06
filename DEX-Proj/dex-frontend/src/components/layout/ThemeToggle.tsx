'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'light'
            ? 'bg-white  shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        aria-label="切换到亮色模式"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'dark'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        aria-label="切换到暗色模式"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'p-2 rounded-md transition-colors',
          theme === 'system'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        aria-label="跟随系统"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  )
} 