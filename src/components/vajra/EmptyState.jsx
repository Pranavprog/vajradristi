import React from 'react';
import { motion } from 'framer-motion';
import { ScanEye, ArrowLeft } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function EmptyState() {
  const { t } = useLang();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center">
          <ScanEye className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground/70 mb-2">{t('readyToAnalyze')}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{t('emptyStateDesc')}</p>
      <div className="flex items-center gap-2 text-xs text-primary/60">
        <ArrowLeft className="w-4 h-4" />
        <span className="font-mono">{t('uploadToBegin')}</span>
      </div>
    </motion.div>
  );
}