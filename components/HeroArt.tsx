export default function HeroArt() {
  return (
    <svg
      viewBox="0 0 520 480"
      xmlns="http://www.w3.org/2000/svg"
      className="hero-art"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glowRing" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="phoneBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f1b3d" />
          <stop offset="100%" stopColor="#1c2b5c" />
        </linearGradient>
      </defs>
      <circle cx="270" cy="220" r="220" fill="url(#glowRing)" />
      <circle cx="270" cy="220" r="150" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" />
      <ellipse cx="270" cy="220" rx="150" ry="55" fill="none" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1.5" />
      <ellipse cx="270" cy="220" rx="55" ry="150" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" />
      <g transform="translate(60 90)" opacity="0.9">
        <path d="M0 22 L38 4 L76 22 L38 40 Z" fill="#ffffff" fillOpacity="0.14" stroke="#ffffff" strokeOpacity="0.35" />
        <path d="M0 22 L0 58 L38 76 L38 40 Z" fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeOpacity="0.25" />
        <path d="M76 22 L76 58 L38 76 L38 40 Z" fill="#ffffff" fillOpacity="0.05" stroke="#ffffff" strokeOpacity="0.25" />
      </g>
      <g transform="translate(45 175) scale(0.7)" opacity="0.7">
        <path d="M0 22 L38 4 L76 22 L38 40 Z" fill="#ffffff" fillOpacity="0.12" stroke="#ffffff" strokeOpacity="0.3" />
        <path d="M0 22 L0 58 L38 76 L38 40 Z" fill="#ffffff" fillOpacity="0.06" stroke="#ffffff" strokeOpacity="0.2" />
        <path d="M76 22 L76 58 L38 76 L38 40 Z" fill="#ffffff" fillOpacity="0.04" stroke="#ffffff" strokeOpacity="0.2" />
      </g>
      <g transform="translate(55 300)" opacity="0.85">
        <path d="M6 26 L58 26 L64 96 L0 96 Z" fill="#ffffff" fillOpacity="0.1" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M18 26 C18 8 46 8 46 26" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
      </g>
      <path d="M120 380 C 180 410, 260 415, 330 390" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
      <path d="M330 390 l -10 -10 M330 390 l 4 -14" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      <path d="M150 60 C 210 30, 300 28, 360 55" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
      <g transform="translate(300 90)">
        <rect x="0" y="0" width="150" height="290" rx="26" fill="url(#phoneBody)" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" />
        <rect x="10" y="14" width="130" height="262" rx="14" fill="#25396f" />
        <circle cx="75" cy="145" r="46" fill="#ffffff" fillOpacity="0.14" />
        <g transform="translate(50 122)" stroke="#ffffff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 0 h8 l7 34 h32 l8 -22 H12" />
          <circle cx="20" cy="44" r="4" fill="#ffffff" stroke="none" />
          <circle cx="42" cy="44" r="4" fill="#ffffff" stroke="none" />
        </g>
      </g>
      <g transform="translate(420 70)" opacity="0.85">
        <circle cx="0" cy="0" r="22" fill="#ffffff" fillOpacity="0.12" stroke="#ffffff" strokeOpacity="0.35" />
        <text x="0" y="6" textAnchor="middle" fontSize="16" fontWeight="700" fill="#ffffff" fillOpacity="0.85">%</text>
      </g>
      <circle cx="120" cy="70" r="4" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="430" cy="260" r="5" fill="#ffffff" fillOpacity="0.4" />
      <circle cx="380" cy="360" r="3.5" fill="#ffffff" fillOpacity="0.5" />
    </svg>
  );
}