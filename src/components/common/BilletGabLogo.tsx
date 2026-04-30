import { useState, useEffect } from 'react';

interface Props {
  className?: string;
  height?: number;
}

export default function BilletGabLogo({ className = '', height = 36 }: Props) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Garantit un re-rendu SVG une fois Bebas Neue chargée (sécurité Android)
    document.fonts?.load("1em 'Bebas Neue'").then(() => forceUpdate(n => n + 1));
  }, []);

  // Ratio original du viewBox 256×48
  const width = Math.round(height * (256 / 48));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 48"
      width={width}
      height={height}
      className={className}
      aria-label="BilletGab"
      role="img"
    >
      <defs>
        <linearGradient id="bg-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A3E" />
          <stop offset="100%" stopColor="#0E0B20" />
        </linearGradient>
        <linearGradient id="border-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B4FDE" />
          <stop offset="100%" stopColor="#E040FB" />
        </linearGradient>
      </defs>

      {/* Cadre */}
      <rect x="0" y="0" width="48" height="48" rx="11" fill="url(#bg-logo)" />
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="10.4"
        fill="none" stroke="url(#border-logo)" strokeWidth="1.5" />

      {/* B + ILLETGAB — police héritée de la page → Bebas Neue disponible */}
      <text
        x="24" y="34"
        textAnchor="middle"
        fontFamily="'Bebas Neue', 'Arial Black', Arial, sans-serif"
        fontSize="30"
        fill="#E040FB"
      >B</text>
      <text
        x="54" y="34"
        fontFamily="'Bebas Neue', 'Arial Black', Arial, sans-serif"
        fontSize="30"
        letterSpacing="1"
      >
        <tspan fill="#E040FB">ILLET</tspan>
        <tspan fill="#00E5FF">GAB</tspan>
      </text>
    </svg>
  );
}
