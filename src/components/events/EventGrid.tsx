import type { Event } from '../../types/event';
import EventCard from './EventCard';

function SkeletonEventCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-white/[0.07]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/[0.07] rounded-lg w-3/4" />
        <div className="h-3 bg-white/[0.05] rounded-lg w-1/2" />
        <div className="h-3 bg-white/[0.05] rounded-lg w-2/3" />
        <div className="mt-2 space-y-1.5">
          <div className="flex justify-between">
            <div className="h-2.5 bg-white/[0.05] rounded-full w-1/4" />
            <div className="h-2.5 bg-white/[0.05] rounded-full w-1/5" />
          </div>
          <div className="h-1.5 bg-white/[0.05] rounded-full w-full" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-white/[0.07] rounded-lg w-1/3" />
          <div className="h-3 bg-white/[0.04] rounded-lg w-1/5" />
        </div>
      </div>
    </div>
  );
}

interface EventGridProps {
  events: Event[];
  isLoading?: boolean;
}

export default function EventGrid({ events, isLoading }: EventGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonEventCard key={i} />)}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 text-lg">Aucun événement trouvé</p>
        <p className="text-white/20 text-sm mt-2">Revenez bientôt !</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
