import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../../types/event';
import EventCard from './EventCard';

const AUTO_SCROLL_SPEED = 45; // px/seconde

// Carrousel horizontal qui défile tout seul en continu (comme TickerTape.tsx,
// mais sur un conteneur scroll natif plutôt qu'une animation CSS transform —
// nécessaire ici car EventCard est interactif : liens, bouton cœur, suivre…
// qui ont besoin du scroll/tap natif, pas d'un simple ruban défilant).
// Le défilement auto se met en pause pendant une interaction (glisser/survol/
// toucher) et reprend après un court délai. Swipe tactile natif (scroll-snap)
// et clic-glisser à la souris restent disponibles par-dessus.
export default function EventCarousel({ events }: { events: Event[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const dragged = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const autoPaused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Liste doublée pour boucler sans à-coup visible : une fois la moitié
  // parcourue (= un cycle complet des vrais événements), on recule
  // instantanément la moitié de la largeur — la deuxième copie prend
  // pile la place de la première, donc le saut ne se voit pas.
  const loopEvents = events.length > 1 ? [...events, ...events] : events;

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || events.length < 2) return;
    let raf: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!autoPaused.current && dt < 0.2) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += AUTO_SCROLL_SPEED * dt;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  const pauseAuto = () => {
    autoPaused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const resumeAutoSoon = (delay: number) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { autoPaused.current = false; }, delay);
  };

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    pauseAuto();
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
    resumeAutoSoon(2000);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pauseAuto();
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
    resumeAutoSoon(1500);
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
    <div
      className="relative group/carousel"
      onMouseEnter={pauseAuto}
      onMouseLeave={() => resumeAutoSoon(300)}
    >
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
        onTouchStart={pauseAuto}
        onTouchEnd={() => resumeAutoSoon(1500)}
        onClickCapture={onClickCapture}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {loopEvents.map((event, i) => (
          <div key={`${event.id}-${i}`} className="snap-start flex-shrink-0 w-[46vw] sm:w-[220px] lg:w-[250px]">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
