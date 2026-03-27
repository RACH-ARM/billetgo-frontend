import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-violet-neon/10 mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <img src="/logo.svg" alt="BilletGo" className="h-10 w-auto" />
            <p className="mt-2 text-sm text-white/50">Ton événement. Ton ticket. Maintenant.</p>
            <p className="mt-1 text-xs text-white/30">Libreville, Gabon</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Liens utiles</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link to="/" className="hover:text-white transition-colors">Événements</Link></li>
              <li><Link to="/organisateurs" className="hover:text-white transition-colors">Organisateurs</Link></li>
              <li><Link to="/a-propos" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
              <li><Link to="/cgv" className="hover:text-white transition-colors">CGV</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
              <li><Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Paiements acceptés</h4>
            <div className="flex gap-3 flex-wrap">
              <span className="bg-bg-card border border-violet-neon/20 rounded-lg px-3 py-2 text-xs font-mono text-cyan-neon">Airtel Money</span>
              <span className="bg-bg-card border border-violet-neon/20 rounded-lg px-3 py-2 text-xs font-mono text-rose-neon">Moov Money</span>
            </div>
          </div>
        </div>
        <div className="border-t border-violet-neon/10 mt-10 pt-6 text-center text-xs text-white/30">
          BilletGo © 2026 — Tous droits réservés | billetgo.ga
        </div>
      </div>
    </footer>
  );
}
