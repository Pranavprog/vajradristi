import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { X, Save, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function HistoryDetailModal({ record, onClose }) {
  const [notes, setNotes] = useState(record.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    await base44.entities.AnalysisRecord.update(record.id, { notes });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-base font-bold text-foreground truncate">{record.image_name}</h2>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {record.created_date ? format(new Date(record.created_date), 'dd MMM yyyy · HH:mm:ss') : '—'}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Segmentation Output', src: record.segmentation_image },
              { label: 'Risk Heatmap', src: record.risk_map_image },
            ].map(({ label, src }) => (
              <div key={label} className="rounded-xl border border-border/40 overflow-hidden bg-secondary/20">
                <p className="text-[10px] font-mono text-muted-foreground px-3 py-2 border-b border-border/30">{label}</p>
                {src ? (
                  <img src={`data:image/png;base64,${src}`} alt={label} className="w-full object-cover" />
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <FileImage className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'IoU Score',        value: record.iou_score ?? '—',              color: 'text-vajra-green' },
              { label: 'Inference Time',   value: record.inference_time ?? '—',         color: 'text-primary' },
              { label: 'Objects Detected', value: record.objects_detected ?? '—',       color: 'text-vajra-amber' },
              { label: 'Terrain Difficulty', value: record.terrain_difficulty ? `${record.terrain_difficulty}/10` : '—', color: 'text-vajra-red' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-border/40 bg-secondary/20 p-3 text-center">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Risk Distribution */}
          <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Distribution</p>
            {[
              { label: 'High Risk',    val: record.risk_high,     color: 'bg-vajra-red',   text: 'text-vajra-red'   },
              { label: 'Moderate Risk', val: record.risk_moderate, color: 'bg-vajra-amber', text: 'text-vajra-amber' },
              { label: 'Safe Zone',    val: record.risk_safe,     color: 'bg-vajra-green', text: 'text-vajra-green' },
            ].map(({ label, val, color, text }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-28 text-xs text-muted-foreground">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary/50 overflow-hidden">
                  <div className={`h-full rounded-full ${color} opacity-80`} style={{ width: `${val || 0}%` }} />
                </div>
                <span className={`w-10 text-right text-sm font-bold font-mono ${text}`}>{val || 0}%</span>
              </div>
            ))}
          </div>

          {/* Alert */}
          {record.alert && (
            <div className="rounded-lg border border-vajra-red/30 bg-vajra-red/10 px-4 py-3 text-sm font-mono text-vajra-red">
              ⚠ {record.alert}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this terrain analysis..."
              className="w-full rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" onClick={handleSaveNotes} disabled={saving} className="gap-2">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save Notes'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}