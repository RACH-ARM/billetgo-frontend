import { useId } from 'react';

interface Props {
  className?: string;
  height?: number;
}

export default function BilletGabLogo({ className = '', height = 40 }: Props) {
  const uid = useId().replace(/:/g, '');
  const width = Math.round(height * (190 / 56));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 190 56"
      width={width}
      height={height}
      className={className}
      aria-label="BilletGab"
      role="img"
    >
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="5" x2="0" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7B2FBE" />
          <stop offset="60%" stopColor="#6A22B5" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        {/* Forme du B utilisée comme clipPath */}
        <clipPath id={`${uid}cp`}>
          <text
            x="22" y="52"
            textAnchor="middle"
            fontFamily="'Arial Black', 'Franklin Gothic Heavy', Impact, sans-serif"
            fontSize="66"
            fontWeight="900"
          >B</text>
        </clipPath>
        {/* Masque pour les encoches */}
        <mask id={`${uid}m`}>
          <rect width="190" height="56" fill="white" />
          <circle cx="1" cy="20" r="9" fill="black" />
          <circle cx="1" cy="37" r="9" fill="black" />
        </mask>
      </defs>

      {/* Rect gradient clipé à la forme du B → fiable sur tous navigateurs */}
      <rect
        x="0" y="0" width="45" height="56"
        fill={`url(#${uid}g)`}
        clipPath={`url(#${uid}cp)`}
        mask={`url(#${uid}m)`}
      />

      {/* illet violet + Gab cyan */}
      <text
        x="47" y="40"
        fontFamily="'Arial Black', 'Franklin Gothic Heavy', sans-serif"
        fontSize="34"
        fontWeight="900"
      >
        <tspan fill="#7B2FBE">illet</tspan>
        <tspan fill="#00E5FF">Gab</tspan>
      </text>
    </svg>
  );
}
