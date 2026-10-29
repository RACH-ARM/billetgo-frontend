import { useRef, useEffect } from 'react';
import type { Event } from '../../types/event';
import EventCard from './EventCard';

const AUTO_SCROLL_SPEED = 45; // px/seconde

// Carrousel horizontal qui défile tout seul en continu (comme TickerTape.tsx,
// mais sur un conteneur scroll natif plutôt qu'une animation CSS transform —
// nécessaire ici car EventCard est interactif : liens, bouton cœur, suivre…
// qui ont besoin du scroll/tap natif, pas d'un simple ruban défilant).
// Le défilement auto se met en pause pendant une interaction (glisser/survol/
// toucher) et reprend après un court délai. Glisser à la souris/au doigt
// reste possible par-dessus.
export default function EventCarousel({ events }: { events: Event[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const dragged = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const autoPaused = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Liste doublée pour boucler sans à-coup visible : une fois la moitié
  // parcourue (= un cycle complet des vrais événements), on recule
  // instantanément la moitié de la largeur — la deuxième copie prend
  // pile la place de la première, donc le saut ne se voit pas.
  const loopEvents = events.length > 1 ? [...events, ...events] : events;

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
  }, [events.length]);

  const pauseAuto = () => {
    autoPaused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const resumeAutoSoon = (delay: number) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { autoPaused.current = false; }, delay);
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
      className="relative"
      onMouseEnter={pauseAuto}
      onMouseLeave={() => resumeAutoSoon(300)}
    >
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onTouchStart={pauseAuto}
        onTouchEnd={() => resumeAutoSoon(1500)}
        onClickCapture={onClickCapture}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {loopEvents.map((event, i) => (
          <div key={`${event.id}-${i}`} className="flex-shrink-0 w-[46vw] sm:w-[220px] lg:w-[250px]">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
