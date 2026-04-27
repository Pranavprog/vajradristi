import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function LoadingOverlay({ isLoading }) {
  const { t } = useLang();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="text-center"
          >
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-3 rounded-full border border-primary/15" />
              <div className="absolute inset-6 rounded-full border border-primary/10" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, transparent 0%, transparent 70%, hsla(187, 92%, 55%, 0.3) 100%)' }}
                />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{t('analyzingTerrain')}</h3>
            <p className="text-sm text-muted-foreground font-mono">{t('processingModel')}</p>
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}