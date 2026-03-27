import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import type { Event } from '../../types/event';
import { formatEventDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';
import CountdownTimer from './CountdownTimer';
import Badge from '../common/Badge';

interface HeroSectionProps {
  event: Event;
}

export default function HeroSection({ event }: HeroSectionProps) {
  const minPrice = event.ticketCategories.length > 0
    ? Math.min(...event.ticketCategories.map((c) => c.price))
    : 0;

  const totalSold = event.ticketCategories.reduce((a, c) => a + c.quantitySold, 0);
  const totalTickets = event.ticketCategories.reduce((a, c) => a + c.quantityTotal, 0);
  const occupancy = totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0;
  const remaining = totalTickets - totalSold;

  return (
    <section className="relative h-[85vh] min-h-[560px] max-h-[800px] overflow-hidden">
      {/* Background cover */}
      <div className="absolute inset-0 bg-bg">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-contain sm:object-cover object-top"
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 50%, #003060 100%)' }} />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20 sm:via-bg/60 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/20 to-transparent" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-neon/60"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{ y: [-10, 10, -10], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-8 lg:px-16 pb-10 sm:pb-16 max-w-7xl mx-auto">
        <div className="max-w-2xl">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex gap-2 mb-4"
          >
            {event.isFeatured && <Badge variant="rose">A LA UNE</Badge>}
            <Badge variant="gray">{event.category}</Badge>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-bebas text-5xl sm:text-7xl lg:text-8xl tracking-wider text-white leading-none"
          >
            {event.title}
          </motion.h1>

          {event.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-2 text-white/70 font-sora text-lg"
            >
              {event.subtitle}
            </motion.p>
          )}

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/60"
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-rose-neon" />
              {formatEventDate(event.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-violet-neon" />
              {event.venueName} — {event.venueCity}
            </span>
            {remaining > 0 && remaining <= 50 && (
              <span className="text-rose-neon font-semibold animate-pulse">
                Plus que {remaining} billets !
              </span>
            )}
          </motion.div>

          {/* Countdown + Price + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-6 flex flex-wrap items-center gap-6"
          >
            {/* Countdown */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1.5">Compte à rebours</p>
              <CountdownTimer date={event.eventDate} />
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-white/10 hidden sm:block" />

            {/* Price */}
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">À partir de</p>
              <span className="font-mono text-2xl font-bold text-cyan-neon">
                {formatPrice(minPrice)}
              </span>
            </div>
          </motion.div>

          {/* Occupancy bar + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-6 flex flex-wrap items-center gap-4"
          >
            {/* CTA */}
            <Link to={`/events/${event.id}`}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 bg-neon-gradient text-white font-sora font-semibold rounded-xl shadow-neon-rose hover:shadow-neon text-base transition-shadow"
              >
                Réserver maintenant
              </motion.button>
            </Link>

            {/* Occupancy */}
            {totalTickets > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
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
                <span className={`text-xs ${occupancy >= 85 ? 'text-rose-neon font-semibold animate-pulse' : 'text-white/40'}`}>
                  {occupancy}% vendus
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
