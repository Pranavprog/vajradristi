import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const riskItems = [
  { key: 'high', label: 'High Risk', color: 'text-vajra-red', bgColor: 'bg-vajra-red', icon: ShieldAlert },
  { key: 'moderate', label: 'Moderate', color: 'text-vajra-amber', bgColor: 'bg-vajra-amber', icon: AlertTriangle },
  { key: 'safe', label: 'Safe Zone', color: 'text-vajra-green', bgColor: 'bg-vajra-green', icon: ShieldCheck },
];

export default function RiskSummary({ riskPercentages }) {
  if (!riskPercentages) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Risk Distribution
      </h3>
      <div className="space-y-3">
        {riskItems.map(({ key, label, color, bgColor, icon: Icon }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-xs font-medium text-foreground/80">{label}</span>
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