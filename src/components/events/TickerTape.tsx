import { motion } from 'framer-motion';
import type { Event } from '../../types/event';
import { formatPrice } from '../../utils/formatPrice';

export default function TickerTape({ events }: { events: Event[] }) {
  if (!events.length) return null;

  // Dupliquer pour effet infini
  const items = [...events, ...events];

  return (
    <div className="bg-violet-neon/10 border-y border-violet-neon/20 overflow-hidden py-2">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((event, i) => (
          <span key={`${event.id}-${i}`} className="flex items-center gap-3 text-sm flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-neon inline-block" />
            <span className="font-bebas tracking-wider text-white/90 text-base">{event.title}</span>
            <span className="text-white/40">—</span>
            <span className="font-mono text-cyan-neon text-xs">
              {event.ticketCategories.length > 0
                ? formatPrice(Math.min(...event.ticketCategories.map(c => c.price)))
                : 'Gratuit'}
            </span>
            <span className="text-white/20">|</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
