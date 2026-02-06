# Icon System Usage Guide

## Overview

This project now has an automated icon generation system that converts SVG files into React components. This allows you to:

- Simply drop SVG files into the designated folders
- Run a single command to generate React components
- Use icons with full TypeScript support and hover effects

## Quick Start

### 1. Add New SVG Icons

Place your SVG files in the appropriate directory:

```
public/assets/images/social/   # Social media icons
# You can add more directories in scripts/generate-icons.ts
```

### 2. Generate Components

Run the generation script:

```bash
pnpm icons:generate
```

This will:

- Convert all SVGs to React components
- Replace colors with `currentColor` for dynamic theming
- Generate TypeScript definitions
- Create an index file with all exports

### 3. Use the Icons

#### Option A: Use Generated Icons Directly

```tsx
import { WebsiteIcon, XIcon } from '@/components/icons/generated/social'

// Basic usage
<WebsiteIcon size={16} />

// With custom styling
<XIcon size={20} style={{ color: '#1DA1F2' }} />
```

#### Option B: Use the Wrapper Component (Recommended)

```tsx
import { SocialIconWrapper } from '@/components/icons/SocialIconWrapper'

// Automatic hover effects with platform colors
<SocialIconWrapper
  type="telegram"
  size={16}
  interactive={true}
/>

// Custom colors
<SocialIconWrapper
  type="website"
  size={20}
  color="#798391"
  hoverColor="#00C853"
/>
```

#### Option C: Use in SocialLinks Component

```tsx
import { SocialLinks } from '@/components/token/SocialLinks'

const links = [
  { type: 'website', url: 'https://example.com' },
  { type: 'x', url: 'https://x.com/example' },
  { type: 'telegram', url: 'https://t.me/example' },
]

<SocialLinks links={links} />
```

## Adding New Icon Categories

To add support for more icon directories, edit `scripts/generate-icons.ts`:

```typescript
const SVG_DIRS = {
  social: './public/assets/images/social',
  tokens: './public/assets/images/tokens', // Add new category
  ui: './public/assets/images/ui', // Add another category
}
```

Then run `pnpm icons:generate` to generate components for all categories.

## Color Handling

The generation script automatically replaces common colors with `currentColor`:

- White (#fff, #ffffff, white) → currentColor
- Black (#000, #000000, black) → currentColor

This allows you to control icon colors via CSS:

```tsx
<div style={{ color: '#1DA1F2' }}>
  <TwitterIcon /> {/* Will be blue */}
</div>
```

## Platform-Specific Colors

Default hover colors are defined in `src/components/icons/social/types.ts`:

```typescript
export const SOCIAL_COLORS = {
  default: '#798391',
  website: '#00C853',
  x: '#1DA1F2',
  telegram: '#26A5E4',
  discord: '#5865F2',
  whitepaper: '#FBD537',
}
```

## Benefits of This Approach

1. **Zero Manual Work**: Just drop SVG files and run the script
2. **Type Safety**: Full TypeScript support with auto-completion
3. **Performance**: Icons are bundled, no network requests
4. **Flexibility**: Easy to customize colors and sizes
5. **Maintainability**: Single source of truth for icons
6. **Tree Shaking**: Unused icons are automatically removed from the bundle

## Migration from Old Icons

The system supports both generated and manually created icons. The wrapper component will:

1. First check for generated icons
2. Fall back to manual icons if not found
3. Show a placeholder if neither exists

This allows gradual migration without breaking existing code.

## Troubleshooting

### Icons not generating?

- Check that SVG files are valid XML
- Ensure file names don't contain special characters
- Look for error messages in the console

### Colors not working?

- Generated icons use `currentColor` by default
- Set color via the parent element's CSS `color` property
- Use the `style` prop for inline colors

### TypeScript errors?

- Run `pnpm icons:generate` after adding new SVGs
- Restart your TypeScript server in VS Code
- Check that imports match the generated component names
