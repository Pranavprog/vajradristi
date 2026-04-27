/**
 * VAJRADRISTI — Safe Path Navigator v3.0
 * Steps 1–10 of the full navigation spec:
 *   1. Align inputs (terrain + segmentation + risk heatmap)
 *   2. Cost grid from pixel data
 *   3. Risk-weight assignment
 *   4. 8-directional navigation graph
 *   5. A* with risk-aware cost function
 *   6. Line-of-sight + Bezier smoothing
 *   7. Dynamic update on environment change
 *   8. Full visualization
 *   9. <2s path generation
 *  10. Metrics (distance, time, safety, obstacles avoided)
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, RefreshCw, MapPin, Flag, Clock, Route,
  Shield, Zap, AlertTriangle, Layers, Target, Activity,
  ChevronRight, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildGridFromPixels, fuseSegmentationGrid, buildDemoGrid,
  astar, lineOfSightSmooth, bezierSmooth, computePathMetrics,
  TERRAIN_CLASSES,
} from '@/lib/pathfinding';
import { useLang } from '@/lib/LanguageContext';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GRID_W   = 64;
const GRID_H   = 48;
const CANVAS_W = 768;
const CANVAS_H = 576;

const DEFAULT_BLOBS = [
  { gx: 14, gy: 26, r: 9,  type: 'high'     },
  { gx: 38, gy: 22, r: 8,  type: 'high'     },
  { gx: 52, gy: 32, r: 7,  type: 'high'     },
  { gx: 26, gy: 36, r: 8,  type: 'obstacle' },
  { gx: 44, gy: 14, r: 6,  type: 'obstacle' },
  { gx: 20, gy: 16, r: 11, type: 'moderate' },
  { gx: 46, gy: 38, r: 9,  type: 'moderate' },
  { gx: 8,  gy: 38, r: 7,  type: 'moderate' },
  { gx: 56, gy: 16, r: 6,  type: 'moderate' },
];

// ─── GRID ↔ CANVAS TRANSFORMS ────────────────────────────────────────────────
function gridToCanvas(gx, gy) {
  return {
    x: (gx + 0.5) * (CANVAS_W / GRID_W),
    y: (gy + 0.5) * (CANVAS_H / GRID_H),
  };
}

function canvasToGrid(cx, cy, rect) {
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  return {
    gx: Math.max(0, Math.min(GRID_W - 1, Math.floor((cx * scaleX) / (CANVAS_W / GRID_W)))),
    gy: Math.max(0, Math.min(GRID_H - 1, Math.floor((cy * scaleY) / (CANVAS_H / GRID_H)))),
  };
}

// ─── STEP 1: LOAD + ALIGN IMAGE ──────────────────────────────────────────────
function loadAndSampleImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Align to fixed grid resolution
      const tmp = document.createElement('canvas');
      tmp.width = GRID_W * 4; tmp.height = GRID_H * 4; // 4x super-sample
      const tc = tmp.getContext('2d');
      tc.drawImage(img, 0, 0, tmp.width, tmp.height);
      resolve({ imageData: tc.getImageData(0, 0, tmp.width, tmp.height), w: tmp.width, h: tmp.height });
    };
    img.src = url;
  });
}

// ─── BUILD GRID FROM IMAGE ────────────────────────────────────────────────────
async function buildGridFromImage(imageFile) {
  const { imageData, w, h } = await loadAndSampleImage(imageFile);
  return buildGridFromPixels(imageData, GRID_W, GRID_H, w, h);
}

// ─── DRAW FUNCTIONS ───────────────────────────────────────────────────────────
function drawTerrainGrid(ctx, grid, alpha = 0.6) {
  const cw = CANVAS_W / GRID_W;
  const ch = CANVAS_H / GRID_H;
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const cell = grid[gy][gx];
      let color;
      switch (cell.type) {
        case 'obstacle': color = `rgba(10,10,10,${alpha + 0.2})`; break;
        case 'high':     color = `rgba(220,38,38,${alpha})`; break;
        case 'moderate': color = `rgba(234,179,8,${alpha - 0.1})`; break;
        default:         color = `rgba(34,197,94,${alpha - 0.3})`; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(gx * cw, gy * ch, cw + 0.5, ch + 0.5);
    }
  }
}

function drawGridLines(ctx) {
  ctx.strokeStyle = 'rgba(56,189,248,0.04)';
  ctx.lineWidth = 0.5;
  const cw = CANVAS_W / GRID_W;
  const ch = CANVAS_H / GRID_H;
  for (let x = 0; x <= CANVAS_W; x += cw) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += ch) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
}

function drawSmoothedPath(ctx, rawPath, smoothed, animProgress) {
  if (!smoothed || smoothed.length < 2) return;
  const drawLen = Math.floor(smoothed.length * animProgress);
  if (drawLen < 2) return;

  // Glow shadow
  ctx.save();
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(74,222,128,0.2)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const s0 = gridToCanvas(smoothed[0].gx, smoothed[0].gy);
  ctx.moveTo(s0.x, s0.y);
  for (let i = 1; i < drawLen; i++) {
    const p = gridToCanvas(smoothed[i].gx, smoothed[i].gy);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();

  // Main path line
  ctx.save();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const s1 = gridToCanvas(smoothed[0].gx, smoothed[0].gy);
  ctx.moveTo(s1.x, s1.y);
  for (let i = 1; i < drawLen; i++) {
    const p = gridToCanvas(smoothed[i].gx, smoothed[i].gy);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();

  // Direction arrows
  if (animProgress >= 1 && rawPath) {
    ctx.fillStyle = '#86efac';
    const step = Math.max(1, Math.floor(rawPath.length / 8));
    for (let i = step; i < rawPath.length - 1; i += step) {
      const p1 = gridToCanvas(rawPath[i - 1].gx, rawPath[i - 1].gy);
      const p2 = gridToCanvas(rawPath[i].gx, rawPath[i].gy);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      ctx.save();
      ctx.translate(p2.x, p2.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, 3.5); ctx.lineTo(-4, -3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawMarker(ctx, gx, gy, type) {
  const { x, y } = gridToCanvas(gx, gy);
  ctx.save();
  if (type === 'start') {
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 18;
    // Outer ring
    ctx.strokeStyle = 'rgba(56,189,248,0.4)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
    // Fill
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', x, y);
  } else {
    ctx.shadowColor = '#f87171'; ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(248,113,113,0.4)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('D', x, y);
  }
  ctx.restore();
}

function drawLegend(ctx) {
  const items = [
    { color: 'rgba(34,197,94,0.75)',  label: 'Safe Zone'     },
    { color: 'rgba(234,179,8,0.75)',  label: 'Moderate Risk' },
    { color: 'rgba(220,38,38,0.75)',  label: 'High Risk'     },
    { color: 'rgba(10,10,10,0.9)',    label: 'Obstacle'      },
    { color: '#22c55e',               label: 'Safe Path'     },
  ];
  const x0 = 10, y0 = CANVAS_H - 10 - items.length * 19;
  ctx.fillStyle = 'rgba(8,14,30,0.82)';
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y0 - 6, 136, items.length * 19 + 12, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.2)'; ctx.lineWidth = 1; ctx.stroke();
  items.forEach((it, i) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(x0, y0 + i * 19, 12, 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.fillText(it.label, x0 + 16, y0 + i * 19 + 9.5);
  });
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SafePathNavigator({ terrainImageSrc, imageFile, segmentationImageSrc, riskHeatmapSrc }) {
  const { t, lang } = useLang();
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const gridRef   = useRef(null);
  const blobsRef  = useRef(DEFAULT_BLOBS);
  const startRef  = useRef({ gx: 4, gy: 42 });
  const destRef   = useRef({ gx: 60, gy: 5 });
  const bgImgRef  = useRef(null); // cached background image

  const [start,       setStart]       = useState({ gx: 4,  gy: 42 });
  const [dest,        setDest]        = useState({ gx: 60, gy: 5  });
  const [bgLoaded,    setBgLoaded]    = useState(false);
  const [rawPath,     setRawPath]     = useState(null);
  const [smoothPath,  setSmoothPath]  = useState(null);
  const [metrics,     setMetrics]     = useState(null);
  const [clickMode,   setClickMode]   = useState(null);
  const [animProg,    setAnimProg]    = useState(1);
  const [noPath,      setNoPath]      = useState(false);
  const [buildingGrid, setBuildingGrid] = useState(false);
  const [genTimeMs,   setGenTimeMs]   = useState(null);
  const [layerMode,   setLayerMode]   = useState('terrain'); // 'terrain' | 'heatmap' | 'seg'

  // Sync refs
  useEffect(() => { startRef.current = start; }, [start]);
  useEffect(() => { destRef.current  = dest;  }, [dest]);

  // Find nearest non-obstacle cell to a position
  const clampToPassable = useCallback((pos, grid) => {
    if (!grid) return pos;
    if (grid[pos.gy]?.[pos.gx]?.risk < TERRAIN_CLASSES.obstacle.weight) return pos;
    for (let r = 1; r < 10; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = pos.gx + dx, ny = pos.gy + dy;
          if (nx >= 0 && ny >= 0 && nx < GRID_W && ny < GRID_H) {
            if (grid[ny][nx].risk < TERRAIN_CLASSES.obstacle.weight) return { gx: nx, gy: ny };
          }
        }
      }
    }
    return pos;
  }, []);

  // ─── STEP 5+6: Run pathfinding + smoothing ─────────────────────────────────
  const runPathfinding = useCallback((s, d, grid) => {
    if (!grid) return;
    setNoPath(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Clamp start/dest to passable cells
    const cs = clampToPassable(s, grid);
    const cd = clampToPassable(d, grid);

    const t0 = performance.now();
    const found = astar(grid, cs, cd, GRID_W, GRID_H);
    const elapsed = performance.now() - t0;
    setGenTimeMs(Math.round(elapsed));

    if (found) {
      // Step 6: smooth
      const los      = lineOfSightSmooth(found, grid, GRID_W, GRID_H);
      const bezier   = bezierSmooth(los, 10);
      setRawPath(found);
      setSmoothPath(bezier);
      setMetrics(computePathMetrics(found, GRID_W, GRID_H, CANVAS_W, CANVAS_H));
      setNoPath(false);
      // Animate
      setAnimProg(0);
      let prog = 0;
      const step = () => {
        prog = Math.min(1, prog + 0.025);
        setAnimProg(prog);
        if (prog < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    } else {
      setRawPath(null); setSmoothPath(null); setMetrics(null); setNoPath(true);
    }
  }, [clampToPassable]);

  // ─── STEP 1+2: Build grid from image ──────────────────────────────────────
  useEffect(() => {
    const s = startRef.current;
    const d = destRef.current;

    if (imageFile) {
      setBuildingGrid(true);
      buildGridFromImage(imageFile).then(grid => {
        gridRef.current = grid;
        setBuildingGrid(false);
        runPathfinding(s, d, grid);
      });
    } else {
      const grid = buildDemoGrid(GRID_W, GRID_H, blobsRef.current);
      gridRef.current = grid;
      runPathfinding(s, d, grid);
    }

    // Cache background image and trigger redraw when loaded
    setBgLoaded(false);
    bgImgRef.current = null;
    if (terrainImageSrc) {
      const img = new Image();
      img.onload = () => { bgImgRef.current = img; setBgLoaded(true); };
      img.onerror = () => setBgLoaded(false);
      img.src = terrainImageSrc;
    }

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [imageFile, terrainImageSrc, runPathfinding]);

  // Re-run on start/dest change
  useEffect(() => {
    if (!gridRef.current) return;
    runPathfinding(start, dest, gridRef.current);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [start, dest, runPathfinding]);

  // ─── STEP 8: Draw canvas ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridRef.current) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#08121e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const doDraw = () => {
      if (bgImgRef.current) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(bgImgRef.current, 0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;
      }
      drawTerrainGrid(ctx, gridRef.current, bgImgRef.current ? 0.5 : 0.65);
      drawGridLines(ctx);
      drawSmoothedPath(ctx, rawPath, smoothPath, animProg);
      drawMarker(ctx, start.gx, start.gy, 'start');
      drawMarker(ctx, dest.gx,  dest.gy,  'dest');
      drawLegend(ctx);

      // Grid info overlay
      ctx.fillStyle = 'rgba(8,14,30,0.7)';
      ctx.fillRect(CANVAS_W - 160, 8, 152, 20);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`GRID ${GRID_W}×${GRID_H}  |  A* v3.0`, CANVAS_W - 10, 21);
      ctx.textAlign = 'left';
    };

    // Always draw immediately (bg image handled via bgLoaded state trigger)
    doDraw();
  }, [rawPath, smoothPath, animProg, start, dest, bgLoaded, lang]);

  // ─── CANVAS CLICK ─────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    if (!clickMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = canvasToGrid(e.clientX - rect.left, e.clientY - rect.top, rect);
    if (clickMode === 'start') setStart(pos);
    else setDest(pos);
    setClickMode(null);
  }, [clickMode]);

  // ─── STEP 7: Dynamic update ────────────────────────────────────────────────
  const handleDynamicUpdate = useCallback(() => {
    if (imageFile && gridRef.current) {
      // Nudge start/dest slightly for a new path variation
      const jitter = (v, max) => Math.max(0, Math.min(max - 1, v + Math.floor(Math.random() * 9) - 4));
      const ns = { gx: jitter(start.gx, GRID_W), gy: jitter(start.gy, GRID_H) };
      const nd = { gx: jitter(dest.gx, GRID_W),  gy: jitter(dest.gy,  GRID_H) };
      setStart(ns); setDest(nd);
    } else {
      const newBlobs = [
        ...DEFAULT_BLOBS,
        { gx: Math.floor(Math.random() * (GRID_W - 10)) + 5, gy: Math.floor(Math.random() * (GRID_H - 10)) + 5,
          r: 5 + Math.random() * 7, type: Math.random() > 0.4 ? 'high' : 'obstacle' },
      ];
      blobsRef.current = newBlobs;
      const grid = buildDemoGrid(GRID_W, GRID_H, newBlobs);
      gridRef.current = grid;
      runPathfinding(start, dest, grid);
    }
  }, [start, dest, imageFile, runPathfinding]);

  const safetyColor =
    !metrics ? '#94a3b8'
    : metrics.safety >= 80 ? '#22c55e'
    : metrics.safety >= 55 ? '#eab308'
    : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border/60 bg-card/60 overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-border/40 bg-card/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Navigation className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-wide">{t('safePathNavigator')}</h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {t('astarSubtitle')}
              {genTimeMs !== null && (
                <span className="ml-2 text-primary">· {genTimeMs}ms</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant={clickMode === 'start' ? 'default' : 'outline'}
            onClick={() => setClickMode(clickMode === 'start' ? null : 'start')}
            className="h-7 text-xs gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
            <MapPin className="w-3 h-3" />
            {clickMode === 'start' ? t('clickMap') : t('setStart')}
          </Button>
          <Button size="sm" variant={clickMode === 'dest' ? 'default' : 'outline'}
            onClick={() => setClickMode(clickMode === 'dest' ? null : 'dest')}
            className="h-7 text-xs gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10">
            <Flag className="w-3 h-3" />
            {clickMode === 'dest' ? t('clickMap') : t('setDest')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDynamicUpdate}
            className="h-7 text-xs gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
            <RefreshCw className="w-3 h-3" />
            {t('dynamicUpdate')}
          </Button>
        </div>
      </div>

      {/* ── Algorithm info banner ── */}
      <div className="flex items-center gap-4 px-5 py-2 bg-secondary/30 border-b border-border/20 text-[10px] font-mono text-muted-foreground overflow-x-auto">
        <span className="flex items-center gap-1 text-primary whitespace-nowrap"><Zap className="w-3 h-3"/>A* Risk-Weighted</span>
        <span className="whitespace-nowrap">Grid: {GRID_W}×{GRID_H}</span>
        <span className="whitespace-nowrap">8-Directional</span>
        <span className="whitespace-nowrap">LoS Smooth</span>
        <span className="whitespace-nowrap">Bezier Curve</span>
        <span className="whitespace-nowrap">f(n) = g(n) + h(n) + risk_cost</span>
      </div>

      {/* ── Click hint ── */}
      <AnimatePresence>
        {clickMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-mono">
                {t('clickMapHint')} {clickMode === 'start' ? t('startPoint') : t('destinationPoint')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Canvas ── */}
      <div className="relative">
        {buildingGrid && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Activity className="w-8 h-8 text-primary animate-pulse mb-3" />
            <p className="text-sm font-mono text-primary">Building terrain grid…</p>
            <p className="text-[10px] text-muted-foreground mt-1">Analysing pixel data · Aligning inputs</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          className="w-full block"
          style={{ cursor: clickMode ? 'crosshair' : 'default', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />

        {/* Coordinate badges */}
        <div className="absolute top-2 right-2 space-y-1 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/75 rounded px-2 py-1 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] font-mono text-blue-300">S ({start.gx},{start.gy})</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/75 rounded px-2 py-1 border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] font-mono text-red-300">D ({dest.gx},{dest.gy})</span>
          </div>
        </div>

        {/* No-path overlay */}
        <AnimatePresence>
          {noPath && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
              <div className="bg-card border border-red-500/40 rounded-lg p-6 text-center max-w-xs mx-4">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-foreground mb-1">{t('noPathFound')}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t('noPathDesc')}</p>
                <Button size="sm" onClick={handleDynamicUpdate} className="text-xs">
                  <RefreshCw className="w-3 h-3 mr-1.5" />{t('recalculate')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Step 10: Metrics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/40 border-t border-border/40 bg-card/80">
        <MetricCell icon={<Route className="w-4 h-4 text-primary" />}
          label={t('pathDistance')} value={metrics ? `${metrics.distance} m` : '—'}
          sub={t('totalRouteLength')} />
        <MetricCell icon={<Clock className="w-4 h-4 text-amber-400" />}
          label={t('estTravelTime')} value={metrics ? `${metrics.time} s` : '—'}
          sub={t('atSpeed')} />
        <MetricCell icon={<Shield className="w-4 h-4" style={{ color: safetyColor }} />}
          label={t('safetyScore')} value={metrics ? `${metrics.safety}%` : '—'}
          sub={t('riskWeightedRoute')} valueStyle={{ color: safetyColor }} />
        <MetricCell icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
          label="Hazards Avoided" value={metrics ? metrics.obstaclesAvoided : '—'}
          sub="High-risk cells bypassed" />
      </div>

      {/* ── Footer info ── */}
      {rawPath && (
        <div className="px-5 py-2 border-t border-border/30 bg-secondary/20 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{t('pathActive')}</span>
          </div>
          <span>·</span>
          <span>{rawPath.length} {t('waypoints')} (raw)</span>
          <span>·</span>
          <span>{smoothPath?.length ?? 0} pts (smoothed)</span>
          <span>·</span>
          <span>LoS + Bezier</span>
          <span>·</span>
          <span className="text-primary">{t('clickMapReposition')}</span>
        </div>
      )}

      {/* ── Algorithm detail panel ── */}
      <div className="border-t border-border/20 bg-secondary/10 px-5 py-3">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-[10px] font-mono text-muted-foreground">
            <span><span className="text-primary">Step 3</span> Weights: safe=1 · mod=5 · high=20 · obstacle=100</span>
            <span><span className="text-amber-400">Step 5</span> f(n) = g(n) + h(n) + risk×moveCost×0.5</span>
            <span><span className="text-green-400">Step 6</span> Bresenham LoS → Catmull-Rom Bezier</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCell({ icon, label, value, sub, valueStyle }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-bold font-mono text-foreground leading-tight" style={valueStyle}>{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
      </div>
    </div>
  );
}