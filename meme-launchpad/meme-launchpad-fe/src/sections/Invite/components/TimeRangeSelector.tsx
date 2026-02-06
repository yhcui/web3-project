interface TimeRangeSelectorProps {
  value: '7d' | '30d'
  onChange: (value: '7d' | '30d') => void
}

export default function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('7d')}
        className={`rounded-md px-3 py-1 text-[12px] transition-colors ${
          value === '7d'
            ? 'bg-[#2B3139] text-white hover:bg-[#3F475A]'
            : 'text-[#798391]'
        }`}
      >
        近7天
      </button>
      <button
        onClick={() => onChange('30d')}
        className={`rounded-md px-3 py-1 text-[12px] transition-colors ${
          value === '30d'
            ? 'bg-[#2B3139] text-white hover:bg-[#3F475A]'
            : 'text-[#798391]'
        }`}
      >
        近30天
      </button>
    </div>
  )
}
