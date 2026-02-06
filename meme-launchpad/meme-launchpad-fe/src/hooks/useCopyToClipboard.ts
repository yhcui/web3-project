import { useCallback } from 'react'

export function useCopyToClipboard() {
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        return true
      } catch (err) {
        console.error('复制失败:', err)
        return false
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }, [])

  return copy
}
