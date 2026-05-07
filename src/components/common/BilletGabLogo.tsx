import { useId } from 'react';

interface Props {
  className?: string;
  height?: number;
}

export default function BilletGabLogo({ className = '', height = 40 }: Props) {
  const uid = useId().replace(/:/g, '');
  const width = Math.round(height * (215 / 56));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 215 56"
      width={width}
      height={height}
      className={className}
      aria-label="BilletGab"
      role="img"
    >
      {/* B inliné avec les coordonnées exactes du favicon.svg */}
      <svg x="0" y="0" width="56" height="56" viewBox="0 0 512 512">
        <defs>
          <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="512">
            <stop offset="0%" stopColor="#7B2FBE" />
            <stop offset="60%" stopColor="#6A22B5" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <clipPath id={`${uid}cp`}>
            <text
              x="264" y="400"
              textAnchor="middle"
              fontFamily="'Arial Black', 'Franklin Gothic Heavy', Impact, sans-serif"
              fontSize="360"
              fontWeight="900"
            >B</text>
          </clipPath>
          <mask id={`${uid}m`}>
            <rect width="512" height="512" fill="white" />
            <circle cx="158" cy="205" r="44" fill="black" />
            <circle cx="158" cy="318" r="44" fill="black" />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="512" height="512"
          fill={`url(#${uid}g)`}
          clipPath={`url(#${uid}cp)`}
          mask={`url(#${uid}m)`}
        />
      </svg>

      {/* illet violet + Gab cyan */}
      <text
        x="44" y="42"
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
