# Form Input Components

This document describes reusable form input components available in the project.

## FloatInput

A flexible floating-point number input component that provides proper decimal number handling with configurable validation rules.

### Location

`src/components/ui/float-input.tsx`

### Features

- Proper decimal number validation (prevents multiple decimal points)
- Automatic leading zero handling
- Configurable min/max constraints
- Optional suffix display (e.g., units, symbols)
- Clear-on-focus behavior for zero values
- Format-on-blur for clean display
- Mobile-optimized with decimal keyboard

### Basic Usage

```tsx
import { FloatInput } from '@/components/ui/float-input'

// Basic float input
<FloatInput
  value={value}
  onChange={(val) => setValue(val)}
  placeholder="Enter amount"
/>

// With constraints
<FloatInput
  value={price}
  onChange={setPrice}
  min={0.01}
  max={9999.99}
  placeholder="0.00"
/>

// With suffix
<FloatInput
  value={amount}
  onChange={setAmount}
  suffix="BNB"
  suffixClassName="text-xl font-bold"
/>
```

### Props

| Prop              | Type                                | Default | Description                            |
| ----------------- | ----------------------------------- | ------- | -------------------------------------- |
| `value`           | `number \| string`                  | -       | Current value                          |
| `onChange`        | `(value: number \| string) => void` | -       | Change handler                         |
| `onBlur`          | `(value: number) => void`           | -       | Blur handler with formatted value      |
| `min`             | `number`                            | -       | Minimum allowed value                  |
| `max`             | `number`                            | -       | Maximum allowed value                  |
| `suffix`          | `React.ReactNode`                   | -       | Suffix to display after input          |
| `placeholder`     | `string`                            | `"0"`   | Placeholder text                       |
| `className`       | `string`                            | -       | Container className                    |
| `inputClassName`  | `string`                            | -       | Input element className                |
| `suffixClassName` | `string`                            | -       | Suffix element className               |
| `allowEmpty`      | `boolean`                           | `true`  | Allow empty input                      |
| `clearOnFocus`    | `boolean`                           | `true`  | Clear input when focused if value is 0 |
| `formatOnBlur`    | `boolean`                           | `true`  | Format value on blur                   |

## PercentageInput

A specialized input component for percentage values, built on top of FloatInput with percentage-specific features.

### Location

`src/components/ui/percentage-input.tsx`

### Features

- All FloatInput features
- Built-in percentage symbol display
- Quick select buttons for common values
- Default 0-100 range (customizable)
- Mobile-optimized UI

### Basic Usage

```tsx
import { PercentageInput } from '@/components/ui/percentage-input'

// Basic percentage input (0-100%)
<PercentageInput
  value={percentage}
  onChange={setPercentage}
/>

// With quick select buttons
<PercentageInput
  value={discount}
  onChange={setDiscount}
  showQuickSelect={true}
  quickSelectOptions={[
    { label: '5%', value: 5 },
    { label: '10%', value: 10 },
    { label: '15%', value: 15 },
  ]}
/>

// Custom range (e.g., 0-99.9%)
<PercentageInput
  value={preBuy}
  onChange={setPreBuy}
  min={0}
  max={99.9}
  showQuickSelect={true}
/>
```

### Props

Extends all FloatInput props with:

| Prop                     | Type                      | Default           | Description                   |
| ------------------------ | ------------------------- | ----------------- | ----------------------------- |
| `quickSelectOptions`     | `QuickSelectOption[]`     | `[10%, 25%, 50%]` | Quick select button options   |
| `showQuickSelect`        | `boolean`                 | `false`           | Show quick select buttons     |
| `quickSelectClassName`   | `string`                  | -                 | Quick select button className |
| `onQuickSelect`          | `(value: number) => void` | -                 | Quick select handler          |
| `showPercentSymbol`      | `boolean`                 | `true`            | Show % symbol                 |
| `percentSymbolClassName` | `string`                  | -                 | % symbol className            |

### QuickSelectOption Type

```typescript
interface QuickSelectOption {
  label: string // Display text for button
  value: number // Numeric value to set
}
```

## Usage in Forms

### With React Hook Form

```tsx
import { useForm } from 'react-hook-form'
import { PercentageInput } from '@/components/ui/percentage-input'

function MyForm() {
  const form = useForm()

  return (
    <FormField
      control={form.control}
      name="percentage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Percentage</FormLabel>
          <FormControl>
            <PercentageInput
              value={field.value}
              onChange={field.onChange}
              showQuickSelect={true}
              min={0}
              max={100}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
```

### Custom Validation Examples

```tsx
// Amount input with BNB suffix
<FloatInput
  value={bnbAmount}
  onChange={setBnbAmount}
  min={0.001}  // Minimum 0.001 BNB
  max={10000}  // Maximum 10000 BNB
  suffix="BNB"
  placeholder="0.000"
/>

// Interest rate (0-20%)
<PercentageInput
  value={interestRate}
  onChange={setInterestRate}
  min={0}
  max={20}
  quickSelectOptions={[
    { label: '5%', value: 5 },
    { label: '10%', value: 10 },
    { label: '15%', value: 15 },
  ]}
/>

// Token allocation (must be > 0)
<FloatInput
  value={allocation}
  onChange={setAllocation}
  min={0.01}
  max={999999}
  suffix="tokens"
/>
```

## Styling

Both components use Tailwind CSS and accept className props for customization:

```tsx
<PercentageInput
  value={value}
  onChange={onChange}
  inputClassName="h-[60px] text-3xl font-bold bg-dark"
  percentSymbolClassName="text-3xl text-primary"
  quickSelectClassName="h-[60px] px-6 bg-secondary"
/>
```

## Mobile Optimization

Both components are optimized for mobile devices:

- Use `inputMode="decimal"` for numeric keyboard
- Proper touch target sizes (minimum 44x44px)
- Clear visual feedback on interaction
- Prevents zoom on focus in mobile browsers

## Accessibility

- Proper ARIA attributes
- Keyboard navigation support
- Clear focus states
- Screen reader compatible
- Semantic HTML structure

## Migration Guide

If migrating from custom float/percentage inputs:

1. Replace custom input logic with FloatInput/PercentageInput
2. Map your validation rules to min/max props
3. Use onChange for value updates
4. Apply custom styles via className props
5. Test on mobile devices for keyboard behavior
