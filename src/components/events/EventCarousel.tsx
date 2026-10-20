import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../../types/event';
import EventCard from './EventCard';

// Carrousel horizontal : swipe tactile natif (scroll-snap) sur mobile,
// clic-glisser à la souris sur desktop. Les deux s'arrêtent "au doigt/curseur"
// grâce au snap-x — pas besoin de JS pour la physique d'arrêt.
export default function EventCarousel({ events }: { events: Event[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const dragged = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = scrollerRef.current;
    if (!el) return;
    isDown.current = true;
    dragged.current = false;
    startX.current = e.clientX;
    scrollStart.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDown.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 4) dragged.current = true;
    el.scrollLeft = scrollStart.current - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!isDown.current) return;
    isDown.current = false;
    scrollerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Empêche le clic d'ouvrir l'événement si on vient de glisser la carte
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
      dragged.current = false;
    }
  };

  return (
    <div className="relative group/carousel">
      {/* Flèches — desktop uniquement, apparaissent au survol */}
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label="Précédent"
        className={`hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-bg-card border border-violet-neon/30 items-center justify-center text-white/70 hover:text-white hover:border-violet-neon/60 shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100 ${!canScrollLeft ? 'pointer-events-none opacity-0' : ''}`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label="Suivant"
        className={`hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-bg-card border border-violet-neon/30 items-center justify-center text-white/70 hover:text-white hover:border-violet-neon/60 shadow-lg transition-all opacity-0 group-hover/carousel:opacity-100 ${!canScrollRight ? 'pointer-events-none opacity-0' : ''}`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Fondus sur les bords pour signaler qu'il y a plus de contenu */}
      <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg to-transparent z-[5] transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent z-[5] transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {events.map((event) => (
          <div key={event.id} className="snap-start flex-shrink-0 w-[46vw] sm:w-[220px] lg:w-[250px]">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
