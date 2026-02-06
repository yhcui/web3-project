#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import { transform } from '@svgr/core'

// Configuration
const SVG_DIRS = {
  social: './public/assets/images/social',
  tokenPage: './public/assets/images/token-page',
  icons: './public/icons',
  // Add more directories as needed
  // tokens: './public/assets/images/tokens',
}

const OUTPUT_BASE_DIR = './src/components/icons/generated'

// Color replacements for making icons dynamic
const COLOR_REPLACEMENTS = {
  '#fff': 'currentColor',
  '#ffffff': 'currentColor',
  '#FFFFFF': 'currentColor',
  white: 'currentColor',
  WHITE: 'currentColor',
  '#000': 'currentColor',
  '#000000': 'currentColor',
  black: 'currentColor',
  '#798391': 'currentColor', // Default gray color
}

// Template for generated components
const componentTemplate = (
  { jsx, imports, interfaces, componentName, exports }: any,
  { tpl }: any
) => {
  return tpl`
${imports}

${interfaces}

export const ${componentName} = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  ${jsx}
)

${componentName}.displayName = '${componentName}'
`
}

// Convert filename to component name
function fileNameToComponentName(fileName: string, category?: string): string {
  const baseName = fileName
    .replace('.svg', '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  // Add category prefix for non-social categories to avoid conflicts
  // Keep social icons without prefix for backward compatibility
  if (category && category !== 'social') {
    const categoryPrefix = category.charAt(0).toUpperCase() + category.slice(1)
    return `${categoryPrefix}${baseName}Icon`
  }

  return `${baseName}Icon`
}

// Process SVG content before transformation
function processSvgContent(svgContent: string): string {
  let processed = svgContent

  // Replace color values
  Object.entries(COLOR_REPLACEMENTS).forEach(([oldColor, newColor]) => {
    // Replace in fill attributes
    processed = processed.replace(
      new RegExp(`fill="${oldColor}"`, 'gi'),
      `fill="${newColor}"`
    )
    // Replace in stroke attributes
    processed = processed.replace(
      new RegExp(`stroke="${oldColor}"`, 'gi'),
      `stroke="${newColor}"`
    )
  })

  return processed
}

// Generate icon component from SVG file
async function generateIcon(
  svgPath: string,
  outputDir: string,
  fileName: string,
  category?: string
): Promise<void> {
  try {
    const svgCode = fs.readFileSync(svgPath, 'utf8')
    const processedSvg = processSvgContent(svgCode)
    const componentName = fileNameToComponentName(fileName, category)

    const jsCode = await transform(
      processedSvg,
      {
        plugins: ['@svgr/plugin-jsx'],
        typescript: true,
        icon: true,
        expandProps: 'end',
        svgProps: {
          width: '{props.size || 12}',
          height: '{props.size || 12}',
        },
        template: componentTemplate,
      },
      { componentName }
    )

    // Enhance the generated code with proper typing
    const enhancedCode = jsCode
      .replace(
        'React.SVGProps<SVGSVGElement>',
        'React.SVGProps<SVGSVGElement> & { size?: number }'
      )
      .replace(
        'import * as React from "react"',
        `'use client'\n\nimport * as React from 'react'`
      )

    const outputPath = path.join(outputDir, `${componentName}.tsx`)
    fs.writeFileSync(outputPath, enhancedCode)

    console.log(`✅ Generated: ${componentName}`)
  } catch (error) {
    console.error(`❌ Failed to generate icon from ${svgPath}:`, error)
  }
}

// Generate index file for exports
function generateIndexFile(
  outputDir: string,
  componentNames: string[],
  category: string
): void {
  const exports = componentNames
    .map((name) => `export { ${name} } from './${name}'`)
    .join('\n')

  // Create unique type names per category
  const categoryPrefix = category.charAt(0).toUpperCase() + category.slice(1)
  const typeName = `${categoryPrefix}IconName`
  const mapName = `${category}IconMap`

  const indexContent = `// Auto-generated file. Do not edit directly.
// Run 'pnpm icons:generate' to regenerate this file.

${exports}

// Type exports
export type ${typeName} = ${componentNames.map((name) => `'${name}'`).join(' | ')}

// Icon map for dynamic usage
export const ${mapName} = {
${componentNames.map((name) => `  ${name}: () => import('./${name}').then(m => m.${name}),`).join('\n')}
} as const
`

  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent)
  console.log('✅ Generated index.ts')
}

// Main generation function
async function generateIcons(): Promise<void> {
  console.log('🎨 Starting icon generation...\n')

  // Process each directory
  for (const [category, svgDir] of Object.entries(SVG_DIRS)) {
    console.log(`📁 Processing ${category} icons from ${svgDir}`)

    if (!fs.existsSync(svgDir)) {
      console.warn(`⚠️  Directory not found: ${svgDir}`)
      continue
    }

    const outputDir = path.join(OUTPUT_BASE_DIR, category)

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Get all SVG files
    const files = fs.readdirSync(svgDir).filter((file) => file.endsWith('.svg'))

    if (files.length === 0) {
      console.warn(`⚠️  No SVG files found in ${svgDir}`)
      continue
    }

    console.log(`📊 Found ${files.length} SVG files`)

    // Generate components
    const componentNames: string[] = []
    for (const file of files) {
      const svgPath = path.join(svgDir, file)
      await generateIcon(svgPath, outputDir, file, category)
      componentNames.push(fileNameToComponentName(file, category))
    }

    // Generate index file for this category
    generateIndexFile(outputDir, componentNames, category)

    console.log(`✨ Generated ${componentNames.length} icons in ${category}\n`)
  }

  // Generate main index file
  const mainIndexContent = Object.keys(SVG_DIRS)
    .map((category) => `export * from './${category}'`)
    .join('\n')

  fs.writeFileSync(
    path.join(OUTPUT_BASE_DIR, 'index.ts'),
    `// Auto-generated file. Do not edit directly.\n// Run 'pnpm icons:generate' to regenerate this file.\n\n${mainIndexContent}\n`
  )

  console.log('🎉 Icon generation complete!')
}

// Run the script
generateIcons().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
