import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, BanIcon } from 'lucide-react';
import { useQueryClient } from 'react-query';
import type { Event } from '../../types/event';
import { formatEventDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';
import { eventService } from '../../services/eventService';
import Badge from '../common/Badge';
import CertifiedBadge from '../common/CertifiedBadge';
import CountdownTimer from './CountdownTimer';

export default function EventCard({ event }: { event: Event }) {
  const queryClient = useQueryClient();
  const minPrice = event.ticketCategories.length > 0
    ? Math.min(...event.ticketCategories.map((c) => c.price))
    : 0;

  const prefetchEvent = () => {
    queryClient.prefetchQuery(
      ['event', event.id],
      () => eventService.getEventById(event.id),
      { staleTime: 2 * 60 * 1000 },
    );
  };

  const totalSold = event.ticketCategories.reduce((a, c) => a + c.quantitySold, 0);
  const totalTickets = event.ticketCategories.reduce((a, c) => a + c.quantityTotal, 0);
  const occupancy = totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0;
  const isTotallySoldOut = totalTickets > 0 && event.ticketCategories.every(
    (c) => c.quantityTotal - c.quantitySold - (c.quantityReserved ?? 0) <= 0
  );

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group cursor-pointer"
      onHoverStart={prefetchEvent}
    >
      <Link to={`/events/${event.id}`}>
        {/* Cover */}
        <div className="relative h-48 overflow-hidden bg-bg-secondary">
          {event.coverImageUrl ? (
            <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }}>
              <span className="font-bebas text-2xl tracking-widest text-white/30 px-3 text-center line-clamp-2">{event.title}</span>
              <span className="text-xs text-white/20 uppercase tracking-widest">{event.category}</span>
            </div>
          )}
          {event.isHot && !isTotallySoldOut && (
            <div className="absolute top-3 left-3">
              <Badge variant="rose"><Flame className="w-3 h-3 inline mr-1" />HOT</Badge>
            </div>
          )}
          {isTotallySoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <BanIcon className="w-8 h-8 text-white/60" />
                <span className="font-bebas text-2xl tracking-widest text-white">COMPLET</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 right-3">
            <Badge variant="violet">{event.category}</Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-bebas text-xl tracking-wide text-white group-hover:text-rose-neon transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="text-xs text-white/50 mt-1">{formatEventDate(event.eventDate)}</p>
          <p className="text-xs text-white/40 mt-0.5 truncate">{event.venueName} — {event.venueCity}</p>

          {/* Countdown */}
          <div className="mt-3">
            <CountdownTimer date={event.eventDate} />
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{occupancy}% vendus</span>
              <span>{totalSold}/{totalTickets}</span>
            </div>
            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-gradient rounded-full transition-all duration-500"
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>

          {/* Organizer + Price */}
          <div className="mt-3 flex items-center justify-between gap-2">
            {event.organizer && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-white/40 truncate">{event.organizer.companyName}</span>
                {(event.isCertified || event.organizer.isCertified) && <CertifiedBadge />}
              </div>
            )}
            {isTotallySoldOut ? (
              <span className="font-mono text-white/30 font-bold whitespace-nowrap ml-auto text-sm">COMPLET</span>
            ) : (
              <span className="font-mono text-cyan-neon font-bold whitespace-nowrap ml-auto">
                {formatPrice(minPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
