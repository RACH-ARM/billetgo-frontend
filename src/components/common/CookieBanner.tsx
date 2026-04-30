import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'billetgab_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto"
        >
          <div className="glass-card border border-violet-neon/30 p-4 sm:p-5 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-3">
              <Cookie className="w-5 h-5 text-violet-neon flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-medium mb-1">Ce site utilise des cookies essentiels</p>
                <p className="text-xs text-white/40 leading-relaxed">
                  BilletGab utilise uniquement des cookies strictement nécessaires à son fonctionnement
                  (authentification, préférences de session). Aucun cookie publicitaire ni traceur tiers.{' '}
                  <Link to="/confidentialite" className="text-violet-neon hover:underline">
                    En savoir plus
                  </Link>
                </p>
              </div>
              <button onClick={decline} className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0 ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={decline}
                className="px-4 py-1.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="px-4 py-1.5 rounded-xl bg-violet-neon/20 border border-violet-neon/40 text-violet-neon hover:bg-violet-neon/30 text-xs font-semibold transition-colors"
              >
                Accepter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
