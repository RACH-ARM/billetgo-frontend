import { useState, useEffect } from 'react';
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

import { isEventLive, isEventComingSoon } from '../../utils/eventStatus';

function LiveRemaining({ endDate, eventDate, doorsOpenAt }: { eventDate: string; doorsOpenAt: string | null; endDate: string | null }) {
  const compute = () => {
    const startMs = doorsOpenAt ? new Date(doorsOpenAt).getTime() : new Date(eventDate).getTime();
    const endMs = endDate
      ? new Date(endDate).getTime()
      : startMs + 4 * 60 * 60 * 1000;
    const diff = endMs - Date.now();
    if (diff <= 0) return '';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    const t = setInterval(() => setRemaining(compute()), 60_000);
    return () => clearInterval(t);
  }, [eventDate, endDate]);

  if (!remaining) return null;
  return (
    <span className="text-xs font-semibold text-rose-neon">
      Se termine dans {remaining}
    </span>
  );
}

export default function EventCard({ event }: { event: Event }) {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(() => isEventLive(event.eventDate, event.doorsOpenAt, event.endDate));
  const [isComingSoon, setIsComingSoon] = useState(() => isEventComingSoon(event.eventDate, event.doorsOpenAt));

  useEffect(() => {
    const tick = () => {
      setIsLive(isEventLive(event.eventDate, event.doorsOpenAt, event.endDate));
      setIsComingSoon(isEventComingSoon(event.eventDate, event.doorsOpenAt));
    };
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [event.eventDate, event.doorsOpenAt, event.endDate]);

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
      className={`glass-card overflow-hidden group cursor-pointer${isLive ? ' live-card' : ''}`}
      onHoverStart={prefetchEvent}
    >
      <Link to={`/events/${event.id}`}>
        {/* Cover — hauteur dictée par l'image */}
        <div className="relative overflow-hidden bg-bg-secondary">
          {event.coverImageUrl ? (
            <img src={event.coverImageUrl} alt={event.title} className="w-full h-auto block group-hover:scale-105 transition-transform duration-500 opacity-80" />
          ) : (
            <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }}>
              <span className="font-bebas text-2xl tracking-widest text-white/30 px-3 text-center line-clamp-2">{event.title}</span>
              <span className="text-xs text-white/20 uppercase tracking-widest">{event.category}</span>
            </div>
          )}

          {/* Badge EN COURS */}
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-rose-neon/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-neon" />
              </span>
              <span className="text-xs font-bold text-rose-neon tracking-wider">EN COURS</span>
            </div>
          )}

          {/* Badge À VENIR — entre la fin du compte à rebours et l'ouverture des portes */}
          {!isLive && isComingSoon && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-cyan-neon/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-neon" />
              </span>
              <span className="text-xs font-bold text-cyan-neon tracking-wider">À VENIR</span>
            </div>
          )}

          {/* Badge HOT — affiché seulement si pas live ni coming soon */}
          {!isLive && !isComingSoon && event.isHot && !isTotallySoldOut && (
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
        <div className="p-2 sm:p-4">
          <h3 className="font-bebas text-sm sm:text-xl tracking-wide text-white group-hover:text-rose-neon transition-colors line-clamp-2 sm:line-clamp-1 leading-tight">
            {event.title}
          </h3>

          {/* Prix — toujours visible */}
          <div className="mt-1.5 flex items-center justify-between gap-1">
            {isTotallySoldOut ? (
              <span className="font-mono text-white/30 font-bold text-[10px] sm:text-sm">COMPLET</span>
            ) : (
              <span className="font-mono text-cyan-neon font-bold text-[10px] sm:text-base whitespace-nowrap">
                {formatPrice(minPrice)}
              </span>
            )}
            {(event.isCertified || event.organizer?.isCertified) && (
              <span className="hidden sm:block"><CertifiedBadge /></span>
            )}
          </div>

          {/* Détails — masqués sur mobile (3 col trop étroit) */}
          <div className="hidden sm:block">
            <p className="text-xs text-white/50 mt-1">{formatEventDate(event.eventDate)}</p>
            <p className="text-xs text-white/40 mt-0.5 truncate">{event.venueName} — {event.venueCity}</p>

            <div className="mt-3">
              {isLive
                ? <LiveRemaining eventDate={event.eventDate} doorsOpenAt={event.doorsOpenAt} endDate={event.endDate} />
                : isComingSoon
                  ? <span className="text-xs font-semibold text-cyan-neon">Ouverture dans quelques instants</span>
                  : <CountdownTimer date={event.eventDate} />
              }
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className={occupancy >= 85 ? 'text-rose-neon font-semibold' : 'text-white/40'}>
                  {occupancy}% vendus
                </span>
                <span className="text-white/30">{totalSold}/{totalTickets}</span>
              </div>
              <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${occupancy}%`,
                    background: occupancy >= 90
                      ? 'linear-gradient(90deg, #E040FB, #ff4466)'
                      : occupancy >= 70
                      ? 'linear-gradient(90deg, #f59e0b, #E040FB)'
                      : 'linear-gradient(135deg, #7B2FBE, #E040FB)',
                  }}
                />
              </div>
            </div>

            {event.organizer && (
              <div className="mt-3 flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-white/40 truncate">{event.organizer.companyName}</span>
              </div>
            )}
          </div>

          {/* Date courte sur mobile */}
          <p className="sm:hidden text-[10px] text-white/35 mt-0.5 truncate leading-tight">
            {formatEventDate(event.eventDate)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
