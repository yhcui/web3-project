export function FlameIcon({ isActive = false }: { isActive?: boolean }) {
  const fillColor = isActive ? '' : '#545F78'
  const textColor = isActive ? '' : '#545F78'

  return (
    <div className="flex items-center gap-1">
      <svg
        width="10"
        height="12"
        viewBox="0 0 10 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.80986 2.60727C7.12318 3.07631 6.81438 4.40546 6.92311 5.24972C5.72 3.871 5.76932 2.28496 5.76932 0C1.91091 1.4184 2.80734 5.50804 2.69245 6.74991C1.7219 5.9755 1.53856 4.12526 1.53856 4.12526C0.51393 4.63897 0 6.0117 0 7.12504C0 9.8175 2.23865 12 5 12C7.76129 12 10 9.81746 10 7.12504C10 5.52492 8.79505 4.78658 8.80957 2.60727H8.80986Z"
          fill={fillColor}
        />
      </svg>

      {/* <span className="text-sm" style={{ color: textColor }}>
        +2
      </span> */}
    </div>
  )
}
