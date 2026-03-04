/**
 * Shared InterviewAI mic logo mark.
 * Use size prop to scale the square icon (default 38).
 */
export default function MicLogoSVG({ size = 38 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 38 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="nav-logo-svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="mic-bg" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="mic-wave" x1="0" y1="0" x2="38" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <filter id="mic-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="1.2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Background */}
            <rect width="38" height="38" rx="11" fill="url(#mic-bg)" />

            {/* Mic capsule */}
            <rect x="13.5" y="6" width="11" height="15" rx="5.5" fill="white" opacity="0.95" />

            {/* Inner tinted window */}
            <rect x="16" y="8" width="6" height="9" rx="3" fill="url(#mic-bg)" opacity="0.55" />

            {/* Pickup arc */}
            <path
                d="M9.5 20 C9.5 27.5 28.5 27.5 28.5 20"
                stroke="url(#mic-wave)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
                filter="url(#mic-glow)"
            />

            {/* Stand pole */}
            <line x1="19" y1="27.5" x2="19" y2="32" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />

            {/* Base bar */}
            <line x1="13" y1="32" x2="25" y2="32" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />

            {/* AI scan dot */}
            <circle cx="19" cy="13.5" r="2.5" fill="#22d3ee" filter="url(#mic-glow)" opacity="0.9" />
        </svg>
    )
}
