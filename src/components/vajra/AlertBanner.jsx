import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function AlertBanner({ alert, onDismiss }) {
  const { t } = useLang();
  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-vajra-red/10 border border-vajra-red/30 glow-red">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-vajra-red/20">
                <AlertTriangle className="w-4 h-4 text-vajra-red" />
              </div>
              <span className="text-sm font-semibold text-vajra-red tracking-wide font-mono uppercase">
                {alert}
              </span>
            </div>
            <button
              onClick={onDismiss}
              title={t('dismiss')}
              className="text-vajra-red/60 hover:text-vajra-red transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}