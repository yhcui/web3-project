'use client'

import React, { useState } from 'react'

// Import generated icons
import * as GeneratedIcons from './generated/social'

// Define social colors
export const SOCIAL_COLORS = {
  default: '#798391',
  website: '#FBD537',
  x: '#FBD537',
  telegram: '#FBD537',
  discord: '#FBD537',
  whitepaper: '#FBD537',
}

interface SocialIconWrapperProps {
  type: string
  size?: number
  color?: string
  hoverColor?: string
  className?: string
  interactive?: boolean
}

// Map common names to icon component names
const iconNameMap: Record<string, string> = {
  website: 'WebsiteIcon',
  x: 'XIcon',
  twitter: 'XIcon', // Map twitter to X icon
  telegram: 'TelegramIcon',
  discord: 'DiscordIcon',
  whitepaper: 'WhitepaperIcon',
  github: 'GithubIcon',
  medium: 'MediumIcon',
}

export const SocialIconWrapper: React.FC<SocialIconWrapperProps> = ({
  type,
  size = 12,
  color,
  hoverColor,
  className = '',
  interactive = true,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  // Get the icon component name
  const iconName =
    iconNameMap[type.toLowerCase()] ||
    `${type.charAt(0).toUpperCase()}${type.slice(1)}Icon`

  // Get the icon from generated icons
  const IconComponent = (GeneratedIcons as any)[iconName]

  if (!IconComponent) {
    console.warn(`Icon "${type}" not found`)
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.6,
          color: 'currentColor',
        }}
      >
        ?
      </div>
    )
  }

  // Use provided colors or defaults
  const defaultColor = color || SOCIAL_COLORS.default
  const finalHoverColor =
    hoverColor ||
    SOCIAL_COLORS[type as keyof typeof SOCIAL_COLORS] ||
    SOCIAL_COLORS.default
  const currentColor = isHovered && interactive ? finalHoverColor : defaultColor

  return (
    <div
      className={className}
      style={{
        color: currentColor,
        transition: 'color 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      <IconComponent size={size} />
    </div>
  )
}

// Export for backwards compatibility
export { SocialIconWrapper as SocialIcon }
