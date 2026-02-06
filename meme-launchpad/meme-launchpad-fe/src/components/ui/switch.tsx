'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base styles
        'inline-flex shrink-0 items-center rounded-full transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
        // Size: using the larger dimensions for consistency
        'h-5 w-9',
        // Unchecked (off) state: dark background with subtle border
        'data-[state=unchecked]:border data-[state=unchecked]:border-[#2B3139] data-[state=unchecked]:bg-[#111319]',
        // Checked (on) state: darker background with yellow border (using !important to override any cached styles)
        'data-[state=checked]:border data-[state=checked]:border-[] data-[state=checked]:!bg-[#191B22]',
        // Focus states
        'focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-[]/50 focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Base styles
          'pointer-events-none block rounded-full transition-all duration-200',
          // Unchecked (off) state: smaller gray thumb on the left
          'data-[state=unchecked]:h-3 data-[state=unchecked]:w-3 data-[state=unchecked]:translate-x-0.5 data-[state=unchecked]:bg-[#2B3139]',
          // Checked (on) state: larger yellow thumb on the right
          'data-[state=checked]:h-4 data-[state=checked]:w-4 data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-[]'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
