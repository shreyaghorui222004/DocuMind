export default function Logo({ size = 30, text = true }) {
  return (
    <span className="logo-wrap">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A855F7" /><stop offset="1" stopColor="#3B82F6" /></linearGradient></defs>
        <rect width="32" height="32" rx="9" fill="#111536" stroke="rgba(255,255,255,.18)" />
        <path d="M9 7h8a9 9 0 0 1 0 18H9z" fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="22" cy="16" r="2" fill="#20D9D2" />
      </svg>
      {text && <span className="logo">DocuMind</span>}
    </span>
  );
}
