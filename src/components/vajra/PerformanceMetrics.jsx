import React from 'react';
import { motion } from 'framer-motion';
import { Timer, ScanSearch } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function PerformanceMetrics({ inferenceTime, objectsDetected }) {
  const { t } = useLang();

  if (inferenceTime === undefined) return null;

  const metrics = [
    { labelKey: 'inferenceTime', Icon: Timer, value: inferenceTime },
    { labelKey: 'objectsDetected', Icon: ScanSearch, value: objectsDetected },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('performance')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(({ labelKey, Icon, value }, idx) => (
          <motion.div
            key={labelKey}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + idx * 0.1 }}
            className="rounded-lg border border-border/50 bg-card/50 p-3 text-center"
          >
            <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-lg font-bold font-mono text-foreground">{value}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
              {t(labelKey)}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}