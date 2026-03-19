import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Flame, Star, Ticket } from 'lucide-react';
import { useQuery } from 'react-query';
import { eventService } from '../services/eventService';
import type { Event, OfferType } from '../types/event';
import { formatPrice } from '../utils/formatPrice';
import { formatDateShort } from '../utils/formatDate';

// ─── Offer sort weight ────────────────────────────────────────────────────────
const OFFER_WEIGHT: Record<OfferType, number> = {
  PREMIUM: 3,
  INTERMEDIAIRE: 2,
  STANDARD: 1,
};

function sortByOffer(events: Event[]): Event[] {
  return [...events].sort((a, b) => OFFER_WEIGHT[b.offer] - OFFER_WEIGHT[a.offer]);
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-52 mr-4 rounded-2xl overflow-hidden bg-white/5 animate-pulse">
      <div className="h-64 bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Event track card ─────────────────────────────────────────────────────────
interface EventTrackCardProps {
  event: Event;
  isPast?: boolean;
}

function EventTrackCard({ event, isPast }: EventTrackCardProps) {
  const minPrice = event.ticketCategories.length
    ? Math.min(...event.ticketCategories.map((c) => c.price))
    : null;

  const totalSold = event.ticketCategories.reduce((s, c) => s + c.quantitySold, 0);

  return (
    <Link
      to={`/events/${event.id}`}
      className="flex-shrink-0 w-52 mr-4 rounded-2xl overflow-hidden glass-card hover:scale-105 transition-transform duration-300 group"
    >
      {/* Portrait image */}
      <div className="relative h-64 overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-neon/20 to-pink-neon/20 flex items-center justify-center">
            <Ticket size={40} className="text-violet-neon/40" />
          </div>
        )}

        {/* Past overlay */}
        {isPast && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
            <span className="text-white/70 text-xs font-medium font-sora uppercase tracking-wider">
              Terminé
            </span>
            <span className="text-cyan-neon font-space text-sm font-bold">
              {totalSold} billets vendus
            </span>
          </div>
        )}

        {/* Badges */}
        {!isPast && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {event.isFeatured && (
              <span className="flex items-center gap-1 bg-violet-neon/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Star size={10} /> A LA UNE
              </span>
            )}
            {event.isHot && !event.isFeatured && (
              <span className="flex items-center gap-1 bg-pink-neon/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Flame size={10} /> HOT
              </span>
            )}
          </div>
        )}

        {/* Price pill */}
        {!isPast && minPrice !== null && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-cyan-neon font-space text-xs font-bold px-2 py-0.5 rounded-full">
            {minPrice === 0 ? 'Gratuit' : `dès ${formatPrice(minPrice)}`}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-white font-sora text-sm font-semibold leading-tight line-clamp-2">
          {event.title}
        </p>
        <div className="flex items-center gap-1 text-white/50 text-xs">
          <Calendar size={11} className="flex-shrink-0" />
          <span className="truncate">{formatDateShort(event.eventDate)}</span>
        </div>
        <div className="flex items-center gap-1 text-white/50 text-xs">
          <MapPin size={11} className="flex-shrink-0" />
          <span className="truncate">{event.venueCity}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Infinite scroll track ────────────────────────────────────────────────────
interface EventScrollTrackProps {
  events: Event[];
  isPast?: boolean;
  duration: number; // seconds for one full loop
  reverse?: boolean;
}

function EventScrollTrack({ events, isPast, duration, reverse }: EventScrollTrackProps) {
  const [paused, setPaused] = useState(false);

  // Duplicate items for seamless loop
  const doubled = useMemo(() => [...events, ...events], [events]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div
        className="flex w-max"
        style={{
          animation: `${reverse ? 'scrollReverse' : 'scrollForward'} ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {doubled.map((event, i) => (
          <EventTrackCard key={`${event.id}-${i}`} event={event} isPast={isPast} />
        ))}
      </div>
    </div>
  );
}

// ─── Section with title + track ───────────────────────────────────────────────
interface TrackSectionProps {
  title: string;
  subtitle: string;
  events: Event[];
  isLoading: boolean;
  isPast?: boolean;
  duration: number;
  reverse?: boolean;
}

function TrackSection({ title, subtitle, events, isLoading, isPast, duration, reverse }: TrackSectionProps) {
  return (
    <section className="space-y-4">
      <div className="px-4 md:px-8 lg:px-16">
        <h2 className="section-title">{title}</h2>
        <p className="text-white/50 font-sora text-sm mt-1">{subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex px-4 md:px-8 lg:px-16 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="px-4 md:px-8 lg:px-16">
          <p className="text-white/30 font-sora text-sm py-8 text-center">
            Aucun événement pour le moment.
          </p>
        </div>
      ) : events.length < 3 ? (
        // Not enough to scroll — just show as a simple row
        <div className="flex px-4 md:px-8 lg:px-16 overflow-x-auto pb-2 scrollbar-hide">
          {events.map((event) => (
            <EventTrackCard key={event.id} event={event} isPast={isPast} />
          ))}
        </div>
      ) : (
        <EventScrollTrack events={events} isPast={isPast} duration={duration} reverse={reverse} />
      )}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { data: upcomingData, isLoading: loadingUpcoming } = useQuery(
    ['events', { timeframe: 'upcoming', limit: 50 }],
    () => eventService.getEvents({ timeframe: 'upcoming', limit: 50 }),
    { staleTime: 30 * 1000 }
  );

  const { data: pastData, isLoading: loadingPast } = useQuery(
    ['events', { timeframe: 'past', limit: 50 }],
    () => eventService.getEvents({ timeframe: 'past', limit: 50 }),
    { staleTime: 30 * 1000 }
  );

  const upcomingEvents = useMemo(
    () => sortByOffer(upcomingData?.events ?? []),
    [upcomingData]
  );

  const pastEvents = useMemo(
    () => pastData?.events ?? [],
    [pastData]
  );

  // Inject CSS keyframes once
  useEffect(() => {
    const id = 'billetgo-scroll-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes scrollForward {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes scrollReverse {
        0%   { transform: translateX(-50%); }
        100% { transform: translateX(0); }
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  return (
    <main className="min-h-screen bg-bg pt-24 pb-16 space-y-16">
      {/* Hero */}
      <div className="px-4 md:px-8 lg:px-16 text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bebas text-gradient tracking-wide">
          Tous les événements
        </h1>
        <p className="text-white/50 font-sora text-base max-w-xl mx-auto">
          Découvrez les prochains événements au Gabon et revivez les meilleurs moments passés.
        </p>
      </div>

      {/* Upcoming track */}
      <TrackSection
        title="A venir"
        subtitle="Les prochains événements à ne pas manquer"
        events={upcomingEvents}
        isLoading={loadingUpcoming}
        isPast={false}
        duration={35}
      />

      {/* Past track */}
      <TrackSection
        title="Événements passés"
        subtitle="Retrouvez les événements qui ont marqué Libreville"
        events={pastEvents}
        isLoading={loadingPast}
        isPast={true}
        duration={50}
        reverse
      />
    </main>
  );
}
