import { BadgeCheck } from 'lucide-react';

interface CertifiedBadgeProps {
  size?: 'sm' | 'md';
}

export default function CertifiedBadge({ size = 'sm' }: CertifiedBadgeProps) {
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]';
  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} rounded-full bg-cyan-neon/10 border border-cyan-neon/30 text-cyan-neon font-semibold ${textSize} whitespace-nowrap`}
      title="Identité vérifiée par BilletGab"
    >
      <BadgeCheck className={iconSize} />
      Certifié
    </span>
  );
}
