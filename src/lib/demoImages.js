/**
 * Generates demo segmentation / risk heatmap / safe-path images using Canvas.
 * Returns base64 PNG strings (no "data:image/png;base64," prefix, matching API format).
 */

function canvasToBase64(canvas) {
  return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
}

export function generateSegmentationDemo(width = 800, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // ── 1. SKY with atmospheric gradient ─────────────────────────────────────
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.38);
  sky.addColorStop(0,   '#0b1a2e');
  sky.addColorStop(0.5, '#122540');
  sky.addColorStop(1,   '#1e3a5f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.38);

  // Subtle cloud wisps
  [[0.15, 0.12], [0.45, 0.08], [0.72, 0.15], [0.88, 0.07]].forEach(([rx, ry]) => {
    const cg = ctx.createRadialGradient(rx * width, ry * height, 0, rx * width, ry * height, 55);
    cg.addColorStop(0, 'rgba(100,150,200,0.12)');
    cg.addColorStop(1, 'rgba(100,150,200,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(rx * width, ry * height, 80, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── 2. GROUND base (safe terrain — deep green) ───────────────────────────
  const ground = ctx.createLinearGradient(0, height * 0.38, 0, height);
  ground.addColorStop(0,   '#1a4d25');
  ground.addColorStop(0.4, '#1e5c2b');
  ground.addColorStop(1,   '#163d1e');
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.38, width, height * 0.62);

  // Ground texture — fine noise streaks
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 220; i++) {
    const gx = Math.random() * width;
    const gy = height * 0.38 + Math.random() * height * 0.62;
    ctx.strokeStyle = Math.random() > 0.5 ? '#4ade80' : '#052e12';
    ctx.lineWidth = Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (Math.random() - 0.5) * 30, gy + Math.random() * 12);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Horizon blend
  const hBlend = ctx.createLinearGradient(0, height * 0.33, 0, height * 0.5);
  hBlend.addColorStop(0, 'rgba(30,90,60,0)');
  hBlend.addColorStop(1, 'rgba(18,58,35,0.5)');
  ctx.fillStyle = hBlend;
  ctx.fillRect(0, height * 0.33, width, height * 0.17);

  // ── 3. ROCKY / HIGH-RISK ZONES (segmented red) ───────────────────────────
  const rocks = [
    { cx: 0.14, cy: 0.61, rx: 0.12, ry: 0.09, angle: 0.2  },
    { cx: 0.63, cy: 0.55, rx: 0.10, ry: 0.10, angle: -0.1 },
    { cx: 0.85, cy: 0.70, rx: 0.08, ry: 0.065, angle: 0.3 },
    { cx: 0.32, cy: 0.79, rx: 0.09, ry: 0.068, angle: 0.1 },
    { cx: 0.76, cy: 0.88, rx: 0.07, ry: 0.055, angle: -0.2},
  ];
  rocks.forEach(r => {
    // Flat segmentation fill
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(r.cx * width, r.cy * height, r.rx * width, r.ry * height, r.angle, 0, Math.PI * 2);
    ctx.fill();

    // Inner shading for depth
    const rg = ctx.createRadialGradient(
      r.cx * width - r.rx * width * 0.2, r.cy * height - r.ry * height * 0.2, 0,
      r.cx * width, r.cy * height, r.rx * width
    );
    rg.addColorStop(0, 'rgba(239,68,68,0.5)');
    rg.addColorStop(0.6, 'rgba(153,27,27,0.3)');
    rg.addColorStop(1, 'rgba(69,10,10,0.6)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.ellipse(r.cx * width, r.cy * height, r.rx * width, r.ry * height, r.angle, 0, Math.PI * 2);
    ctx.fill();

    // Edge highlight (segmentation boundary)
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(r.cx * width, r.cy * height, r.rx * width + 2, r.ry * height + 2, r.angle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rock crack texture
    ctx.strokeStyle = 'rgba(80,10,10,0.7)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const sx = (r.cx + (Math.random() - 0.5) * r.rx * 1.2) * width;
      const sy = (r.cy + (Math.random() - 0.5) * r.ry * 1.2) * height;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 22, sy + (Math.random() - 0.5) * 14);
      ctx.stroke();
    }
  });

  // ── 4. MODERATE-RISK ZONES (amber) ───────────────────────────────────────
  const moderate = [
    { cx: 0.44, cy: 0.63, rx: 0.085, ry: 0.065, angle: 0.4  },
    { cx: 0.70, cy: 0.78, rx: 0.075, ry: 0.055, angle: -0.3 },
    { cx: 0.07, cy: 0.75, rx: 0.065, ry: 0.05,  angle: 0.1  },
    { cx: 0.54, cy: 0.90, rx: 0.08,  ry: 0.055, angle: 0.2  },
    { cx: 0.92, cy: 0.58, rx: 0.055, ry: 0.045, angle: -0.1 },
  ];
  moderate.forEach(m => {
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(m.cx * width, m.cy * height, m.rx * width, m.ry * height, m.angle, 0, Math.PI * 2);
    ctx.fill();

    const mg = ctx.createRadialGradient(
      m.cx * width, m.cy * height, 0,
      m.cx * width, m.cy * height, m.rx * width
    );
    mg.addColorStop(0, 'rgba(251,191,36,0.55)');
    mg.addColorStop(0.5, 'rgba(217,119,6,0.3)');
    mg.addColorStop(1, 'rgba(120,60,0,0.5)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.ellipse(m.cx * width, m.cy * height, m.rx * width, m.ry * height, m.angle, 0, Math.PI * 2);
    ctx.fill();

    // Segmentation boundary dashes
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(m.cx * width, m.cy * height, m.rx * width + 2, m.ry * height + 2, m.angle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // ── 5. WATER / SAFE PATH CHANNEL (cyan-blue) ─────────────────────────────
  const waterPts = [
    [0.50, 0.99], [0.50, 0.85], [0.47, 0.74], [0.49, 0.62], [0.52, 0.52], [0.50, 0.43]
  ];
  ctx.beginPath();
  ctx.moveTo(waterPts[0][0] * width, waterPts[0][1] * height);
  for (let i = 1; i < waterPts.length - 1; i++) {
    const mx = (waterPts[i][0] + waterPts[i + 1][0]) / 2 * width;
    const my = (waterPts[i][1] + waterPts[i + 1][1]) / 2 * height;
    ctx.quadraticCurveTo(waterPts[i][0] * width, waterPts[i][1] * height, mx, my);
  }
  const wg = ctx.createLinearGradient(0.45 * width, 0, 0.55 * width, 0);
  wg.addColorStop(0, 'rgba(56,189,248,0.0)');
  wg.addColorStop(0.3, 'rgba(56,189,248,0.18)');
  wg.addColorStop(0.5, 'rgba(14,165,233,0.22)');
  wg.addColorStop(0.7, 'rgba(56,189,248,0.18)');
  wg.addColorStop(1, 'rgba(56,189,248,0.0)');
  ctx.strokeStyle = wg;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  // ── 6. SEGMENT CLASS OVERLAY LABELS (realistic AI output style) ──────────
  // Label boxes directly on segments
  const segLabels = [
    { x: 0.14, y: 0.56, text: 'ROCK', color: '#fca5a5', bg: 'rgba(153,27,27,0.85)' },
    { x: 0.63, y: 0.50, text: 'ROCK', color: '#fca5a5', bg: 'rgba(153,27,27,0.85)' },
    { x: 0.44, y: 0.59, text: 'GRAVEL', color: '#fde68a', bg: 'rgba(120,60,0,0.85)' },
    { x: 0.70, y: 0.73, text: 'GRAVEL', color: '#fde68a', bg: 'rgba(120,60,0,0.85)' },
    { x: 0.27, y: 0.50, text: 'TERRAIN', color: '#86efac', bg: 'rgba(20,83,45,0.85)' },
    { x: 0.55, y: 0.72, text: 'TERRAIN', color: '#86efac', bg: 'rgba(20,83,45,0.85)' },
    { x: 0.50, y: 0.42, text: 'PATH', color: '#7dd3fc', bg: 'rgba(3,105,161,0.85)' },
  ];
  ctx.font = 'bold 9px monospace';
  segLabels.forEach(lbl => {
    const tw = ctx.measureText(lbl.text).width;
    const bx = lbl.x * width - tw / 2 - 5;
    const by = lbl.y * height - 9;
    ctx.fillStyle = lbl.bg;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 10, 14, 3);
    ctx.fill();
    ctx.fillStyle = lbl.color;
    ctx.textAlign = 'center';
    ctx.fillText(lbl.text, lbl.x * width, lbl.y * height + 2);
  });
  ctx.textAlign = 'left';

  // ── 7. CONFIDENCE SCORES on segments ─────────────────────────────────────
  const confs = [
    { x: 0.14, y: 0.65, score: '97.3%' },
    { x: 0.63, y: 0.62, score: '94.8%' },
    { x: 0.32, y: 0.74, score: '91.2%' },
    { x: 0.44, y: 0.70, score: '88.5%' },
    { x: 0.70, y: 0.82, score: '85.1%' },
  ];
  ctx.font = '8px monospace';
  confs.forEach(c => {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(c.score, c.x * width, c.y * height);
  });

  // ── 8. SCAN LINE effect (AI inference visual) ─────────────────────────────
  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, y, width, 1);
  }

  // ── 9. COMPASS ROSE ───────────────────────────────────────────────────────
  const cx2 = width - 38, cy2 = height - 38, cr = 20;
  ctx.beginPath();
  ctx.arc(cx2, cy2, cr + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,20,40,0.75)';
  ctx.fill();
  [['N', 0, -1], ['S', 0, 1], ['E', 1, 0], ['W', -1, 0]].forEach(([label, dx, dy]) => {
    ctx.fillStyle = label === 'N' ? '#38bdf8' : '#94a3b8';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx2 + dx * (cr - 5), cy2 + dy * (cr - 5) + 3);
  });
  ctx.textAlign = 'left';

  // ── 10. LEGEND ────────────────────────────────────────────────────────────
  const classes = [
    { color: '#1e5c2b', border: '#4ade80', label: 'Safe Terrain   — Class 0' },
    { color: '#b45309', border: '#fde68a', label: 'Moderate Risk  — Class 1' },
    { color: '#b91c1c', border: '#fca5a5', label: 'Rocky/Obstacle — Class 2' },
    { color: '#0c4a6e', border: '#7dd3fc', label: 'Path/Water     — Class 3' },
    { color: '#0b1a2e', border: '#94a3b8', label: 'Background     — Class 4' },
  ];
  const lgH = classes.length * 20 + 14;
  ctx.fillStyle = 'rgba(5,12,28,0.88)';
  ctx.beginPath();
  ctx.roundRect(8, height - lgH - 8, 195, lgH, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  classes.forEach((cl, i) => {
    const ly = height - lgH - 8 + 10 + i * 20;
    ctx.fillStyle = cl.color;
    ctx.fillRect(14, ly, 12, 12);
    ctx.strokeStyle = cl.border;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(14, ly, 12, 12);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '9px monospace';
    ctx.fillText(cl.label, 30, ly + 9);
  });

  // ── 11. HEADER BAR ────────────────────────────────────────────────────────
  const hg = ctx.createLinearGradient(0, 0, width, 0);
  hg.addColorStop(0, 'rgba(3,105,161,0.95)');
  hg.addColorStop(0.5, 'rgba(5,20,50,0.95)');
  hg.addColorStop(1, 'rgba(3,105,161,0.95)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, width, 32);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('▶  SEMANTIC SEGMENTATION OUTPUT  —  VAJRADRISTI AI MODEL  v2.1', 12, 21);
  ctx.fillStyle = 'rgba(56,189,248,0.4)';
  ctx.fillRect(0, 31, width, 1);

  // Model stats strip
  ctx.fillStyle = 'rgba(5,12,28,0.8)';
  ctx.fillRect(0, height - 20, width, 20);
  ctx.fillStyle = '#64748b';
  ctx.font = '8px monospace';
  ctx.fillText(
    `  CLASSES: 5   |   mIoU: 87.4%   |   INFERENCE: 42ms   |   BACKBONE: DeepLabV3+   |   INPUT: ${width}×${height}px`,
    0, height - 7
  );

  return canvasToBase64(canvas);
}

export function generateRiskHeatmapDemo(width = 800, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // ── 1. BACKGROUND — deep terrain base ─────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0,   '#060d1a');
  bg.addColorStop(0.4, '#080f1f');
  bg.addColorStop(1,   '#050b14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // ── 2. SAFE ZONES first (green base layer) ────────────────────────────────
  const safeZones = [
    { x: 0.50, y: 0.92, r: 0.20 },
    { x: 0.22, y: 0.88, r: 0.14 },
    { x: 0.78, y: 0.90, r: 0.15 },
    { x: 0.38, y: 0.72, r: 0.09 },
  ];
  safeZones.forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0,    'rgba(16,185,129,0.72)');
    g.addColorStop(0.35, 'rgba(5,150,105,0.45)');
    g.addColorStop(0.7,  'rgba(6,95,70,0.20)');
    g.addColorStop(1,    'rgba(6,95,70,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── 3. MODERATE RISK ZONES (amber transition) ──────────────────────────────
  const modZones = [
    { x: 0.30, y: 0.64, r: 0.16 },
    { x: 0.62, y: 0.68, r: 0.14 },
    { x: 0.08, y: 0.74, r: 0.10 },
    { x: 0.84, y: 0.72, r: 0.11 },
    { x: 0.47, y: 0.55, r: 0.09 },
    { x: 0.70, y: 0.56, r: 0.08 },
  ];
  modZones.forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0,    'rgba(245,158,11,0.85)');
    g.addColorStop(0.3,  'rgba(217,119,6,0.60)');
    g.addColorStop(0.65, 'rgba(180,83,9,0.28)');
    g.addColorStop(1,    'rgba(120,53,15,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── 4. HIGH RISK ZONES (red hot cores) ────────────────────────────────────
  const highZones = [
    { x: 0.17, y: 0.60, r: 0.17 },
    { x: 0.65, y: 0.54, r: 0.14 },
    { x: 0.87, y: 0.65, r: 0.11 },
    { x: 0.38, y: 0.80, r: 0.09 },
    { x: 0.77, y: 0.82, r: 0.08 },
  ];
  highZones.forEach(z => {
    const r = z.r * Math.min(width, height);
    // multi-stop for hot core look
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0,    'rgba(255,255,255,0.55)');  // white hot core
    g.addColorStop(0.08, 'rgba(254,202,202,0.70)');  // light red
    g.addColorStop(0.25, 'rgba(239,68,68,0.90)');    // bright red
    g.addColorStop(0.50, 'rgba(185,28,28,0.70)');    // deep red
    g.addColorStop(0.75, 'rgba(127,29,29,0.35)');
    g.addColorStop(1,    'rgba(69,10,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── 5. OBSTACLE CORES (pure black with red halo) ──────────────────────────
  const obstacles = [
    { x: 0.17, y: 0.60, r: 0.04 },
    { x: 0.65, y: 0.54, r: 0.035 },
    { x: 0.87, y: 0.65, r: 0.028 },
  ];
  obstacles.forEach(z => {
    const r = z.r * Math.min(width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.95)';
    ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239,68,68,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Warning X
    ctx.strokeStyle = 'rgba(254,202,202,0.9)';
    ctx.lineWidth = 1.2;
    const ox = z.x * width, oy = z.y * height, os = r * 0.55;
    ctx.beginPath(); ctx.moveTo(ox - os, oy - os); ctx.lineTo(ox + os, oy + os); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + os, oy - os); ctx.lineTo(ox - os, oy + os); ctx.stroke();
  });

  // ── 6. RISK CONTOUR LINES ─────────────────────────────────────────────────
  // Concentric rings around high-risk zones
  highZones.forEach(z => {
    [0.6, 0.85, 1.15].forEach((mult, i) => {
      const r = z.r * Math.min(width, height) * mult;
      ctx.beginPath();
      ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239,68,68,${0.18 - i * 0.05})`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  });

  // ── 7. TACTICAL GRID ──────────────────────────────────────────────────────
  const gridSize = 50;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.strokeStyle = x % (gridSize * 4) === 0
      ? 'rgba(56,189,248,0.12)'
      : 'rgba(56,189,248,0.045)';
    ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x, height - 24); ctx.stroke();
    if (x % (gridSize * 2) === 0 && x > 0 && x < width - 40) {
      ctx.fillStyle = 'rgba(56,189,248,0.25)';
      ctx.font = '7px monospace';
      ctx.fillText(x, x + 2, height - 26);
    }
  }
  for (let y = 32; y <= height - 24; y += gridSize) {
    ctx.strokeStyle = y % (gridSize * 4) === 0
      ? 'rgba(56,189,248,0.12)'
      : 'rgba(56,189,248,0.045)';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    if (y % (gridSize * 2) === 0 && y > 40) {
      ctx.fillStyle = 'rgba(56,189,248,0.25)';
      ctx.font = '7px monospace';
      ctx.fillText(y, 2, y - 2);
    }
  }

  // ── 8. RISK SCORE LABELS on each zone ────────────────────────────────────
  const riskLabels = [
    { x: 0.17, y: 0.60, score: '9.4', level: 'CRITICAL', color: '#fca5a5' },
    { x: 0.65, y: 0.54, score: '8.7', level: 'HIGH',     color: '#fca5a5' },
    { x: 0.87, y: 0.65, score: '8.1', level: 'HIGH',     color: '#fca5a5' },
    { x: 0.30, y: 0.64, score: '5.3', level: 'MODERATE', color: '#fde68a' },
    { x: 0.62, y: 0.68, score: '4.8', level: 'MODERATE', color: '#fde68a' },
    { x: 0.50, y: 0.92, score: '1.2', level: 'SAFE',     color: '#6ee7b7' },
  ];
  riskLabels.forEach(lbl => {
    const lx = lbl.x * width;
    const ly = lbl.y * height + 14;
    ctx.fillStyle = 'rgba(5,12,28,0.88)';
    ctx.beginPath();
    ctx.roundRect(lx - 22, ly - 8, 44, 16, 3);
    ctx.fill();
    ctx.strokeStyle = lbl.color + '66';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = lbl.color;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${lbl.score} · ${lbl.level}`, lx, ly + 3);
  });
  ctx.textAlign = 'left';

  // ── 9. COLOR SCALE BAR (full spectrum) ───────────────────────────────────
  const barX = width - 44, barY = 42, barH = height - 80, barW = 16;
  const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
  barGrad.addColorStop(0,    '#10b981'); // safe — green
  barGrad.addColorStop(0.35, '#f59e0b'); // moderate — amber
  barGrad.addColorStop(0.65, '#ef4444'); // high — red
  barGrad.addColorStop(0.9,  '#7f1d1d'); // critical — dark red
  barGrad.addColorStop(1,    '#000000'); // obstacle — black
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.stroke();

  // Scale tick labels
  const scaleTicks = [
    { frac: 0.0,  label: '0  SAFE',     color: '#6ee7b7' },
    { frac: 0.35, label: '5  MODERATE', color: '#fde68a' },
    { frac: 0.65, label: '8  HIGH',     color: '#fca5a5' },
    { frac: 0.9,  label: '10 CRITICAL', color: '#f87171' },
  ];
  scaleTicks.forEach(t => {
    const ty = barY + t.frac * barH;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(barX - 4, ty); ctx.lineTo(barX, ty); ctx.stroke();
    ctx.fillStyle = t.color;
    ctx.font = '7.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(t.label, barX - 6, ty + 3);
  });
  ctx.textAlign = 'left';

  // Bar title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '7px monospace';
  ctx.save();
  ctx.translate(width - 6, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('RISK INDEX (0 – 10)', 0, 0);
  ctx.restore();

  // ── 10. MINI STATS PANEL ──────────────────────────────────────────────────
  const stats = [
    { label: 'HIGH RISK',  value: '25%', color: '#ef4444' },
    { label: 'MODERATE',   value: '40%', color: '#f59e0b' },
    { label: 'SAFE ZONE',  value: '35%', color: '#10b981' },
  ];
  const spX = 10, spY = 42;
  ctx.fillStyle = 'rgba(5,12,28,0.82)';
  ctx.beginPath();
  ctx.roundRect(spX, spY, 105, stats.length * 22 + 10, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  stats.forEach((s, i) => {
    const sy = spY + 14 + i * 22;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(spX + 10, sy - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(s.label, spX + 18, sy);
    ctx.fillStyle = s.color;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(s.value, spX + 80, sy);
  });

  // ── 11. SCAN LINES ────────────────────────────────────────────────────────
  for (let y = 32; y < height; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    ctx.fillRect(0, y, width, 1);
  }

  // ── 12. HEADER BAR ────────────────────────────────────────────────────────
  const hg2 = ctx.createLinearGradient(0, 0, width, 0);
  hg2.addColorStop(0,   'rgba(127,29,29,0.97)');
  hg2.addColorStop(0.5, 'rgba(5,12,28,0.97)');
  hg2.addColorStop(1,   'rgba(127,29,29,0.97)');
  ctx.fillStyle = hg2;
  ctx.fillRect(0, 0, width, 32);
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('▶  RISK HEAT MAP  —  TERRAIN DANGER ANALYSIS  —  VAJRADRISTI v2.1', 12, 21);
  ctx.fillStyle = 'rgba(239,68,68,0.45)';
  ctx.fillRect(0, 31, width, 1);

  // Bottom status strip
  ctx.fillStyle = 'rgba(5,12,28,0.85)';
  ctx.fillRect(0, height - 22, width, 22);
  ctx.fillStyle = '#475569';
  ctx.font = '8px monospace';
  ctx.fillText(
    `  RESOLUTION: ${width}×${height}   |   RISK ZONES: 14   |   ALGORITHM: Gaussian KDE   |   THRESHOLD: 0.65   |   COVERAGE: 100%`,
    0, height - 8
  );

  return canvasToBase64(canvas);
}

export function generateSafePathDemo(width = 640, height = 480) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base terrain
  ctx.fillStyle = '#1a2a1a';
  ctx.fillRect(0, 0, width, height);

  // Dim risk zones
  const zones = [
    { x: 120, y: height * 0.58, r: 110, color: [220, 38, 38],  alpha: 0.35 },
    { x: 460, y: height * 0.52, r: 90,  color: [220, 38, 38],  alpha: 0.30 },
    { x: 330, y: height * 0.58, r: 65,  color: [234, 179, 8],  alpha: 0.25 },
  ];
  zones.forEach(b => {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, `rgba(${b.color.join(',')},${b.alpha})`);
    g.addColorStop(1, `rgba(${b.color.join(',')},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Safe corridor shading
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(width * 0.32, height);
  ctx.bezierCurveTo(width * 0.35, height * 0.75, width * 0.42, height * 0.65, width * 0.45, height * 0.48);
  ctx.bezierCurveTo(width * 0.48, height * 0.48, width * 0.58, height * 0.48, width * 0.6, height * 0.48);
  ctx.bezierCurveTo(width * 0.62, height * 0.65, width * 0.65, height * 0.75, width * 0.68, height);
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,197,94,0.15)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,197,94,0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();

  // Safe path line
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 4;
  ctx.setLineDash([]);
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(width * 0.52, height * 0.96);
  ctx.bezierCurveTo(width * 0.52, height * 0.76, width * 0.5, height * 0.65, width * 0.52, height * 0.5);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Waypoints
  const waypoints = [
    { x: width * 0.52, y: height * 0.96 },
    { x: width * 0.52, y: height * 0.76 },
    { x: width * 0.50, y: height * 0.62 },
    { x: width * 0.52, y: height * 0.50 },
  ];
  waypoints.forEach((wp, i) => {
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, i === 0 || i === waypoints.length - 1 ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#22c55e' : i === waypoints.length - 1 ? '#38bdf8' : '#86efac';
    ctx.fill();
    ctx.strokeStyle = '#0a0f1e';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Legend
  const items = [
    { color: '#4ade80', label: 'Safe Path' },
    { color: '#f87171', label: 'High Risk Zone' },
    { color: '#fbbf24', label: 'Moderate Zone' },
    { color: '#38bdf8', label: 'Destination' },
  ];
  items.forEach((it, i) => {
    ctx.fillStyle = 'rgba(10,20,40,0.8)';
    ctx.fillRect(10, 10 + i * 22, 130, 18);
    ctx.fillStyle = it.color;
    ctx.fillRect(12, 13 + i * 22, 14, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText(it.label, 30, 23 + i * 22);
  });

  // Title
  ctx.fillStyle = 'rgba(10,20,40,0.85)';
  ctx.fillRect(0, 0, width, 28);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('SAFE PATH — OPTIMAL NAVIGATION ROUTE', 10, 18);

  return canvasToBase64(canvas);
}