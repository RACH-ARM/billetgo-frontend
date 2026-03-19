interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'violet' | 'cyan' | 'rose';
}

const COLORS = {
  violet: 'text-violet-neon',
  cyan: 'text-cyan-neon',
  rose: 'text-rose-neon',
};

export default function StatCard({ title, value, subtitle, color = 'violet' }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <p className="text-xs text-white/50 uppercase tracking-widest">{title}</p>
      <p className={`font-bebas text-4xl mt-1 ${COLORS[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
    </div>
  );
}
