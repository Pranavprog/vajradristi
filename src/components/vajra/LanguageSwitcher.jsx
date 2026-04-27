import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { languages } from '@/lib/i18n';
import { useLang } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSwitcher() {
  const { lang, changeLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = languages.find(l => l.code === lang) || languages[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/40 transition-all text-sm"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-mono">{current.flag} {current.nativeLabel}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => { changeLang(l.code); setOpen(false); }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{l.flag}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground leading-none">{l.nativeLabel}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{l.label}</p>
                  </div>
                </div>
                {lang === l.code && (
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}