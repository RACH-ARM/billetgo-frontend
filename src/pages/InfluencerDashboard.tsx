import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { TrendingUp, Ticket, MousePointerClick, Wallet, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, LogOut, Copy, Check } from 'lucide-react';
import { promoService } from '../services/promoService';
import { formatPrice } from '../utils/formatPrice';
import { formatEventDate } from '../utils/formatDate';
import { useAuthStore } from '../stores/authStore';
import type { InfluencerCampaign, InfluencerPayout } from '../types/promo';

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-violet-neon/10 border border-violet-neon/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-neon" />
        </div>
        <span className="text-white/50 text-sm">{label}</span>
      </div>
      <p className="font-bebas text-3xl tracking-wider text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

export default function InfluencerDashboard() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState<'AIRTEL_MONEY' | 'MOOV_MONEY'>('AIRTEL_MONEY');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutErrorMsg, setPayoutErrorMsg] = useState<string | null>(null);

  const copyLink = (eventId: string, code: string) => {
    const url = `https://billetgab.com/events/${eventId}?promo=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const { data, isLoading } = useQuery(
    'influencer-dashboard',
    promoService.getDashboard,
  );

  const payoutMutation = useMutation(
    () => promoService.requestPayout(phone, operator),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('influencer-dashboard');
        setShowPayoutForm(false);
        setPhone('');
        setPayoutErrorMsg(null);
        setPayoutSuccess(true);
        setTimeout(() => setPayoutSuccess(false), 5000);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Le virement a échoué. Vérifiez votre numéro et réessayez.';
        setPayoutErrorMsg(msg);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-neon/30 border-t-violet-neon rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, campaigns, payouts } = data ?? { summary: { totalClicks: 0, totalTickets: 0, totalConfirmed: 0, totalPending: 0, totalPaid: 0, pendingPayouts: 0, availableBalance: 0 }, campaigns: [], payouts: [] };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bebas text-4xl tracking-wider text-gradient">MON ESPACE INFLUENCEUR</h1>
            <p className="text-white/40 text-sm mt-1">Suivez vos campagnes et vos commissions en temps réel.</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mt-1"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={MousePointerClick} label="Clics totaux" value={summary.totalClicks.toLocaleString('fr-FR')} />
          <StatCard icon={Ticket} label="Billets vendus" value={summary.totalTickets.toLocaleString('fr-FR')} />
          <StatCard icon={TrendingUp} label="Commissions confirmées" value={formatPrice(summary.totalConfirmed)} sub={summary.totalPending > 0 ? `+ ${formatPrice(summary.totalPending)} en attente` : undefined} />
          <StatCard icon={Wallet} label="Solde disponible" value={formatPrice(summary.availableBalance)} sub={
            summary.pendingPayouts > 0
              ? `${formatPrice(summary.pendingPayouts)} en demande en cours`
              : summary.totalPaid > 0
                ? `${formatPrice(summary.totalPaid)} déjà versé`
                : undefined
          } />
        </div>

        {/* Solde insuffisant */}
        {summary.availableBalance > 0 && summary.availableBalance < 1500 && (
          <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
            <p className="text-amber-400 text-sm">Solde disponible : <span className="font-mono font-semibold">{formatPrice(summary.availableBalance)}</span> — le versement minimum est de <span className="font-semibold">1 500 FCFA</span>.</p>
          </div>
        )}

        {/* Succès virement */}
        {payoutSuccess && (
          <div className="glass-card p-4 border border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400 text-sm font-semibold">Virement effectué ! L'argent arrive sur votre Mobile Money dans quelques instants.</p>
            </div>
          </div>
        )}

        {/* Retrait */}
        {summary.availableBalance >= 1500 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold">Solde disponible</h2>
                <p className="text-2xl font-bebas tracking-wider text-gradient mt-1">{formatPrice(summary.availableBalance)}</p>
              </div>
              <button
                onClick={() => { setShowPayoutForm(!showPayoutForm); setPayoutErrorMsg(null); }}
                className="neon-button px-5 py-2.5 text-sm font-semibold rounded-xl"
              >
                Retirer mes gains
              </button>
            </div>
            {showPayoutForm && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <p className="text-white/40 text-xs">Le virement est instantané — l'argent arrive directement sur votre numéro Mobile Money.</p>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Opérateur</label>
                  <div className="flex gap-3">
                    {(['AIRTEL_MONEY', 'MOOV_MONEY'] as const).map((op) => (
                      <button
                        key={op}
                        onClick={() => setOperator(op)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${operator === op ? 'border-violet-neon bg-violet-neon/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20'}`}
                      >
                        {op === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest block mb-2">Numéro Mobile Money</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={operator === 'AIRTEL_MONEY' ? '07 XX XX XX' : '06 XX XX XX'}
                    className="w-full bg-bg-secondary border border-violet-neon/20 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-neon transition-colors"
                  />
                </div>
                <button
                  onClick={() => payoutMutation.mutate()}
                  disabled={!phone.trim() || payoutMutation.isLoading}
                  className="neon-button w-full py-3 text-sm font-semibold rounded-xl disabled:opacity-40"
                >
                  {payoutMutation.isLoading ? 'Virement en cours...' : `Recevoir ${formatPrice(summary.availableBalance)}`}
                </button>
                {payoutErrorMsg && (
                  <p className="text-rose-neon text-sm text-center">{payoutErrorMsg}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Campagnes */}
        <div className="space-y-3">
          <h2 className="font-bebas text-2xl tracking-wider text-white">MES CAMPAGNES</h2>
          {campaigns.length === 0 ? (
            <div className="glass-card p-10 text-center text-white/30">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucune campagne pour le moment.</p>
              <p className="text-xs mt-1">Un organisateur doit vous assigner un code promo.</p>
            </div>
          ) : (
            campaigns.map((c: InfluencerCampaign) => (
              <div key={c.promoCodeId} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === c.promoCodeId ? null : c.promoCodeId)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {c.event.coverImageUrl && (
                      <img src={c.event.coverImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover object-top flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">{c.event.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{formatEventDate(c.event.eventDate)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-violet-neon text-xs bg-violet-neon/10 border border-violet-neon/20 px-2 py-0.5 rounded-lg">{c.code}</span>
                        {c.label && <span className="text-white/30 text-xs">{c.label}</span>}
                        {!c.isActive && <span className="text-rose-neon text-xs">Inactif</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:block">
                      <p className="text-white/40 text-xs">Billets</p>
                      <p className="text-white font-semibold">{c.stats.ticketsSold}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Commission</p>
                      <p className="text-cyan-neon font-semibold font-mono">{formatPrice(c.stats.commissionConfirmed)}</p>
                    </div>
                    {expanded === c.promoCodeId ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </button>

                {expanded === c.promoCodeId && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-white/40 text-xs mb-1">Clics sur votre lien</p>
                        <p className="text-white font-semibold">{c.clickCount.toLocaleString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Utilisations</p>
                        <p className="text-white font-semibold">{c.stats.usageCount}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">En attente</p>
                        <p className="text-amber-400 font-semibold font-mono">{formatPrice(c.stats.commissionPending)}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs mb-1">Réduction offerte</p>
                        <p className="text-white font-semibold">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : c.discountType === 'FIXED' ? formatPrice(Number(c.discountValue)) : 'Aucune'}
                        </p>
                      </div>
                    </div>
                    {/* Lien à partager */}
                    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                      <p className="flex-1 font-mono text-xs text-white/40 truncate">
                        billetgab.com/events/{c.event.id}?promo={c.code}
                      </p>
                      <button
                        onClick={() => copyLink(c.event.id, c.code)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-neon hover:text-white transition-colors flex-shrink-0"
                      >
                        {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode === c.code ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Historique versements */}
        {payouts.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bebas text-2xl tracking-wider text-white">HISTORIQUE DES VERSEMENTS</h2>
            {payouts.map((p: InfluencerPayout) => (
              <div key={p.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.status === 'PAID' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                   p.status === 'REJECTED' ? <XCircle className="w-5 h-5 text-rose-neon" /> :
                   <Clock className="w-5 h-5 text-amber-400" />}
                  <div>
                    <p className="text-white font-semibold font-mono">{formatPrice(Number(p.amount))}</p>
                    <p className="text-white/40 text-xs">{p.operator === 'AIRTEL_MONEY' ? 'Airtel Money' : 'Moov Money'} · {p.phoneNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${p.status === 'PAID' ? 'text-emerald-400' : p.status === 'REJECTED' ? 'text-rose-neon' : 'text-amber-400'}`}>
                    {p.status === 'PAID' ? 'Versé' : p.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                  </p>
                  {p.adminNote && <p className="text-white/30 text-xs mt-0.5">{p.adminNote}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
