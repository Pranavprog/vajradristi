import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, Timer, ScanSearch } from 'lucide-react';

const metrics = [
  { key: 'iou', label: 'IoU Score', icon: Gauge, format: (v) => v?.toFixed(2) },
  { key: 'time', label: 'Inference Time', icon: Timer, format: (v) => v },
  { key: 'objects', label: 'Objects Detected', icon: ScanSearch, format: (v) => v },
];

export default function PerformanceMetrics({ iouScore, inferenceTime, objectsDetected }) {
  const values = { iou: iouScore, time: inferenceTime, objects: objectsDetected };
  const hasData = iouScore !== undefined;

  if (!hasData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Performance
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {metrics.map(({ key, label, icon: Icon, format }, idx) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + idx * 0.1 }}
            className="rounded-lg border border-border/50 bg-card/50 p-3 text-center"
          >
            <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-lg font-bold font-mono text-foreground">
              {format(values[key])}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
              {label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}