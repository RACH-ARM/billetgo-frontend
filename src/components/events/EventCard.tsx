import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, BanIcon, Heart, UserCheck, UserPlus } from 'lucide-react';
import { useQueryClient, useMutation, useQuery } from 'react-query';
import type { Event } from '../../types/event';
import { formatEventDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';
import { availabilityLevel } from '../../utils/availability';
import { eventService } from '../../services/eventService';
import { likeService } from '../../services/likeService';
import { followService } from '../../services/followService';
import { useAuthStore } from '../../stores/authStore';
import Badge from '../common/Badge';
import CertifiedBadge from '../common/CertifiedBadge';
import CountdownTimer from './CountdownTimer';
import LoginWallModal from '../common/LoginWallModal';
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
  const { isAuthenticated } = useAuthStore();
  const [isLive, setIsLive] = useState(() => isEventLive(event.eventDate, event.doorsOpenAt, event.endDate));
  const [isComingSoon, setIsComingSoon] = useState(() => isEventComingSoon(event.eventDate, event.doorsOpenAt));
  const [loginWallAction, setLoginWallAction] = useState<'like' | 'follow' | null>(null);

  // Like state (initialised from server data)
  const [liked, setLiked] = useState(event.isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(event.likeCount ?? 0);

  // Keep like state in sync if the event prop updates (e.g. after query refetch)
  useEffect(() => {
    setLiked(event.isLikedByMe ?? false);
    setLikeCount(event.likeCount ?? 0);
  }, [event.id, event.isLikedByMe, event.likeCount]);

  // Follow state (from shared "my following" query)
  const { data: followingData } = useQuery(
    ['my-following'],
    () => followService.getFollowing(),
    { enabled: isAuthenticated, staleTime: 5 * 60 * 1000 }
  );
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (followingData && event.organizer?.id) {
      setFollowing(followingData.organizerIds.includes(event.organizer.id));
    }
  }, [followingData, event.organizer?.id]);

  useEffect(() => {
    const tick = () => {
      setIsLive(isEventLive(event.eventDate, event.doorsOpenAt, event.endDate));
      setIsComingSoon(isEventComingSoon(event.eventDate, event.doorsOpenAt));
    };
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [event.eventDate, event.doorsOpenAt, event.endDate]);

  const prefetchEvent = () => {
    queryClient.prefetchQuery(
      ['event', event.id],
      () => eventService.getEventById(event.id),
      { staleTime: 2 * 60 * 1000 },
    );
  };

  const toggleLikeMutation = useMutation(
    () => likeService.toggleLike(event.id),
    {
      onSuccess: (data) => {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        queryClient.invalidateQueries(['event', event.id]);
      },
    }
  );

  const toggleFollowMutation = useMutation(
    () => followService.toggleFollow(event.organizer!.id!),
    {
      onSuccess: (data) => {
        setFollowing(data.following);
        queryClient.invalidateQueries(['my-following']);
        queryClient.invalidateQueries(['organizer-public', event.organizer?.id]);
      },
    }
  );

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLoginWallAction('like'); return; }
    setLiked((v) => !v);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    toggleLikeMutation.mutate();
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { setLoginWallAction('follow'); return; }
    setFollowing((v) => !v);
    toggleFollowMutation.mutate();
  };

  const minPrice = event.ticketCategories.length > 0
    ? Math.min(...event.ticketCategories.map((c) => c.price))
    : 0;

  const totalSold = event.ticketCategories.reduce((a, c) => a + c.quantitySold, 0);
  const totalTickets = event.ticketCategories.reduce((a, c) => a + c.quantityTotal, 0);
  const occupancy = totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0;
  const isTotallySoldOut = totalTickets > 0 && event.ticketCategories.every(
    (c) => c.quantityTotal - c.quantitySold - (c.quantityReserved ?? 0) <= 0
  );

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className={`relative glass-card overflow-hidden group cursor-pointer${isLive ? ' live-card' : ''}`}
        onHoverStart={prefetchEvent}
      >
        {/* Heart button — outside Link to avoid nested interactive elements */}
        <button
          onClick={handleLike}
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 transition-colors hover:bg-black/80"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${liked ? 'fill-rose-neon text-rose-neon' : 'text-white/50'}`} />
          {likeCount > 0 && (
            <span className="text-xs text-white/60 font-mono leading-none">{likeCount}</span>
          )}
        </button>

        <Link to={`/events/${event.id}`}>
          {/* Cover */}
          <div className="relative overflow-hidden bg-bg-secondary">
            {event.coverImageUrl ? (
              <img src={event.coverImageUrl} alt={event.title} className="w-full h-auto block group-hover:scale-105 transition-transform duration-500 opacity-80" />
            ) : (
              <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #2D1060 0%, #0D0D1A 60%, #003060 100%)' }}>
                <span className="font-bebas text-2xl tracking-widest text-white/30 px-3 text-center line-clamp-2">{event.title}</span>
                <span className="text-xs text-white/20 uppercase tracking-widest">{event.category}</span>
              </div>
            )}

            {isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-rose-neon/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-neon opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-neon" />
                </span>
                <span className="text-xs font-bold text-rose-neon tracking-wider">EN COURS</span>
              </div>
            )}

            {!isLive && isComingSoon && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-cyan-neon/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-neon opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-neon" />
                </span>
                <span className="text-xs font-bold text-cyan-neon tracking-wider">À VENIR</span>
              </div>
            )}

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
          <div className="p-3 sm:p-4">
            <h3 className="font-bebas text-base sm:text-xl tracking-wide text-white group-hover:text-rose-neon transition-colors line-clamp-2 leading-tight">
              {event.title}
            </h3>

            <div className="mt-1.5 flex items-center justify-between gap-1">
              {isTotallySoldOut ? (
                <span className="font-mono text-white/30 font-bold text-xs sm:text-sm">COMPLET</span>
              ) : (
                <span className="font-mono text-cyan-neon font-bold text-xs sm:text-base whitespace-nowrap">
                  {formatPrice(minPrice)}
                </span>
              )}
              {(event.isCertified || event.organizer?.isCertified) && (
                <CertifiedBadge />
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-white/50 mt-1 truncate">{formatEventDate(event.eventDate)}</p>

            <div className="mt-2">
              {isLive
                ? <LiveRemaining eventDate={event.eventDate} doorsOpenAt={event.doorsOpenAt} endDate={event.endDate} />
                : isComingSoon
                  ? <span className="text-[11px] sm:text-xs font-semibold text-cyan-neon">Ouverture imminente</span>
                  : <CountdownTimer date={event.eventDate} />
              }
            </div>

            {/* Availability bar — desktop only */}
            <div className="hidden sm:block">
              <p className="text-xs text-white/40 mt-0.5 truncate">{event.venueName} — {event.venueCity}</p>
              {!isTotallySoldOut && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    {(() => { const av = availabilityLevel(occupancy); return (
                      <span className={`font-semibold ${av.color}${av.pulse ? ' animate-pulse' : ''}`}>{av.label}</span>
                    ); })()}
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
              )}
            </div>
          </div>
        </Link>

        {/* Organizer row — outside Link, desktop only */}
        {event.organizer && (
          <div className="hidden sm:flex items-center justify-between gap-2 px-3 sm:px-4 pb-3 -mt-1 min-w-0">
            {event.organizer.id ? (
              <Link
                to={`/organisateurs/${event.organizer.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-white/40 hover:text-violet-neon transition-colors truncate"
              >
                {event.organizer.companyName}
              </Link>
            ) : (
              <span className="text-xs text-white/40 truncate">{event.organizer.companyName}</span>
            )}
            {event.organizer.id && (
              <button
                onClick={handleFollow}
                className={`text-xs font-semibold flex-shrink-0 flex items-center gap-1 transition-colors ${
                  following ? 'text-violet-neon' : 'text-white/30 hover:text-white/60'
                }`}
              >
                {following
                  ? <><UserCheck className="w-3 h-3" />Abonné</>
                  : <><UserPlus className="w-3 h-3" />Suivre</>
                }
              </button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {loginWallAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginWallModal action={loginWallAction} onClose={() => setLoginWallAction(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
