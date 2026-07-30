export default function Seal({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const x1 = 50 + Math.cos(angle) * 44
        const y1 = 50 + Math.sin(angle) * 44
        const x2 = 50 + Math.cos(angle) * 48
        const y2 = 50 + Math.sin(angle) * 48
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" opacity="0.4" />
        )
      })}
      <circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.08" />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="Sora, sans-serif"
        fontWeight="700"
        fontSize="28"
        fill="currentColor"
      >
        PS
      </text>
    </svg>
  )
}
