interface BadgeProps {
  children: React.ReactNode;
  variant?: 'violet' | 'cyan' | 'rose' | 'green' | 'gray';
  className?: string;
}

const VARIANTS = {
  violet: 'bg-violet-neon/20 text-violet-neon border-violet-neon/30',
  cyan: 'bg-cyan-neon/20 text-cyan-neon border-cyan-neon/30',
  rose: 'bg-rose-neon/20 text-rose-neon border-rose-neon/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  gray: 'bg-white/10 text-white/60 border-white/20',
};

export default function Badge({ children, variant = 'violet', className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
