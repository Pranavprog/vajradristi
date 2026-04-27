import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, ShieldCheck, AlertTriangle, Trash2, Eye, X, FileImage, TrendingUp, Activity, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import TopNav from '../components/vajra/TopNav';
import HistoryDetailModal from '../components/vajra/HistoryDetailModal';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.AnalysisRecord.list('-created_date', 100)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await base44.entities.AnalysisRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const filtered = records.filter(r =>
    r.image_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.notes?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalAnalyses = records.length;
  const avgIou = records.length
    ? (records.reduce((s, r) => s + (r.iou_score || 0), 0) / records.length).toFixed(2)
    : '—';
  const highRiskCount = records.filter(r => (r.risk_high || 0) > 30).length;
  const avgDifficulty = records.length
    ? (records.reduce((s, r) => s + (r.terrain_difficulty || 0), 0) / records.length).toFixed(1)
    : '—';

  const riskColor = (high) =>
    high > 50 ? 'text-vajra-red' : high > 25 ? 'text-vajra-amber' : 'text-vajra-green';

  const difficultyColor = (d) =>
    d >= 7 ? 'text-vajra-red' : d >= 4 ? 'text-vajra-amber' : 'text-vajra-green';

  return (
    <div className="min-h-screen bg-background bg-grid font-inter">
      <TopNav systemStatus="online" />

      <div className="max-w-7xl mx-auto px-5 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-wide">Analysis History</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">VAJRADRISTI · Terrain Intelligence Records</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono">{totalAnalyses} total records</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Analyses', value: totalAnalyses, icon: <Activity className="w-4 h-4 text-primary" />, color: 'text-primary' },
            { label: 'Avg IoU Score', value: avgIou, icon: <TrendingUp className="w-4 h-4 text-vajra-green" />, color: 'text-vajra-green' },
            { label: 'High Risk Cases', value: highRiskCount, icon: <ShieldAlert className="w-4 h-4 text-vajra-red" />, color: 'text-vajra-red' },
            { label: 'Avg Difficulty', value: avgDifficulty !== '—' ? `${avgDifficulty}/10` : '—', icon: <AlertTriangle className="w-4 h-4 text-vajra-amber" />, color: 'text-vajra-amber' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center gap-4"
            >
              <div className="p-2.5 rounded-lg bg-secondary/50 flex-shrink-0">{stat.icon}</div>
              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename or notes..."
            className="pl-9 bg-card/60 border-border/50 text-sm"
          />
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileImage className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-mono text-sm">
              {search ? 'No records match your search.' : 'No analyses saved yet. Run an analysis to see history here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(rec)}
                  className="rounded-xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-secondary/30 overflow-hidden">
                    {rec.segmentation_image ? (
                      <img
                        src={`data:image/png;base64,${rec.segmentation_image}`}
                        alt="Segmentation"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Alert badge */}
                    {rec.alert && (
                      <span className="absolute top-2 left-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-vajra-red/90 text-white">
                        HIGH RISK
                      </span>
                    )}
                    {/* IoU badge */}
                    {rec.iou_score && (
                      <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-vajra-green">
                        IoU {rec.iou_score}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate">{rec.image_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        <Clock className="inline w-3 h-3 mr-1" />
                        {rec.created_date ? format(new Date(rec.created_date), 'dd MMM yyyy · HH:mm') : '—'}
                      </p>
                    </div>

                    {/* Risk bars */}
                    <div className="space-y-1.5">
                      {[
                        { label: 'High', val: rec.risk_high, color: 'bg-vajra-red' },
                        { label: 'Mod',  val: rec.risk_moderate, color: 'bg-vajra-amber' },
                        { label: 'Safe', val: rec.risk_safe, color: 'bg-vajra-green' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="flex items-center gap-2 text-[10px]">
                          <span className="w-8 text-muted-foreground font-mono">{label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                            <div className={`h-full rounded-full ${color} opacity-80`} style={{ width: `${val || 0}%` }} />
                          </div>
                          <span className={`w-7 text-right font-mono font-bold ${color.replace('bg-', 'text-')}`}>{val || 0}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[10px] font-mono text-muted-foreground">
                        Difficulty:{' '}
                        <span className={`font-bold ${difficultyColor(rec.terrain_difficulty)}`}>
                          {rec.terrain_difficulty ?? '—'}/10
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelected(rec)}>
                          <Eye className="w-3 h-3 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => handleDelete(rec.id, e)}>
                          <Trash2 className="w-3 h-3 text-vajra-red" />
                        </Button>
                      </div>
                    </div>
                    {rec.notes && (
                      <p className="text-[10px] text-muted-foreground italic truncate border-t border-border/30 pt-2">
                        "{rec.notes}"
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <HistoryDetailModal record={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}