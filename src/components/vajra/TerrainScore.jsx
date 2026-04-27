import React from 'react';
import { motion } from 'framer-motion';
import { Mountain } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function TerrainScore({ score }) {
  const { t } = useLang();
  if (score === null || score === undefined) return null;

  const getLabel = (s) => {
    if (s <= 3) return { labelKey: 'lowDifficulty', color: 'text-vajra-green', glow: 'glow-green' };
    if (s <= 6) return { labelKey: 'moderateDifficulty', color: 'text-vajra-amber', glow: 'glow-amber' };
    return { labelKey: 'highDifficulty', color: 'text-vajra-red', glow: 'glow-red' };
  };

  const { labelKey, color, glow } = getLabel(score);
  const percentage = (score / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`rounded-lg border border-border/50 bg-card/50 p-4 ${glow}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Mountain className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('terrainDifficulty')}
        </h3>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className={`text-4xl font-bold font-mono ${color}`}>{score}</span>
        <span className="text-lg text-muted-foreground font-mono mb-1">/ 10</span>
      </div>

      <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-vajra-green via-vajra-amber to-vajra-red"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${color} uppercase tracking-wider`}>
          {t(labelKey)}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-3 rounded-sm transition-colors ${
                i < score ? 'bg-foreground/40' : 'bg-secondary/40'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}