import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/LanguageContext';

export default function ImageDisplay({ titleKey, imageSrc, labelKey, delay = 0, large = false }) {
  const { t } = useLang();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t(titleKey)}
        </h3>
        {labelKey && (
          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {t(labelKey)}
          </span>
        )}
      </div>
      <div className="relative rounded-lg overflow-hidden border border-border/50 bg-secondary/20 group">
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt={t(titleKey)}
              className={`w-full object-contain bg-black/20 ${large ? 'aspect-[4/3]' : 'aspect-video'}`}
            />
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scanline" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className={`${large ? 'aspect-[4/3]' : 'aspect-video'} flex items-center justify-center`}>
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                <div className="w-3 h-3 rounded-sm bg-muted-foreground/20" />
              </div>
              <p className="text-xs text-muted-foreground/50 font-mono">{t('awaitingData')}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}