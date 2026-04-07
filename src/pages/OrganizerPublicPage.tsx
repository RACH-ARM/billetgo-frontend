import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, CalendarDays, MapPin, Images, X } from 'lucide-react';
import api from '../services/api';
import EventCard from '../components/events/EventCard';
import CertifiedBadge from '../components/common/CertifiedBadge';
import type { Event } from '../types/event';

const SITE_URL = 'https://billetgo.ga';

interface OrganizerPublicData {
  id: string;
  companyName: string;
  description: string | null;
  logoUrl: string | null;
  isApproved: boolean;
  isCertified: boolean;
  pastEventsCount: number;
  events: Event[];
}

export default function OrganizerPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<OrganizerPublicData>(
    ['organizer-public', id],
    () => api.get(`/organizers/${id}`).then((r) => r.data.data),
    { enabled: !!id, staleTime: 2 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.07]" />
          <div className="space-y-3">
            <div className="h-7 bg-white/[0.07] rounded w-56" />
            <div className="h-3 bg-white/[0.05] rounded w-80" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0,1,2].map((i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="h-48 bg-white/[0.06]" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-white/[0.07] rounded w-2/3" />
                <div className="h-3 bg-white/[0.04] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <p className="text-white/50 text-lg">Organisateur non trouvé</p>
        <Link to="/" className="text-violet-neon hover:underline">← Retour à l'accueil</Link>
      </div>
    );
  }

  const allPhotos = data?.events.flatMap((e) => e.galleryUrls ?? []) ?? [];

  const seoTitle = `${data.companyName} — Organisateur d'événements | BilletGo`;
  const seoDesc = data.description
    ? data.description.slice(0, 160)
    : `Découvrez les événements de ${data.companyName} sur BilletGo — billetterie en ligne au Gabon.`;
  const seoUrl = `${SITE_URL}/organizers/${data.id}`;
  const seoImage = data.logoUrl ?? `${SITE_URL}/og-default.jpg`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={seoUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:site_name" content="BilletGo" />
        <meta property="og:locale" content="fr_GA" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={seoImage} />
      </Helmet>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10"
      >
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.companyName}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-neon-gradient flex items-center justify-center text-white font-bebas text-4xl flex-shrink-0">
            {data.companyName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="font-bebas text-4xl sm:text-5xl tracking-wider text-gradient leading-none">
            {data.companyName}
          </h1>
          <div className="flex items-start gap-3 mt-2">
            {(data.isCertified || data.events.some((e: any) => e.isCertified)) && <CertifiedBadge size="md" />}
            {data.description && (
              <p className="text-white/50 text-sm max-w-xl leading-relaxed">{data.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {data.events.length} événement{data.events.length !== 1 ? 's' : ''} à venir
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Libreville, Gabon
            </span>
            {data.pastEventsCount > 0 && (
              <span>{data.pastEventsCount} événement{data.pastEventsCount !== 1 ? 's' : ''} passé{data.pastEventsCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Events grid */}
      {data.events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-16 text-center"
        >
          <CalendarDays className="w-12 h-12 text-white/10 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-white/40">Aucun événement à venir pour le moment</p>
        </motion.div>
      ) : (
        <>
          <h2 className="font-bebas text-2xl tracking-wider text-white mb-5">
            Prochains événements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Galerie photos */}
      {allPhotos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-16"
        >
          <h2 className="font-bebas text-2xl tracking-wider text-white mb-5 flex items-center gap-2">
            <Images className="w-5 h-5 text-violet-neon" />
            Galerie
          </h2>
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {allPhotos.map((url, i) => (
              <motion.button
                key={url + i}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setActivePhoto(url)}
                className="block w-full overflow-hidden rounded-xl break-inside-avoid group"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {activePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setActivePhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={activePhoto}
              alt="Galerie"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-6 right-6 text-white/60 hover:text-white"
              onClick={() => setActivePhoto(null)}
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
