import React from 'react';
import { motion } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function ExplainableAI({ explanations }) {
  const { t } = useLang();
  if (!explanations || explanations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-lg border border-border/50 bg-card/50 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-vajra-purple" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('explainableAI')}
        </h3>
      </div>
      <div className="space-y-2">
        {explanations.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + idx * 0.1 }}
            className="flex items-start gap-2 text-sm"
          >
            <ChevronRight className="w-3.5 h-3.5 text-vajra-red mt-0.5 flex-shrink-0" />
            <span className="text-foreground/80">{item}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}