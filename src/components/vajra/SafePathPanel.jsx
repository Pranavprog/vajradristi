import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Route } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function SafePathPanel({ safePathImage }) {
  const { t } = useLang();
  if (!safePathImage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <Navigation className="w-4 h-4 text-vajra-green" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('recommendedSafePath')}
        </h3>
      </div>
      <div className="relative rounded-lg overflow-hidden border border-vajra-green/20 glow-green bg-secondary/20">
        <img
          src={`data:image/png;base64,${safePathImage}`}
          alt={t('recommendedSafePath')}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3">
          <div className="px-2 py-1 rounded-md bg-vajra-green/20 border border-vajra-green/30 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Route className="w-3 h-3 text-vajra-green" />
              <span className="text-[10px] font-mono text-vajra-green font-semibold uppercase">
                {t('optimalRoute')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}