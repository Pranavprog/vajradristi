import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, MapPin, Flag, Clock, Route, Shield, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildDemoGrid, buildGridFromImage, astar, computePathMetrics, TERRAIN_CLASSES } from '@/lib/pathfinding';
import { useLang } from '@/lib/LanguageContext';

const GRID_W = 60;
const GRID_H = 45;
const CANVAS_W = 720;
const CANVAS_H = 540;

// Default risk blobs for demo mode
const DEFAULT_BLOBS = [
  { gx: 12, gy: 24, r: 9,  type: 'high'     },
  { gx: 36, gy: 20, r: 8,  type: 'high'     },
  { gx: 50, gy: 30, r: 7,  type: 'high'     },
  { gx: 24, gy: 34, r: 8,  type: 'obstacle' },
  { gx: 42, gy: 12, r: 6,  type: 'obstacle' },
  { gx: 20, gy: 18, r: 10, type: 'moderate' },
  { gx: 44, gy: 36, r: 9,  type: 'moderate' },
  { gx: 8,  gy: 36, r: 7,  type: 'moderate' },
  { gx: 55, gy: 15, r: 6,  type: 'moderate' },
];

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

function drawGrid(ctx, grid) {
  const cw = CANVAS_W / GRID_W;
  const ch = CANVAS_H / GRID_H;
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const cell = grid[gy][gx];
      let color;
      switch (cell.type) {
        case 'high':     color = 'rgba(220,38,38,0.55)';  break;
        case 'obstacle': color = 'rgba(15,15,15,0.85)';   break;
        case 'moderate': color = 'rgba(234,179,8,0.45)';  break;
        default:         color = 'rgba(34,197,94,0.18)';  break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(gx * cw, gy * ch, cw, ch);
    }
  }
}

function drawGridLines(ctx) {
  ctx.strokeStyle = 'rgba(56,189,248,0.05)';
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

function smoothPath(path) {
  if (path.length < 3) return path;
  // Simple path smoothing: average neighbors
  const smoothed = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    smoothed.push({
      gx: (path[i - 1].gx + path[i].gx + path[i + 1].gx) / 3,
      gy: (path[i - 1].gy + path[i].gy + path[i + 1].gy) / 3,
      type: path[i].type,
    });
  }
  smoothed.push(path[path.length - 1]);
  return smoothed;
}

function drawPath(ctx, path, animProgress = 1) {
  if (!path || path.length < 2) return;
  const smoothed = smoothPath(path);
  const drawLen  = Math.floor(smoothed.length * animProgress);
  if (drawLen < 2) return;

  // Shadow glow
  ctx.save();
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur  = 14;
  ctx.strokeStyle = 'rgba(74,222,128,0.25)';
  ctx.lineWidth   = 14;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  const s = gridToCanvas(smoothed[0].gx, smoothed[0].gy);
  ctx.moveTo(s.x, s.y);
  for (let i = 1; i < drawLen; i++) {
    const p = gridToCanvas(smoothed[i].gx, smoothed[i].gy);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();

  // Main path
  ctx.save();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth   = 3.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  const s2 = gridToCanvas(smoothed[0].gx, smoothed[0].gy);
  ctx.moveTo(s2.x, s2.y);
  for (let i = 1; i < drawLen; i++) {
    const p = gridToCanvas(smoothed[i].gx, smoothed[i].gy);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();

  // Direction arrows every ~8 steps
  if (animProgress >= 1) {
    ctx.fillStyle = '#4ade80';
    for (let i = 8; i < drawLen - 1; i += 8) {
      const p1 = gridToCanvas(smoothed[i - 1].gx, smoothed[i - 1].gy);
      const p2 = gridToCanvas(smoothed[i].gx, smoothed[i].gy);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      ctx.save();
      ctx.translate(p2.x, p2.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(5, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3);
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
    // Blue pulsing dot
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', x, y);
  } else {
    // Red flag
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', x, y);
  }
  ctx.restore();
}

function drawLegend(ctx, labels = ['Safe Zone', 'Moderate Risk', 'High Risk', 'Obstacle', 'Safe Path']) {
  const items = [
    { color: 'rgba(34,197,94,0.7)',  label: labels[0] },
    { color: 'rgba(234,179,8,0.7)',  label: labels[1] },
    { color: 'rgba(220,38,38,0.7)',  label: labels[2] },
    { color: 'rgba(15,15,15,0.9)',   label: labels[3] },
    { color: '#22c55e',              label: labels[4] },
  ];
  const x0 = 10, y0 = CANVAS_H - 14 - items.length * 18;
  ctx.fillStyle = 'rgba(10,20,40,0.75)';
  ctx.fillRect(x0 - 4, y0 - 6, 130, items.length * 18 + 10);
  items.forEach((it, i) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(x0, y0 + i * 18, 12, 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.fillText(it.label, x0 + 16, y0 + i * 18 + 9);
  });
}

export default function SafePathNavigator({ terrainImageSrc }) {
  const { t, lang } = useLang();
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const gridRef    = useRef(null);
  const blobsRef   = useRef(DEFAULT_BLOBS);

  const [start, setStart]       = useState({ gx: 4,  gy: 38 });
  const [dest,  setDest]        = useState({ gx: 56, gy: 6  });
  const [path,  setPath]        = useState(null);
  const [metrics, setMetrics]   = useState(null);
  const [clickMode, setClickMode] = useState(null); // 'start' | 'dest' | null
  const [animProg, setAnimProg] = useState(1);
  const [isCalc,  setIsCalc]    = useState(false);
  const [noPath,  setNoPath]    = useState(false);
  const [draggingBlob, setDraggingBlob] = useState(null);

  // Rebuild grid from image whenever the terrain image changes
  useEffect(() => {
    if (terrainImageSrc) {
      buildGridFromImage(terrainImageSrc, GRID_W, GRID_H).then((grid) => {
        if (grid) {
          gridRef.current = grid;
          runPathfinding(start, dest, grid);
        }
      });
    } else {
      gridRef.current = buildDemoGrid(GRID_W, GRID_H, blobsRef.current);
      runPathfinding(start, dest, gridRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrainImageSrc]);

  // Run A*
  const runPathfinding = useCallback((s, d, grid) => {
    setIsCalc(true);
    setNoPath(false);
    const t0 = performance.now();
    const found = astar(grid, s, d, GRID_W, GRID_H);
    const elapsed = performance.now() - t0;
    console.log(`A* time: ${elapsed.toFixed(1)}ms`);
    if (found) {
      setPath(found);
      setMetrics(computePathMetrics(found, GRID_W, GRID_H, CANVAS_W, CANVAS_H));
      setNoPath(false);
      // Animate draw
      setAnimProg(0);
      let prog = 0;
      const step = () => {
        prog = Math.min(1, prog + 0.025);
        setAnimProg(prog);
        if (prog < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    } else {
      setPath(null);
      setMetrics(null);
      setNoPath(true);
    }
    setIsCalc(false);
  }, []);

  // Re-run A* when start/dest changes (grid already built by image effect)
  useEffect(() => {
    if (!gridRef.current) return;
    runPathfinding(start, dest, gridRef.current);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [start, dest, runPathfinding]);

  // Draw canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridRef.current) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Terrain background image if available
    if (terrainImageSrc) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = 0.25;
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1;
        drawGrid(ctx, gridRef.current);
        drawGridLines(ctx);
        drawPath(ctx, path, animProg);
        drawMarker(ctx, start.gx, start.gy, 'start');
        drawMarker(ctx, dest.gx, dest.gy, 'dest');
        drawLegend(ctx, [t('legendSafeZone'), t('legendModerateRisk'), t('legendHighRisk'), t('legendObstacle'), t('legendSafePath')]);
      };
      img.src = terrainImageSrc;
    } else {
      drawGrid(ctx, gridRef.current);
      drawGridLines(ctx);
      drawPath(ctx, path, animProg);
      drawMarker(ctx, start.gx, start.gy, 'start');
      drawMarker(ctx, dest.gx, dest.gy, 'dest');
      drawLegend(ctx, [t('legendSafeZone'), t('legendModerateRisk'), t('legendHighRisk'), t('legendObstacle'), t('legendSafePath')]);
    }
  }, [path, animProg, start, dest, terrainImageSrc, lang]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    if (!clickMode) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const pos = canvasToGrid(cx, cy, rect);
    if (clickMode === 'start') setStart(pos);
    else setDest(pos);
    setClickMode(null);
  }, [clickMode]);

  // Recalculate with random obstacles
  const handleDynamicUpdate = useCallback(() => {
    const newBlobs = [
      ...DEFAULT_BLOBS,
      {
        gx: Math.floor(Math.random() * (GRID_W - 10)) + 5,
        gy: Math.floor(Math.random() * (GRID_H - 10)) + 5,
        r: 5 + Math.random() * 6,
        type: Math.random() > 0.5 ? 'high' : 'obstacle',
      },
    ];
    blobsRef.current = newBlobs;
    gridRef.current  = buildDemoGrid(GRID_W, GRID_H, newBlobs);
    runPathfinding(start, dest, gridRef.current);
  }, [start, dest, runPathfinding]);

  const safetyColor =
    !metrics ? '#94a3b8'
    : metrics.safety >= 80 ? '#22c55e'
    : metrics.safety >= 60 ? '#eab308'
    : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border/60 bg-card/60 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Navigation className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-wide">{t('safePathNavigator')}</h2>
            <p className="text-[10px] text-muted-foreground font-mono">{t('astarSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={clickMode === 'start' ? 'default' : 'outline'}
            onClick={() => setClickMode(clickMode === 'start' ? null : 'start')}
            className="h-7 text-xs gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
          >
            <MapPin className="w-3 h-3" />
            {clickMode === 'start' ? t('clickMap') : t('setStart')}
          </Button>
          <Button
            size="sm"
            variant={clickMode === 'dest' ? 'default' : 'outline'}
            onClick={() => setClickMode(clickMode === 'dest' ? null : 'dest')}
            className="h-7 text-xs gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            <Flag className="w-3 h-3" />
            {clickMode === 'dest' ? t('clickMap') : t('setDest')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDynamicUpdate}
            className="h-7 text-xs gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className="w-3 h-3" />
            {t('dynamicUpdate')}
          </Button>
        </div>
      </div>

      {/* Click mode hint */}
      <AnimatePresence>
        {clickMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-mono">
                {t('clickMapHint')} {clickMode === 'start' ? t('startPoint') : t('destinationPoint')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          className="w-full block"
          style={{ cursor: clickMode ? 'crosshair' : 'default', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />

        {/* Coordinate overlays */}
        <div className="absolute top-2 right-2 space-y-1 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/70 rounded px-2 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-mono text-blue-300">
              S ({start.gx}, {start.gy})
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/70 rounded px-2 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-[10px] font-mono text-red-300">
              D ({dest.gx}, {dest.gy})
            </span>
          </div>
        </div>

        {/* No path warning */}
        <AnimatePresence>
          {noPath && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <div className="bg-card border border-red-500/40 rounded-lg p-6 text-center max-w-xs">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-foreground mb-1">{t('noPathFound')}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {t('noPathDesc')}
                </p>
                <Button size="sm" onClick={handleDynamicUpdate} className="text-xs">
                  <RefreshCw className="w-3 h-3 mr-1.5" /> {t('recalculate')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 divide-x divide-border/40 border-t border-border/40 bg-card/80">
        <MetricCell
          icon={<Route className="w-4 h-4 text-primary" />}
          label={t('pathDistance')}
          value={metrics ? `${metrics.distance} m` : '—'}
          sub={t('totalRouteLength')}
        />
        <MetricCell
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          label={t('estTravelTime')}
          value={metrics ? `${metrics.time} s` : '—'}
          sub={t('atSpeed')}
        />
        <MetricCell
          icon={<Shield className="w-4 h-4" style={{ color: safetyColor }} />}
          label={t('safetyScore')}
          value={metrics ? `${metrics.safety}%` : '—'}
          sub={t('riskWeightedRoute')}
          valueStyle={{ color: safetyColor }}
        />
      </div>

      {/* Path info footer */}
      {path && (
        <div className="px-5 py-2.5 border-t border-border/30 bg-secondary/20 flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{t('pathActive')}</span>
          </div>
          <span>·</span>
          <span>{path.length} {t('waypoints')}</span>
          <span>·</span>
          <span>A* Algorithm</span>
          <span>·</span>
          <span>Grid: {GRID_W}×{GRID_H}</span>
          <span>·</span>
          <span className="text-primary">{t('clickMapReposition')}</span>
        </div>
      )}
    </motion.div>
  );
}

function MetricCell({ icon, label, value, sub, valueStyle }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold font-mono text-foreground" style={valueStyle}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}