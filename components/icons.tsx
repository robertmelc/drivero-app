export function GaugeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" fill="none">
      <defs>
        <linearGradient id="arcGrad" x1="20" y1="100" x2="112" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1F9D57" />
          <stop offset="1" stopColor="#B9FFD8" />
        </linearGradient>
        <radialGradient id="needleGrad" cx="0.3" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#EAFFF3" />
          <stop offset="1" stopColor="#34E37A" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="128" height="128" rx="30" fill="#0B1710" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
      <path d="M28 92 A 38 38 0 1 1 104 92" stroke="#1A3B2C" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M28 92 A 38 38 0 0 1 88 55" stroke="url(#arcGrad)" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="66" cy="80" r="7" fill="url(#needleGrad)" />
      <line x1="66" y1="80" x2="90" y2="58" stroke="url(#needleGrad)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function CarSideIcon({ width = 30, height = 14, className }: { width?: number; height?: number; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 90" fill="currentColor" className={className}>
      <path d="M8,54 C8,47 13,42 20,42 L34,42 C42,26 60,16 82,16 L128,16 C148,16 164,25 172,40 L184,42 C192,43 198,49 198,56 L198,60 C198,65 194,69 189,69 L180,69 L20,69 C13,69 8,64 8,58 Z" />
      <circle cx="52" cy="69" r="16" />
      <circle cx="156" cy="69" r="16" />
    </svg>
  );
}
