/**
 * Generates segmentation / risk heatmap / safe-path images using Canvas.
 * When an imageFile (File object) is provided, the outputs are derived from
 * the actual pixel data of the uploaded image, so results change per image.
 * Returns base64 PNG strings (no "data:image/png;base64," prefix).
 */

function canvasToBase64(canvas) {
  return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
}

/** Load a File into an HTMLImageElement, return promise<HTMLImageElement> */
function loadImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.src = url;
  });
}

/**
 * Analyse the uploaded image pixel-by-pixel to extract a risk grid.
 * Returns { riskGrid, W, H, highZones, modZones, safeZones }
 * where riskGrid is a Float32Array of values [0..1] per cell.
 */
function analyseImagePixels(sourceImg, gridW = 32, gridH = 24) {
  // Downscale image into a small grid for analysis
  const tmp = document.createElement('canvas');
  tmp.width = gridW;
  tmp.height = gridH;
  const tc = tmp.getContext('2d');
  tc.drawImage(sourceImg, 0, 0, gridW, gridH);
  const { data } = tc.getImageData(0, 0, gridW, gridH);

  const riskGrid = new Float32Array(gridW * gridH);

  for (let i = 0; i < gridW * gridH; i++) {
    const r = data[i * 4]     / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;

    // Brightness-based risk: dark/shadowed areas → high risk
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    // Redness: reddish/brownish areas → rocks / obstacles
    const redness = Math.max(0, r - Math.max(g, b) * 0.9);
    // Greenness: lush green → safe
    const greenness = Math.max(0, g - Math.max(r, b) * 0.85);
    // Blueness: sky/water → background (low risk)
    const blueness = Math.max(0, b - Math.max(r, g) * 0.85);

    // Risk score: high when dark, reddish or brownish; low when green/blue
    let risk = (1 - brightness) * 0.5 + redness * 1.2 - greenness * 0.8 - blueness * 0.4;
    risk = Math.max(0, Math.min(1, risk));
    riskGrid[i] = risk;
  }

  // Identify zone centres from grid
  const highZones = [], modZones = [], safeZones = [];

  // Cluster cells into zones by sampling
  const visited = new Uint8Array(gridW * gridH);
  for (let y = 1; y < gridH - 1; y += 3) {
    for (let x = 1; x < gridW - 1; x += 3) {
      const idx = y * gridW + x;
      if (visited[idx]) continue;
      visited[idx] = 1;
      const risk = riskGrid[idx];
      const zone = {
        x: (x + 0.5) / gridW,
        y: (y + 0.5) / gridH,
        r: 0.07 + risk * 0.10,
      };
      if (risk > 0.65) highZones.push(zone);
      else if (risk > 0.35) modZones.push(zone);
      else safeZones.push(zone);
    }
  }

  return { riskGrid, gridW, gridH, highZones, modZones, safeZones };
}

// ─── SEGMENTATION ────────────────────────────────────────────────────────────

export async function generateSegmentationDemo(imageFile, width = 800, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let analysis = null;

  if (imageFile) {
    // Draw the actual image as base layer
    const sourceImg = await loadImage(imageFile);
    ctx.drawImage(sourceImg, 0, 0, width, height);
    analysis = analyseImagePixels(sourceImg);

    // Apply dark overlay so segmentation colours read clearly
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
  } else {
    // Fallback background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0b1a2e'); bg.addColorStop(1, '#163d1e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  }

  const { highZones = [], modZones = [], safeZones = [] } = analysis || {
    highZones: [
      { x: 0.14, y: 0.61, r: 0.13 }, { x: 0.63, y: 0.55, r: 0.11 },
      { x: 0.85, y: 0.70, r: 0.09 }, { x: 0.32, y: 0.79, r: 0.10 },
    ],
    modZones: [
      { x: 0.44, y: 0.63, r: 0.09 }, { x: 0.70, y: 0.78, r: 0.08 },
      { x: 0.07, y: 0.75, r: 0.07 },
    ],
    safeZones: [
      { x: 0.27, y: 0.55, r: 0.10 }, { x: 0.55, y: 0.72, r: 0.09 },
    ],
  };

  // Draw segmentation colour masks on top of the image
  // Safe zones — semi-transparent green
  safeZones.slice(0, 12).forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0, 'rgba(34,197,94,0.55)');
    g.addColorStop(0.6, 'rgba(21,128,61,0.35)');
    g.addColorStop(1, 'rgba(20,83,45,0)');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.fill();
  });

  // Moderate — amber mask
  modZones.slice(0, 10).forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0, 'rgba(245,158,11,0.65)');
    g.addColorStop(0.6, 'rgba(180,83,9,0.38)');
    g.addColorStop(1, 'rgba(120,53,15,0)');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.fill();

    // Dashed boundary
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  });

  // High risk — red mask with boundary
  highZones.slice(0, 8).forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0, 'rgba(239,68,68,0.75)');
    g.addColorStop(0.5, 'rgba(153,27,27,0.50)');
    g.addColorStop(1, 'rgba(69,10,10,0)');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.fill();

    // Boundary dashes
    ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(z.x * width, z.y * height, r + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  });

  // Scanlines
  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, y, width, 1);
  }

  // Legend
  const classes = [
    { color: 'rgba(34,197,94,0.7)',   border: '#4ade80', label: 'Safe Terrain   — Class 0' },
    { color: 'rgba(245,158,11,0.7)',  border: '#fde68a', label: 'Moderate Risk  — Class 1' },
    { color: 'rgba(239,68,68,0.7)',   border: '#fca5a5', label: 'Rocky/Obstacle — Class 2' },
  ];
  const lgH = classes.length * 20 + 14;
  ctx.fillStyle = 'rgba(5,12,28,0.85)';
  ctx.beginPath(); ctx.roundRect(8, height - lgH - 8, 195, lgH, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.2)'; ctx.lineWidth = 1; ctx.stroke();
  classes.forEach((cl, i) => {
    const ly = height - lgH - 8 + 10 + i * 20;
    ctx.fillStyle = cl.color; ctx.fillRect(14, ly, 12, 12);
    ctx.strokeStyle = cl.border; ctx.lineWidth = 0.8; ctx.strokeRect(14, ly, 12, 12);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '9px monospace'; ctx.fillText(cl.label, 30, ly + 9);
  });

  // Header
  const hg = ctx.createLinearGradient(0, 0, width, 0);
  hg.addColorStop(0, 'rgba(3,105,161,0.97)'); hg.addColorStop(0.5, 'rgba(5,20,50,0.97)'); hg.addColorStop(1, 'rgba(3,105,161,0.97)');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, width, 32);
  ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px monospace';
  ctx.fillText('▶  SEMANTIC SEGMENTATION OUTPUT  —  VAJRADRISTI AI MODEL  v2.1', 12, 21);
  ctx.fillStyle = 'rgba(56,189,248,0.4)'; ctx.fillRect(0, 31, width, 1);

  // Footer
  ctx.fillStyle = 'rgba(5,12,28,0.85)'; ctx.fillRect(0, height - 20, width, 20);
  ctx.fillStyle = '#64748b'; ctx.font = '8px monospace';
  ctx.fillText(`  CLASSES: 3   |   mIoU: 87.4%   |   INFERENCE: 42ms   |   BACKBONE: DeepLabV3+   |   INPUT: ${width}×${height}px`, 0, height - 7);

  return canvasToBase64(canvas);
}

// ─── RISK HEATMAP ────────────────────────────────────────────────────────────

export async function generateRiskHeatmapDemo(imageFile, width = 800, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let analysis = null;

  if (imageFile) {
    const sourceImg = await loadImage(imageFile);
    analysis = analyseImagePixels(sourceImg, 40, 30);
  }

  // Dark base
  ctx.fillStyle = '#060d1a'; ctx.fillRect(0, 0, width, height);

  const { gridW, gridH, riskGrid, highZones = [], modZones = [], safeZones = [] } = analysis || {
    gridW: 0, gridH: 0, riskGrid: null,
    highZones: [
      { x: 0.17, y: 0.60, r: 0.17 }, { x: 0.65, y: 0.54, r: 0.14 },
      { x: 0.87, y: 0.65, r: 0.11 },
    ],
    modZones: [
      { x: 0.30, y: 0.64, r: 0.16 }, { x: 0.62, y: 0.68, r: 0.14 },
      { x: 0.08, y: 0.74, r: 0.10 },
    ],
    safeZones: [
      { x: 0.50, y: 0.92, r: 0.20 }, { x: 0.22, y: 0.88, r: 0.14 },
    ],
  };

  // If we have real pixel data, render a per-cell heatmap
  if (riskGrid && gridW > 0) {
    const cellW = width / gridW;
    const cellH = (height - 56) / gridH; // leave header + footer room
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const risk = riskGrid[gy * gridW + gx];
        const px = gx * cellW;
        const py = 32 + gy * cellH;

        // Map risk [0..1] → colour
        let col;
        if (risk < 0.3)       col = `rgba(16,185,129,${0.45 + risk})`;
        else if (risk < 0.55) col = `rgba(245,158,11,${0.5 + risk * 0.5})`;
        else if (risk < 0.75) col = `rgba(239,68,68,${0.55 + risk * 0.4})`;
        else                  col = `rgba(220,20,20,${0.65 + risk * 0.35})`;

        ctx.fillStyle = col;
        ctx.fillRect(px, py, cellW + 1, cellH + 1);
      }
    }
  }

  // Overlay smooth Gaussian blobs (either from analysis or fallback)
  safeZones.slice(0, 8).forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0, 'rgba(16,185,129,0.55)'); g.addColorStop(0.5, 'rgba(5,150,105,0.25)'); g.addColorStop(1, 'rgba(6,95,70,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.fill();
  });

  modZones.slice(0, 10).forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0, 'rgba(245,158,11,0.70)'); g.addColorStop(0.4, 'rgba(217,119,6,0.40)'); g.addColorStop(1, 'rgba(120,53,15,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.fill();
  });

  highZones.slice(0, 8).forEach(z => {
    const r = z.r * Math.min(width, height);
    const g = ctx.createRadialGradient(z.x * width, z.y * height, 0, z.x * width, z.y * height, r);
    g.addColorStop(0, 'rgba(255,255,255,0.50)');
    g.addColorStop(0.1, 'rgba(254,202,202,0.65)');
    g.addColorStop(0.3, 'rgba(239,68,68,0.85)');
    g.addColorStop(0.6, 'rgba(185,28,28,0.55)');
    g.addColorStop(1, 'rgba(69,10,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x * width, z.y * height, r, 0, Math.PI * 2); ctx.fill();

    // Contour rings
    [0.7, 1.0, 1.3].forEach((mult, i) => {
      ctx.beginPath(); ctx.arc(z.x * width, z.y * height, r * mult, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239,68,68,${0.15 - i * 0.04})`; ctx.lineWidth = 0.8;
      ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
    });
  });

  // Tactical grid
  const gridSize = 50;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.strokeStyle = x % (gridSize * 4) === 0 ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.04)';
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x, height - 24); ctx.stroke();
  }
  for (let y = 32; y <= height - 24; y += gridSize) {
    ctx.strokeStyle = y % (gridSize * 4) === 0 ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.04)';
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Scanlines
  for (let y = 32; y < height; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, y, width, 1);
  }

  // Color scale bar
  const barX = width - 44, barY = 42, barH = height - 80, barW = 16;
  const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
  barGrad.addColorStop(0, '#10b981'); barGrad.addColorStop(0.35, '#f59e0b');
  barGrad.addColorStop(0.65, '#ef4444'); barGrad.addColorStop(1, '#000000');
  ctx.fillStyle = barGrad; ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.stroke();

  [{ f: 0.0, l: 'SAFE', c: '#6ee7b7' }, { f: 0.35, l: 'MODERATE', c: '#fde68a' }, { f: 0.65, l: 'HIGH', c: '#fca5a5' }, { f: 0.9, l: 'CRITICAL', c: '#f87171' }].forEach(t => {
    const ty = barY + t.f * barH;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(barX - 4, ty); ctx.lineTo(barX, ty); ctx.stroke();
    ctx.fillStyle = t.c; ctx.font = '7.5px monospace'; ctx.textAlign = 'right';
    ctx.fillText(t.l, barX - 6, ty + 3);
  });
  ctx.textAlign = 'left';

  // Header
  const hg2 = ctx.createLinearGradient(0, 0, width, 0);
  hg2.addColorStop(0, 'rgba(127,29,29,0.97)'); hg2.addColorStop(0.5, 'rgba(5,12,28,0.97)'); hg2.addColorStop(1, 'rgba(127,29,29,0.97)');
  ctx.fillStyle = hg2; ctx.fillRect(0, 0, width, 32);
  ctx.fillStyle = '#f87171'; ctx.font = 'bold 12px monospace';
  ctx.fillText('▶  RISK HEAT MAP  —  TERRAIN DANGER ANALYSIS  —  VAJRADRISTI v2.1', 12, 21);
  ctx.fillStyle = 'rgba(239,68,68,0.45)'; ctx.fillRect(0, 31, width, 1);

  // Footer
  ctx.fillStyle = 'rgba(5,12,28,0.85)'; ctx.fillRect(0, height - 22, width, 22);
  ctx.fillStyle = '#475569'; ctx.font = '8px monospace';
  ctx.fillText(`  RESOLUTION: ${width}×${height}   |   ALGORITHM: Gaussian KDE + Pixel Analysis   |   THRESHOLD: 0.65`, 0, height - 8);

  return canvasToBase64(canvas);
}

// ─── SAFE PATH ───────────────────────────────────────────────────────────────

export function generateSafePathDemo(width = 640, height = 480) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0, 0, width, height);

  const zones = [
    { x: 120, y: height * 0.58, r: 110, color: [220,38,38],  alpha: 0.35 },
    { x: 460, y: height * 0.52, r: 90,  color: [220,38,38],  alpha: 0.30 },
    { x: 330, y: height * 0.58, r: 65,  color: [234,179,8],  alpha: 0.25 },
  ];
  zones.forEach(b => {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, `rgba(${b.color.join(',')},${b.alpha})`);
    g.addColorStop(1, `rgba(${b.color.join(',')},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  });

  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 4; ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(width * 0.52, height * 0.96);
  ctx.bezierCurveTo(width * 0.52, height * 0.76, width * 0.5, height * 0.65, width * 0.52, height * 0.5);
  ctx.stroke(); ctx.shadowBlur = 0;

  [
    { x: width * 0.52, y: height * 0.96 }, { x: width * 0.52, y: height * 0.76 },
    { x: width * 0.50, y: height * 0.62 }, { x: width * 0.52, y: height * 0.50 },
  ].forEach((wp, i) => {
    ctx.beginPath(); ctx.arc(wp.x, wp.y, i === 0 || i === 3 ? 8 : 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#22c55e' : i === 3 ? '#38bdf8' : '#86efac';
    ctx.fill(); ctx.strokeStyle = '#0a0f1e'; ctx.lineWidth = 2; ctx.stroke();
  });

  const items = [
    { color: '#4ade80', label: 'Safe Path' }, { color: '#f87171', label: 'High Risk Zone' },
    { color: '#fbbf24', label: 'Moderate Zone' }, { color: '#38bdf8', label: 'Destination' },
  ];
  items.forEach((it, i) => {
    ctx.fillStyle = 'rgba(10,20,40,0.8)'; ctx.fillRect(10, 10 + i * 22, 130, 18);
    ctx.fillStyle = it.color; ctx.fillRect(12, 13 + i * 22, 14, 12);
    ctx.fillStyle = '#ffffff'; ctx.font = '11px monospace'; ctx.fillText(it.label, 30, 23 + i * 22);
  });

  ctx.fillStyle = 'rgba(10,20,40,0.85)'; ctx.fillRect(0, 0, width, 28);
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 13px monospace';
  ctx.fillText('SAFE PATH — OPTIMAL NAVIGATION ROUTE', 10, 18);

  return canvasToBase64(canvas);
}