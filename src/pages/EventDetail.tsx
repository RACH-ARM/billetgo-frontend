import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap, X, ArrowRight, Minus, Plus, MapPin, Share2, Copy, Check as CheckIcon, Star, MessageSquare, Bell, BellOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { useEvent } from '../hooks/useEvents';
import { eventService } from '../services/eventService';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { formatEventDate } from '../utils/formatDate';
import { formatPrice } from '../utils/formatPrice';
import CountdownTimer from '../components/events/CountdownTimer';
import EventCard from '../components/events/EventCard';
import Badge from '../components/common/Badge';
import CertifiedBadge from '../components/common/CertifiedBadge';
import Button from '../components/common/Button';
import type { TicketCategory } from '../types/event';
import api from '../services/api';
import toast from 'react-hot-toast';

const SITE_URL = 'https://billetgab.com';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id!);
  const { setEvent, addItem, getTotalItems, getTotalAmount } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeGallery, setActiveGallery] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  // Reviews
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const { data: recommendedData } = useQuery(
    ['events-recommended', id, event?.category],
    () => eventService.getEvents({ category: event!.category, limit: 4 }).then((d) =>
      d.events.filter((e) => e.id !== id).slice(0, 3)
    ),
    { enabled: !!event, staleTime: 2 * 60 * 1000 }
  );

  const { data: reviewsData } = useQuery(
    ['event-reviews', id],
    () => api.get(`/events/${id}/reviews`).then((r) => r.data.data),
    { enabled: !!id, staleTime: 60 * 1000 }
  );

  const { data: myReviewData } = useQuery(
    ['my-review', id],
    () => api.get(`/events/${id}/reviews/mine`).then((r) => r.data.data),
    { enabled: !!id && isAuthenticated && user?.role === 'BUYER', staleTime: 60 * 1000 }
  );

  const submitReview = useMutation(
    (payload: { rating: number; comment: string }) =>
      api.post(`/events/${id}/reviews`, payload).then((r) => r.data.data),
    {
      onSuccess: () => {
        toast.success('Avis publié avec succès');
        queryClient.invalidateQueries(['event-reviews', id]);
        queryClient.invalidateQueries(['my-review', id]);
      },
      onError: (err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message || 'Impossible de soumettre l\'avis');
      },
    }
  );

  const handleSubmitReview = () => {
    if (reviewRating < 1) { toast.error('Sélectionne une note entre 1 et 5'); return; }
    submitReview.mutate({ rating: reviewRating, comment: reviewComment.trim() });
  };

  // Waitlist
  const { data: waitlistStatus, isError: waitlistError } = useQuery(
    ['waitlist-status', id],
    () => api.get(`/events/${id}/waitlist/status`).then((r) => r.data.data),
    { enabled: !!id && isAuthenticated && user?.role === 'BUYER', staleTime: 60 * 1000 }
  );

  const joinWaitlist = useMutation(
    () => api.post(`/events/${id}/waitlist`, {}).then((r) => r.data),
    {
      onSuccess: (d) => { toast.success(d.message); queryClient.invalidateQueries(['waitlist-status', id]); },
      onError: (err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message || 'Erreur lors de l\'inscription');
      },
    }
  );

  const leaveWaitlist = useMutation(
    () => api.delete(`/events/${id}/waitlist`).then((r) => r.data),
    {
      onSuccess: () => { toast.success('Vous avez quitté la liste d\'attente'); queryClient.invalidateQueries(['waitlist-status', id]); },
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen animate-pulse">
        {/* Banner */}
        <div className="h-72 md:h-[480px] bg-white/[0.06]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Colonne gauche */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bloc compte à rebours */}
              <div className="glass-card p-5 flex flex-wrap gap-8">
                <div className="space-y-2">
                  <div className="h-2.5 bg-white/[0.05] rounded w-28" />
                  <div className="flex gap-3">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="h-8 w-10 bg-white/[0.07] rounded-lg" />
                        <div className="h-2 w-8 bg-white/[0.04] rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:block w-px bg-white/10 self-stretch" />
                <div className="space-y-2">
                  <div className="h-2.5 bg-white/[0.05] rounded w-16" />
                  <div className="h-4 bg-white/[0.07] rounded w-52" />
                </div>
              </div>

              {/* Bloc description */}
              <div className="glass-card p-6 space-y-3">
                <div className="h-5 bg-white/[0.07] rounded w-28" />
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-3 bg-white/[0.05] rounded ${i === 5 ? 'w-2/3' : 'w-full'}`} />
                ))}
              </div>

              {/* Bloc lieu */}
              <div className="glass-card p-6 space-y-4">
                <div className="h-5 bg-white/[0.07] rounded w-16" />
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.07] flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/[0.07] rounded w-1/2" />
                    <div className="h-3 bg-white/[0.05] rounded w-3/4" />
                  </div>
                </div>
                <div className="h-40 bg-white/[0.04] rounded-xl" />
              </div>
            </div>

            {/* Colonne droite — billets */}
            <div className="space-y-4">
              <div className="h-7 bg-white/[0.07] rounded w-44" />
              {[0,1,2].map(i => (
                <div key={i} className="glass-card p-4 border border-white/5 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-white/[0.07] rounded w-1/3" />
                    <div className="h-4 bg-white/[0.07] rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-white/[0.05] rounded w-1/4" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-white/[0.06] rounded-lg w-24" />
                    <div className="h-8 bg-white/[0.06] rounded-lg flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-white/50 text-lg">Événement non trouvé</p>
        <Link to="/" className="text-violet-neon hover:underline">← Retour à l'accueil</Link>
      </div>
    );
  }

  const totalSold = event.ticketCategories.reduce((a, c) => a + c.quantitySold, 0);
  const totalTickets = event.ticketCategories.reduce((a, c) => a + c.quantityTotal, 0);
  const occupancy = totalTickets > 0 ? Math.round((totalSold / totalTickets) * 100) : 0;
  const isCompleted = event.status === 'COMPLETED';

  const handleAddToCart = (category: TicketCategory) => {
    const qty = quantities[category.id] || 1;
    const available = category.quantityTotal - category.quantitySold - category.quantityReserved;
    if (qty > available) {
      toast.error(`Seulement ${available} place(s) disponible(s)`);
      return;
    }
    const cartEvent = useCartStore.getState().event;
    if (!cartEvent || cartEvent.id !== event.id) setEvent(event);
    addItem(category, qty);
    toast.success(`${qty}× ${category.name} ajouté(s) au panier`);
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    navigate('/checkout');
  };

  const allImages = [
    ...(event.coverImageUrl ? [event.coverImageUrl] : []),
    ...event.galleryUrls,
  ];

  const pageUrl = window.location.href;
  const shareText = `${event.title} — ${new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${event.venueName}, Libreville. Réserve ton billet sur BilletGab !`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + pageUrl)}`, '_blank');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Lien copié !');
  };

  const minPrice = event.ticketCategories?.length
    ? Math.min(...event.ticketCategories.map((c: TicketCategory) => c.price))
    : 0;
  const seoTitle = `${event.title} — ${event.venueCity} | BilletGab`;
  const seoDesc = event.description
    ? event.description.slice(0, 160)
    : `Réservez vos billets pour ${event.title} le ${new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${event.venueName}, ${event.venueCity}. À partir de ${formatPrice(minPrice)} sur BilletGab.`;
  const seoUrl = `${SITE_URL}/events/${event.id}`;
  const seoImage = event.coverImageUrl ?? `${SITE_URL}/og-default.jpg`;

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={seoUrl} />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="BilletGab" />
        <meta property="og:locale" content="fr_GA" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={seoImage} />
      </Helmet>

      {/* Hero Banner */}
      <div className="relative h-72 md:h-[480px] overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-neon-gradient opacity-25" />
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/50 to-transparent" />

        {/* Back link */}
        <div className="absolute top-6 left-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm bg-bg/50 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-8 left-6 right-6 sm:left-10 sm:right-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="violet">{event.category}</Badge>
            {event.isFeatured && <Badge variant="rose">À LA UNE</Badge>}
          </div>
          <h1 className="font-bebas text-4xl sm:text-6xl md:text-7xl tracking-wider text-white drop-shadow-2xl leading-none">
            {event.title}
          </h1>
          {event.subtitle && (
            <p className="text-white/70 font-sora mt-2 text-base sm:text-lg">{event.subtitle}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ===== LEFT COL ===== */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            {/* Countdown + date */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 flex flex-wrap gap-6 items-center"
            >
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Compte à rebours</p>
                <CountdownTimer date={event.eventDate} />
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" />
              <div className="flex flex-col gap-1">
                <p className="text-xs text-white/40 uppercase tracking-widest">Date</p>
                <p className="text-white font-sora font-semibold">{formatEventDate(event.eventDate)}</p>
              </div>
              {event.doorsOpenAt && (
                <>
                  <div className="w-px h-10 bg-white/10 hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Ouverture des portes</p>
                    <p className="text-white/70 font-mono text-sm">
                      {new Date(event.doorsOpenAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </>
              )}
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-6"
            >
              <h2 className="font-bebas text-xl tracking-wider text-white mb-4">À propos</h2>
              <p className={`text-white/60 text-sm leading-relaxed whitespace-pre-line ${!descExpanded ? 'line-clamp-3' : ''}`}>
                {event.description}
              </p>
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-2 text-xs text-violet-neon hover:underline"
              >
                {descExpanded ? 'Réduire' : 'Lire plus'}
              </button>
            </motion.div>

            {/* Partage */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex items-center gap-2 text-white/50">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Partager cet événement</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366' }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 text-white/60 hover:border-violet-neon/40 hover:text-violet-neon transition-all"
                >
                  {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </button>
              </div>
            </motion.div>

            {/* Gallery */}
            {allImages.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-5"
              >
                <h2 className="font-bebas text-xl tracking-wider text-white mb-4">Galerie</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveGallery(url)}
                      className="aspect-square rounded-xl overflow-hidden group relative"
                    >
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Venue */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h2 className="font-bebas text-xl tracking-wider text-white mb-4">Lieu</h2>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-neon/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-violet-neon" />
                </div>
                <div>
                  <p className="text-white font-semibold">{event.venueName}</p>
                  <p className="text-white/50 text-sm mt-0.5">{event.venueAddress}</p>
                  <p className="text-white/50 text-sm">{event.venueCity}</p>
                </div>
              </div>

              {/* Map link */}
              {(() => {
                const mapsUrl = event.venueLatitude && event.venueLongitude
                  ? `https://www.google.com/maps?q=${event.venueLatitude},${event.venueLongitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.venueAddress}, ${event.venueCity}`)}`;
                return (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-between h-14 rounded-xl bg-bg-secondary border border-white/5 hover:border-violet-neon/30 px-4 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-violet-neon" />
                      </div>
                      <span className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
                        Voir sur Google Maps
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-violet-neon transition-colors" />
                  </a>
                );
              })()}
            </motion.div>

            {/* Organizer */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="font-bebas text-xl tracking-wider text-white mb-4">Organisateur</h2>
              <div className="flex items-center gap-4">
                {event.organizer.logoUrl ? (
                  <img
                    src={event.organizer.logoUrl}
                    alt={event.organizer.companyName}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-neon-gradient flex items-center justify-center text-white font-bebas text-2xl flex-shrink-0">
                    {event.organizer.companyName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{event.organizer.companyName}</p>
                    {(event.isCertified || event.organizer.isCertified) && <CertifiedBadge size="md" />}
                  </div>
                  {event.organizer.description && (
                    <p className="text-white/50 text-sm mt-0.5 line-clamp-2">{event.organizer.description}</p>
                  )}
                  {event.organizer.id && (
                    <Link
                      to={`/organisateurs/${event.organizer.id}`}
                      className="inline-flex items-center gap-1 text-xs text-violet-neon/70 hover:text-violet-neon mt-1.5 transition-colors"
                    >
                      Voir tous ses événements
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Reviews */}
            {(() => {
              const reviews: Array<{ id: string; rating: number; comment: string | null; createdAt: string; user: { firstName: string; lastName: string } }> = reviewsData?.reviews ?? [];
              const avgRating: number | null = reviewsData?.avgRating ?? null;
              const myReview = myReviewData?.review ?? null;
              const hasPurchased: boolean = myReviewData?.hasPurchased ?? false;
              const isPast = event && new Date(event.eventDate) < new Date();
              const isBuyer = user?.role === 'BUYER';
              const canReview = isAuthenticated && isBuyer && isPast && hasPurchased;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bebas text-xl tracking-wider text-white">Avis</h2>
                    {avgRating !== null && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-sm text-white/70">
                          {avgRating.toFixed(1)} <span className="text-white/30">({reviewsData?.total ?? 0})</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Invite à se connecter pour les visiteurs non connectés sur un événement passé */}
                  {isPast && !isAuthenticated && (
                    <div className="mb-4 p-4 rounded-xl bg-bg-secondary border border-white/5 text-center">
                      <p className="text-white/50 text-sm mb-2">Tu as assisté à cet événement ?</p>
                      <button
                        onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)}
                        className="text-violet-neon hover:text-rose-neon text-sm font-semibold transition-colors"
                      >
                        Connecte-toi pour laisser un avis
                      </button>
                    </div>
                  )}

                  {/* Acheteur connecté mais sans billet pour cet événement */}
                  {isPast && isAuthenticated && isBuyer && !hasPurchased && (
                    <div className="mb-4 p-4 rounded-xl bg-bg-secondary border border-white/5 text-center">
                      <p className="text-white/40 text-sm">Seuls les acheteurs ayant assisté à cet événement peuvent laisser un avis.</p>
                    </div>
                  )}

                  {/* Review form */}
                  {canReview && (
                    <div className="mb-6 p-4 rounded-xl bg-bg-secondary border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-3">
                        {myReview ? 'Modifier votre avis' : 'Laisser un avis'}
                      </p>
                      {/* Star picker */}
                      <div className="flex gap-1 mb-3">
                        {[1,2,3,4,5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setReviewHover(s)}
                            onMouseLeave={() => setReviewHover(0)}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                s <= (reviewHover || reviewRating || (myReview?.rating ?? 0))
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-white/20'
                              }`}
                            />
                          </button>
                        ))}
                        {(reviewRating > 0 || myReview) && (
                          <span className="ml-2 self-center text-sm text-white/50">
                            {(['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'] as const)[reviewRating || (myReview?.rating ?? 0)]}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={reviewComment !== '' ? reviewComment : (myReview?.comment ?? '')}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Décrivez votre expérience (optionnel)"
                        rows={3}
                        className="w-full bg-bg rounded-lg border border-white/10 text-white/80 text-sm p-3 resize-none focus:outline-none focus:border-violet-neon/50 placeholder-white/20"
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleSubmitReview}
                          disabled={submitReview.isLoading}
                        >
                          {myReview ? 'Mettre à jour' : 'Publier'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reviews list */}
                  {reviews.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <MessageSquare className="w-8 h-8 text-white/15" strokeWidth={1.5} />
                      <p className="text-white/30 text-sm">
                        {isPast ? 'Aucun avis pour le moment' : 'Les avis seront disponibles après l\'événement'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-white/80">
                              {r.user.firstName} {r.user.lastName.charAt(0)}.
                            </span>
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {r.comment && (
                            <p className="text-white/50 text-sm leading-relaxed">{r.comment}</p>
                          )}
                          <p className="text-white/25 text-xs mt-1">
                            {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* Sales progress — masqué pour les événements terminés */}
            {!isCompleted && <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-5"
            >
              <div className="flex justify-between text-sm mb-3">
                <span className="text-white/60 font-semibold">{occupancy}% des billets vendus</span>
                <span className="text-white/40 font-mono">{totalSold}/{totalTickets}</span>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${occupancy}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-neon-gradient rounded-full"
                />
              </div>
              {totalTickets - totalSold <= 50 && totalTickets - totalSold > 0 && (
                <p className="mt-2 text-xs text-rose-neon animate-pulse flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Plus que {totalTickets - totalSold} place(s) disponible(s) !
                </p>
              )}
            </motion.div>}

          </div>

          {/* ===== RIGHT COL — Ticket panel ===== */}
          <div className="space-y-4 order-1 lg:order-2">
            {isCompleted ? (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6 border border-white/10 text-center"
              >
                <p className="font-bebas text-2xl tracking-wider text-white/40 mb-1">ÉVÉNEMENT TERMINÉ</p>
                <p className="text-white/30 text-sm">Cet événement s'est déroulé le {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
              </motion.div>
            ) : (
              <>
                <motion.h2
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bebas text-2xl tracking-wider text-white"
                >
                  Billets disponibles
                </motion.h2>

                {event.ticketCategories
              .filter((cat) => cat.isVisible)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat, i) => {
                const available = cat.quantityTotal - cat.quantitySold - cat.quantityReserved;
                const isSoldOut = available <= 0;
                const qty = quantities[cat.id] || 1;
                const maxQty = Math.min(cat.maxPerOrder, available);
                const atMax = qty >= maxQty;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass-card p-4 border transition-colors ${
                      isSoldOut ? 'border-white/5 opacity-60' : 'border-violet-neon/20 hover:border-violet-neon/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-white">{cat.name}</h3>
                      <span className="font-mono font-bold text-cyan-neon text-sm">{formatPrice(cat.price)}</span>
                    </div>

                    {/* Description */}
                    {cat.description && (
                      <p className="text-xs text-white/50 mb-2">{cat.description}</p>
                    )}

                    {/* Availability */}
                    <p className={`text-xs mb-3 font-semibold ${isSoldOut ? 'text-rose-neon' : available <= 10 ? 'text-rose-neon animate-pulse' : 'text-white/30'}`}>
                      {isSoldOut
                        ? 'COMPLET'
                        : available <= 10
                        ? `⚡ Plus que ${available} place${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''} !`
                        : `${available} place${available > 1 ? 's' : ''} restante${available > 1 ? 's' : ''}`}
                    </p>

                    {/* Qty + Add */}
                    {!isSoldOut && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-violet-neon/20 rounded-lg overflow-hidden">
                            <button
                              onClick={() => setQuantities((q) => ({ ...q, [cat.id]: Math.max(1, qty - 1) }))}
                              disabled={qty <= 1}
                              className="px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-violet-neon/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 py-1.5 text-white text-sm font-mono min-w-[2ch] text-center bg-bg-secondary">
                              {qty}
                            </span>
                            <button
                              onClick={() => setQuantities((q) => ({ ...q, [cat.id]: Math.min(maxQty, qty + 1) }))}
                              disabled={atMax}
                              className="px-2.5 py-1.5 text-white/60 hover:text-white hover:bg-violet-neon/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAddToCart(cat)}
                          >
                            Ajouter
                          </Button>
                        </div>
                        {/* Message limite atteinte */}
                        {atMax && (
                          <p className="text-xs text-amber-400/80 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {qty >= available
                              ? `Maximum disponible atteint (${available} place${available > 1 ? 's' : ''})`
                              : `Limite par commande atteinte (${cat.maxPerOrder} max)`}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

            {/* Waitlist — si tous les billets sont complets */}
            {(() => {
              const allSoldOut = event.ticketCategories.filter((c) => c.isVisible).every(
                (c) => c.quantityTotal - c.quantitySold - c.quantityReserved <= 0
              );
              if (!allSoldOut) return null;
              const onWaitlist = waitlistStatus?.onWaitlist;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 border border-violet-neon/20"
                >
                  <p className="text-white/60 text-sm mb-3 text-center">
                    Cet événement est complet. Souhaitez-vous être prévenu en cas de désistement ?
                  </p>
                  {waitlistError ? (
                    <p className="text-xs text-white/30 text-center">Statut liste d'attente indisponible</p>
                  ) : onWaitlist ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="flex items-center gap-1.5 text-xs text-green-400">
                        <Bell className="w-3.5 h-3.5" />
                        Vous êtes sur la liste d'attente
                        {waitlistStatus?.totalWaiting > 1 && ` (${waitlistStatus.totalWaiting} personnes)`}
                      </p>
                      <button
                        onClick={() => leaveWaitlist.mutate()}
                        disabled={leaveWaitlist.isLoading}
                        className="text-xs text-white/25 hover:text-rose-neon transition-colors flex items-center gap-1"
                      >
                        <BellOff className="w-3 h-3" />
                        Se désinscrire
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      onClick={() => {
                        if (!isAuthenticated) { navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`); return; }
                        joinWaitlist.mutate();
                      }}
                      disabled={joinWaitlist.isLoading}
                    >
                      <Bell className="w-4 h-4" />
                      Me prévenir en cas de place disponible
                    </Button>
                  )}
                </motion.div>
              );
            })()}

              </>
            )}

            {/* Cart summary */}
            <AnimatePresence>
              {!isCompleted && getTotalItems() > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  className="glass-card p-4 border border-rose-neon/30 sticky bottom-6"
                >
                  <div className="flex justify-between items-center mb-3 text-sm">
                    <span className="text-white/60">
                      {getTotalItems()} billet{getTotalItems() > 1 ? 's' : ''} sélectionné{getTotalItems() > 1 ? 's' : ''}
                    </span>
                    <span className="font-mono font-bold text-cyan-neon">
                      {formatPrice(getTotalAmount())}
                    </span>
                  </div>
                  <Button variant="primary" size="lg" className="w-full" onClick={handleBuy}>
                    Passer au paiement <ArrowRight className="w-4 h-4" />
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-center text-xs text-white/40 mt-2">
                      Connexion requise pour acheter
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Recommended events — après les billets sur toutes les tailles d'écran */}
        {recommendedData && recommendedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <h2 className="font-bebas text-xl tracking-wider text-white mb-4">
              Autres événements {event.category.charAt(0) + event.category.slice(1).toLowerCase()}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedData.map((rec) => (
                <EventCard key={rec.id} event={rec} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Gallery lightbox */}
      <AnimatePresence>
        {activeGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setActiveGallery(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={activeGallery}
              alt="Galerie"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-6 right-6 text-white/60 hover:text-white"
              onClick={() => setActiveGallery(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
