import { useState, useEffect } from 'react';
import { getCountdownParts } from '../../utils/formatDate';

export default function CountdownTimer({ date }: { date: string }) {
  const [parts, setParts] = useState(getCountdownParts(date));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getCountdownParts(date);
      setParts(next);
      if (!next) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (!parts) return <span className="text-white/50 font-mono text-sm">Terminé</span>;

  const units = [
    { value: parts.days, label: 'J' },
    { value: parts.hours, label: 'H' },
    { value: parts.minutes, label: 'M' },
    { value: parts.seconds, label: 'S' },
  ];

  return (
    <div className="flex gap-2">
      {units.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-mono font-bold text-cyan-neon text-xl min-w-[2.5ch] text-center">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs text-white/40">{label}</span>
        </div>
      ))}
    </div>
  );
}
