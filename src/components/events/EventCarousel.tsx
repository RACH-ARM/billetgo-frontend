import { motion } from 'framer-motion';
import type { Event } from '../../types/event';
import EventCard from './EventCard';

const CARD_WIDTH_CLASS = 'flex-shrink-0 w-[46vw] sm:w-[220px] lg:w-[250px]';
const SECONDS_PER_CARD = 6;

// Défilement horizontal continu en boucle, via transform CSS animé par
// Framer Motion (accéléré GPU) — même technique que TickerTape.tsx.
// Une version précédente pilotait le scroll natif (scrollLeft) image par
// image en JS, ce qui saccadait sur plusieurs navigateurs ; le transform
// est parfaitement fluide.
export default function EventCarousel({ events }: { events: Event[] }) {
  if (!events.length) return null;

  if (events.length === 1) {
    return (
      <div className={CARD_WIDTH_CLASS}>
        <EventCard event={events[0]} />
      </div>
    );
  }

  // Liste doublée + translation de 0% à -50% : la deuxième copie prend
  // exactement la place de la première, donc la boucle ne se voit pas.
  const loopEvents = [...events, ...events];
  const duration = events.length * SECONDS_PER_CARD;

  return (
    <div className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
      <motion.div
        className="flex gap-3 sm:gap-4 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {loopEvents.map((event, i) => (
          <div key={`${event.id}-${i}`} className={CARD_WIDTH_CLASS}>
            <EventCard event={event} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
