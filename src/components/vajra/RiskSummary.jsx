import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const riskItems = [
  { key: 'high', labelKey: 'highRisk', color: 'text-vajra-red', bgColor: 'bg-vajra-red', Icon: ShieldAlert },
  { key: 'moderate', labelKey: 'moderate', color: 'text-vajra-amber', bgColor: 'bg-vajra-amber', Icon: AlertTriangle },
  { key: 'safe', labelKey: 'safeZone', color: 'text-vajra-green', bgColor: 'bg-vajra-green', Icon: ShieldCheck },
];

export default function RiskSummary({ riskPercentages }) {
  const { t } = useLang();
  if (!riskPercentages) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('riskDistribution')}
      </h3>
      <div className="space-y-3">
        {riskItems.map(({ key, labelKey, color, bgColor, Icon }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs font-medium text-foreground/80">{t(labelKey)}</span>
              </div>
              <span className={`text-sm font-bold font-mono ${color}`}>
                {riskPercentages[key]}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${riskPercentages[key]}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${bgColor} opacity-80`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}