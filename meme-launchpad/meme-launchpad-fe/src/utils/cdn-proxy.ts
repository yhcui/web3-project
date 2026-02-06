import { NextRequest, NextResponse } from 'next/server'

const CDN_TIMEOUT = 5000 // 5 seconds
const FALLBACK_CDN = process.env.NEXT_PUBLIC_FALLBACK_CDN_URL || ''
const CACHE_DURATION = 3600 // 1 hour

export async function proxyCDNImage(request: NextRequest) {
  const url = new URL(request.url)
  const imagePath = url.searchParams.get('url')

  if (!imagePath) {
    return new NextResponse('Missing image URL', { status: 400 })
  }

  // Try primary CDN with timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CDN_TIMEOUT)

    const response = await fetch(imagePath, {
      signal: controller.signal,
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
      },
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const buffer = await response.arrayBuffer()
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'image/png',
          'Cache-Control': `public, max-age=${CACHE_DURATION}`,
          'X-CDN-Source': 'primary',
        },
      })
    }
  } catch (error) {
    console.error('Primary CDN failed:', error)

    // Try fallback CDN if configured
    if (FALLBACK_CDN) {
      try {
        const fallbackUrl = imagePath.replace(
          'https://static.coinroll.io',
          FALLBACK_CDN
        )
        const fallbackResponse = await fetch(fallbackUrl)

        if (fallbackResponse.ok) {
          const buffer = await fallbackResponse.arrayBuffer()
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type':
                fallbackResponse.headers.get('content-type') || 'image/png',
              'Cache-Control': `public, max-age=${CACHE_DURATION}`,
              'X-CDN-Source': 'fallback',
            },
          })
        }
      } catch (fallbackError) {
        console.error('Fallback CDN also failed:', fallbackError)
      }
    }
  }

  // Return default image
  const defaultImageResponse = await fetch(
    new URL('/assets/images/default-token.svg', request.url)
  )
  const defaultBuffer = await defaultImageResponse.arrayBuffer()

  return new NextResponse(defaultBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60',
      'X-CDN-Source': 'default',
    },
  })
}
