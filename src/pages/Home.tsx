import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Headphones, Tent, Waves, Mic2, Trophy, Theater, Footprints,
  Search, X, Flame, MapPin, MousePointerClick, Smartphone, Calendar,
  XCircle, CheckCircle, QrCode, Shield, Download, Users,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import EventGrid from '../components/events/EventGrid';
import HeroSection from '../components/events/HeroSection';
import TickerTape from '../components/events/TickerTape';
import { isEventLive } from '../components/events/EventCard';
import type { EventCategory } from '../types/event';

type CategoryIcon = React.ComponentType<{ className?: string }>;

const CATEGORIES: { value: EventCategory | ''; label: string; Icon: CategoryIcon }[] = [
  { value: '', label: 'Tous', Icon: LayoutGrid },
  { value: 'CLUB', label: 'Club', Icon: Headphones },
  { value: 'FESTIVAL', label: 'Festival', Icon: Tent },
  { value: 'BEACH', label: 'Beach', Icon: Waves },
  { value: 'CONCERT', label: 'Concert', Icon: Mic2 },
  { value: 'SPORT', label: 'Sport', Icon: Trophy },
  { value: 'CULTUREL', label: 'Culturel', Icon: Theater },
  { value: 'RANDONNEE', label: 'Randonnée', Icon: Footprints },
];

type DateFilter = '' | 'today' | 'weekend' | 'week' | 'month';
const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: '', label: 'Toutes les dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'weekend', label: 'Ce weekend' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
];

function getDateRange(filter: DateFilter): { from?: Date; to?: Date } {
  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  if (filter === 'today') return { from: now, to: todayEnd };
  if (filter === 'weekend') {
    const day = now.getDay(); // 0=Sun, 6=Sat
    const daysToFri = (5 - day + 7) % 7;
    const fri = new Date(now); fri.setDate(now.getDate() + daysToFri); fri.setHours(0, 0, 0, 0);
    const sun = new Date(fri); sun.setDate(fri.getDate() + 2); sun.setHours(23, 59, 59, 999);
    return { from: fri, to: sun };
  }
  if (filter === 'week') {
    const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7); nextWeek.setHours(23, 59, 59, 999);
    return { from: now, to: nextWeek };
  }
  if (filter === 'month') {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: now, to: endOfMonth };
  }
  return {};
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = (searchParams.get('category') || '') as EventCategory | '';
  const search = searchParams.get('search') || '';
  const dateFilter = (searchParams.get('date') || '') as DateFilter;
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v); else next.delete(k);
      });
      return next;
    }, { replace: true, preventScrollReset: true });
  }, [setSearchParams]);

  const setCategory = (v: EventCategory | '') => updateParams({ category: v, page: '' });
  const setSearch = (v: string) => updateParams({ search: v, page: '' });
  const setDateFilter = (v: DateFilter) => updateParams({ date: v, page: '' });
  const eventsSectionRef = useRef<HTMLElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setPage = (v: number) => updateParams({ page: v > 1 ? String(v) : '' });
  const goToPage = (v: number) => {
    setPage(v);
    // requestAnimationFrame garantit que le scroll se déclenche après le re-render React,
    // et window.scrollTo est fiable sur mobile (iOS/Android) contrairement à scrollIntoView
    requestAnimationFrame(() => {
      const el = eventsSectionRef.current;
      if (!el) return;
      // Hauteur de la navbar sticky (top-16 = 64px + 8px de marge)
      const offset = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
    });
  };

  // Input local state (debounce search)
  const [searchInput, setSearchInput] = useState(search);

  const dateRange = getDateRange(dateFilter);
  const isFiltered = !!category || !!search || !!dateFilter || page > 1;

  // Appel unique au chargement initial — sert à la fois pour le hero/trending ET la liste
  const { data: allData, isLoading: allLoading } = useEvents({ limit: 20 });

  // Événements passés (terminés récemment)
  const { data: pastData } = useEvents({ timeframe: 'past', limit: 6 });

  // Appel supplémentaire seulement quand l'utilisateur filtre ou change de page
  const { data: filteredData, isLoading: filteredLoading } = useEvents(
    {
      category: category || undefined,
      search: search || undefined,
      page,
      dateFrom: dateRange.from?.toISOString(),
      dateTo: dateRange.to?.toISOString(),
    },
    { enabled: isFiltered },
  );

  const data = isFiltered ? filteredData : allData;
  const isLoading = isFiltered ? filteredLoading : allLoading;

  const featuredEvent = useMemo(() => {
    if (!allData?.events.length) return null;
    return allData.events.find((e) => e.isFeatured) ?? allData.events[0];
  }, [allData]);

  const weekendEvents = useMemo(() => {
    if (!allData?.events) return [];
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return allData.events.filter((e) => {
      const d = new Date(e.eventDate);
      return d >= now && d <= in7Days;
    }).slice(0, 4);
  }, [allData]);

  const liveEvents = useMemo(() => {
    if (!allData?.events) return [];
    return allData.events.filter((e) => isEventLive(e.eventDate, e.doorsOpenAt, e.endDate));
  }, [allData]);

  const trendingEvents = useMemo(() => {
    if (!allData?.events) return [];
    const hot = allData.events.filter((e) => e.isHot);
    if (hot.length > 0) return hot.slice(0, 4);
    return [...allData.events]
      .sort((a, b) => {
        const soldA = a.ticketCategories.reduce((s, c) => s + c.quantitySold, 0);
        const soldB = b.ticketCategories.reduce((s, c) => s + c.quantitySold, 0);
        return soldB - soldA;
      })
      .slice(0, 4);
  }, [allData]);

  const activeDateLabel = DATE_FILTERS.find((d) => d.value === dateFilter)?.label;
  const sectionTitle =
    search ? `Résultats pour "${search}"` :
    category && dateFilter ? `${category} — ${activeDateLabel}` :
    category ? `Événements — ${category}` :
    dateFilter ? `Événements — ${activeDateLabel}` :
    'Tous les événements';

  return (
    <div className="min-h-screen">
      {featuredEvent && <HeroSection event={featuredEvent} />}

      {allData?.events && allData.events.length > 0 && (
        <TickerTape events={allData.events} />
      )}

      {liveEvents.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-neon" />
              </span>
              <h2 className="font-bebas text-3xl tracking-wider text-rose-neon">EN CE MOMENT</h2>
              <span className="text-xs text-white/30 font-semibold uppercase tracking-widest mt-1">
                {liveEvents.length} événement{liveEvents.length > 1 ? 's' : ''} en cours
              </span>
            </div>
            <EventGrid events={liveEvents} isLoading={false} />
          </div>
        </section>
      )}

      {weekendEvents.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title="Ce weekend à Libreville" accent="rose" />
            <EventGrid events={weekendEvents} isLoading={false} />
          </div>
        </section>
      )}

      {trendingEvents.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title="Tendances du moment" accent="violet" hot />
            <EventGrid events={trendingEvents} isLoading={false} />
          </div>
        </section>
      )}

      {/* Search + Categories + Date */}
      <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-4 sticky top-16 z-20 bg-bg/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchInput(v);
                  // debounce 400ms
                  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                  searchTimerRef.current = setTimeout(() => setSearch(v), 400);
                }}
                className="w-full bg-bg-card border border-violet-neon/20 rounded-2xl pl-11 pr-10 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-neon transition-colors text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setSearch(''); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className={`bg-bg-card border rounded-2xl pl-9 pr-4 py-3 text-sm font-semibold focus:outline-none transition-colors appearance-none cursor-pointer ${
                  dateFilter ? 'border-violet-neon text-violet-neon' : 'border-violet-neon/20 text-white/60'
                }`}
              >
                {DATE_FILTERS.map((d) => (
                  <option key={d.value} value={d.value} className="bg-bg-card text-white">{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setCategory(value as EventCategory | '')}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  category === value
                    ? 'bg-neon-gradient text-white shadow-neon'
                    : 'bg-bg-card border border-violet-neon/20 text-white/60 hover:border-violet-neon/50 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* All events */}
      <section ref={eventsSectionRef} className="px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-white mb-6">{sectionTitle}</h2>
          <EventGrid events={data?.events || []} isLoading={isLoading} />

          {data && data.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 rounded-xl bg-bg-card border border-violet-neon/20 text-white/60 hover:text-white hover:border-violet-neon/50 disabled:opacity-30 transition-all text-sm font-semibold"
              >
                ← Précédent
              </button>
              <div className="flex gap-1">
                {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === data.pagination.pages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-2 text-white/30">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                          page === p
                            ? 'bg-neon-gradient text-white shadow-neon'
                            : 'bg-bg-card border border-violet-neon/20 text-white/60 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => goToPage(Math.min(data.pagination.pages, page + 1))}
                disabled={page === data.pagination.pages}
                className="px-5 py-2.5 rounded-xl bg-bg-card border border-violet-neon/20 text-white/60 hover:text-white hover:border-violet-neon/50 disabled:opacity-30 transition-all text-sm font-semibold"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Événements passés récemment */}
      {(pastData?.events?.length ?? 0) > 0 && !isFiltered && (
        <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title="Passés récemment" accent="violet" />
            <EventGrid events={pastData!.events} isLoading={false} />
          </div>
        </section>
      )}

      {/* Problèmes résolus — côté acheteur */}
      <ProblemsResolved />

      {/* How it works — en bas, après les événements */}
      <HowItWorks />
    </div>
  );
}

const BUYER_PROBLEMS = [
  {
    problem: 'Faux billets et arnaques',
    solution: 'Chaque billet possède un QR Code cryptographique unique (HMAC-SHA256) — impossible à copier ou falsifier.',
    Icon: QrCode,
    color: 'violet',
  },
  {
    problem: 'Billet perdu ou oublié',
    solution: 'Votre billet est enregistré dans la galerie de votre téléphone et accessible à tout moment depuis "Mes billets".',
    Icon: Download,
    color: 'rose',
  },
  {
    problem: 'Files d\'attente interminables',
    solution: 'Scan QR instantané à l\'entrée — en quelques secondes, votre passage est confirmé et vous entrez.',
    Icon: Shield,
    color: 'cyan',
  },
  {
    problem: 'Transfert de billet risqué',
    solution: 'Transférez votre billet à quelqu\'un d\'autre en un clic — l\'ancien QR Code est automatiquement invalidé.',
    Icon: Users,
    color: 'green',
  },
] as const;

function ProblemsResolved() {
  const colors = {
    violet: { text: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20' },
    rose:   { text: 'text-rose-neon',   bg: 'bg-rose-neon/10',   border: 'border-rose-neon/20' },
    cyan:   { text: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   border: 'border-cyan-neon/20' },
    green:  { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20' },
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs text-violet-neon uppercase tracking-widest font-semibold mb-3">Ce que BilletGo règle pour vous</p>
          <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-2">Les problèmes résolus</h2>
          <p className="text-white/40 text-sm">Plus jamais ces galères avec BilletGo.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUYER_PROBLEMS.map((item, i) => {
            const c = colors[item.color];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5 border border-white/5 flex flex-col gap-3"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-white/35 text-xs line-through">{item.problem}</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                    <item.Icon className={`w-3.5 h-3.5 ${c.text}`} />
                  </div>
                  <p className="text-white/65 text-xs leading-relaxed">{item.solution}</p>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <CheckCircle className={`w-3.5 h-3.5 ${c.text}`} />
                  <span className={`text-xs font-semibold ${c.text}`}>Résolu</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS = [
  {
    num: '01',
    Icon: MapPin,
    title: 'Trouvez votre événement',
    desc: 'Parcourez notre catalogue et choisissez l\'événement qui vous intéresse à Libreville et partout au Gabon.',
    color: 'violet',
  },
  {
    num: '02',
    Icon: MousePointerClick,
    title: 'Sélectionnez vos places',
    desc: 'Choisissez votre catégorie (Standard, VIP, VIIP…) et le nombre de billets souhaités.',
    color: 'rose',
  },
  {
    num: '03',
    Icon: Smartphone,
    title: 'Payez et recevez',
    desc: 'Payez en quelques secondes via Airtel Money ou Moov Money, puis téléchargez vos billets depuis la section "Mes billets".',
    color: 'cyan',
  },
] as const;

function HowItWorks() {
  const colors = {
    violet: { text: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20', num: 'text-violet-neon' },
    rose:   { text: 'text-rose-neon',   bg: 'bg-rose-neon/10',   border: 'border-rose-neon/20',   num: 'text-rose-neon' },
    cyan:   { text: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   border: 'border-cyan-neon/20',   num: 'text-cyan-neon' },
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs text-violet-neon uppercase tracking-widest font-semibold mb-3">Simple & rapide</p>
          <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-3">Comment ça marche ?</h2>
          <p className="text-white/40 text-sm">Réservez vos billets en 3 étapes simples</p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-violet-neon/20 via-rose-neon/20 to-cyan-neon/20 pointer-events-none" style={{ left: '22%', right: '22%' }} />

          {HOW_STEPS.map((step, i) => {
            const c = colors[step.color];
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`glass-card p-6 border ${c.border} flex flex-col items-center text-center relative`}
              >
                {/* Number */}
                <span className={`font-bebas text-5xl leading-none ${c.num} mb-4 opacity-30 select-none`}>{step.num}</span>
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.bg} mb-4`}>
                  <step.Icon className={`w-6 h-6 ${c.text}`} />
                </div>
                <h3 className="font-bebas text-xl tracking-wider text-white mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  accent,
  hot,
}: {
  title: string;
  accent: 'rose' | 'violet';
  hot?: boolean;
}) {
  const color = accent === 'rose' ? 'bg-rose-neon' : 'bg-violet-neon';
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-3 mb-6"
    >
      <div className={`w-1 h-7 rounded-full ${color}`} />
      <h2 className="font-bebas text-2xl sm:text-3xl tracking-wider text-white">{title}</h2>
      {hot && (
        <span className="ml-1 flex items-center gap-1 px-2.5 py-0.5 bg-rose-neon/20 border border-rose-neon/30 text-rose-neon text-xs font-semibold rounded-full">
          <Flame className="w-3 h-3" />
          HOT
        </span>
      )}
    </motion.div>
  );
}
