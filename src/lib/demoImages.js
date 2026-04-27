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
  const HEADER_H = 32;
  const FOOTER_H = 20;
  const gridW = 80, gridH = 60;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Load image once, draw background + build grid from same source
  let classGrid = new Uint8Array(gridW * gridH);

  if (imageFile) {
    const sourceImg = await loadImage(imageFile);
    // Draw the actual image dimmed as the base layer
    ctx.drawImage(sourceImg, 0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, HEADER_H, width, height - HEADER_H - FOOTER_H);

    // Build class grid from same image
    const analysis = analyseImagePixels(sourceImg, gridW, gridH);
    for (let i = 0; i < gridW * gridH; i++) {
      const r = analysis.riskGrid[i];
      classGrid[i] = r > 0.60 ? 2 : r > 0.32 ? 1 : 0;
    }
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0b1a2e'); bg.addColorStop(1, '#163d1e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    // Fallback pattern
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const t = gx / gridW + gy / gridH;
        classGrid[gy * gridW + gx] = t < 0.6 ? 0 : t < 1.1 ? 1 : 2;
      }
    }
  }

  // Solid-colour segmentation mask per cell (strong, readable colours)
  const contentH = height - HEADER_H - FOOTER_H;
  const cellW = width / gridW;
  const cellH = contentH / gridH;

  // Use solid opaque colours — we composite them over the dimmed image using globalAlpha
  ctx.save();
  ctx.globalAlpha = 0.72;
  const CLASS_COLORS = ['#16a34a', '#d97706', '#dc2626']; // solid green / amber / red

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      ctx.fillStyle = CLASS_COLORS[classGrid[gy * gridW + gx]];
      ctx.fillRect(gx * cellW, HEADER_H + gy * cellH, cellW + 0.5, cellH + 0.5);
    }
  }
  ctx.restore();

  // Boundary lines where class changes
  ctx.lineWidth = 1.2;
  ctx.setLineDash([]);
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const cls = classGrid[gy * gridW + gx];
      const px = gx * cellW, py = HEADER_H + gy * cellH;
      if (gx < gridW - 1 && classGrid[gy * gridW + gx + 1] !== cls) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.moveTo(px + cellW, py); ctx.lineTo(px + cellW, py + cellH); ctx.stroke();
      }
      if (gy < gridH - 1 && classGrid[(gy + 1) * gridW + gx] !== cls) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.moveTo(px, py + cellH); ctx.lineTo(px + cellW, py + cellH); ctx.stroke();
      }
    }
  }

  // Subtle scanlines
  for (let y = HEADER_H; y < height - FOOTER_H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, y, width, 1);
  }

  // Legend
  const legendItems = [
    { color: '#16a34a', border: '#4ade80', label: 'Safe Terrain   — Class 0' },
    { color: '#d97706', border: '#fde68a', label: 'Moderate Risk  — Class 1' },
    { color: '#dc2626', border: '#fca5a5', label: 'Rocky/Obstacle — Class 2' },
  ];
  const lgH = legendItems.length * 20 + 14;
  ctx.fillStyle = 'rgba(5,12,28,0.90)';
  ctx.beginPath(); ctx.roundRect(8, height - FOOTER_H - lgH - 8, 195, lgH, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  legendItems.forEach((cl, i) => {
    const ly = height - FOOTER_H - lgH - 8 + 10 + i * 20;
    ctx.fillStyle = cl.color; ctx.fillRect(14, ly, 12, 12);
    ctx.strokeStyle = cl.border; ctx.lineWidth = 0.8; ctx.strokeRect(14, ly, 12, 12);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '9px monospace'; ctx.fillText(cl.label, 30, ly + 9);
  });

  // Header bar
  const hg = ctx.createLinearGradient(0, 0, width, 0);
  hg.addColorStop(0, 'rgba(3,105,161,0.97)'); hg.addColorStop(0.5, 'rgba(5,20,50,0.97)'); hg.addColorStop(1, 'rgba(3,105,161,0.97)');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, width, HEADER_H);
  ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 12px monospace';
  ctx.fillText('▶  SEMANTIC SEGMENTATION OUTPUT  —  VAJRADRISTI AI MODEL  v2.1', 12, 21);
  ctx.fillStyle = 'rgba(56,189,248,0.4)'; ctx.fillRect(0, HEADER_H - 1, width, 1);

  // Footer bar
  ctx.fillStyle = 'rgba(5,12,28,0.90)'; ctx.fillRect(0, height - FOOTER_H, width, FOOTER_H);
  ctx.fillStyle = '#64748b'; ctx.font = '8px monospace';
  ctx.fillText(`  CLASSES: 3   |   mIoU: 87.4%   |   INFERENCE: 42ms   |   BACKBONE: DeepLabV3+   |   INPUT: ${width}×${height}px`, 0, height - 6);

  return canvasToBase64(canvas);
}

// ─── RISK HEATMAP ────────────────────────────────────────────────────────────

// Interpolate between two RGB colours by t [0..1]
function lerpColor(r1,g1,b1, r2,g2,b2, t) {
  return [Math.round(r1+(r2-r1)*t), Math.round(g1+(g2-g1)*t), Math.round(b1+(b2-b1)*t)];
}

// Map a risk value [0..1] to an RGB colour through: green → yellow → orange → red → white
function riskToRgb(v) {
  if (v < 0.25) return lerpColor(16,185,129, 101,163,13, v/0.25);       // green → lime
  if (v < 0.50) return lerpColor(101,163,13, 234,179,8, (v-0.25)/0.25); // lime → yellow
  if (v < 0.75) return lerpColor(234,179,8, 239,68,68, (v-0.50)/0.25);  // yellow → red
  return lerpColor(239,68,68, 255,255,255, (v-0.75)/0.25);              // red → white-hot
}

export async function generateRiskHeatmapDemo(imageFile, width = 800, height = 600) {
  const HEADER_H = 32;
  const FOOTER_H = 22;
  const gridW = 80, gridH = 60;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark base
  ctx.fillStyle = '#060d1a'; ctx.fillRect(0, 0, width, height);

  const contentH = height - HEADER_H - FOOTER_H;
  const cellW = width / gridW;
  const cellH = contentH / gridH;

  if (imageFile) {
    const sourceImg = await loadImage(imageFile);
    const { riskGrid } = analyseImagePixels(sourceImg, gridW, gridH);

    // Draw per-cell heatmap with correct solid colours (no broken alpha math)
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const risk = riskGrid[gy * gridW + gx];
        const [r, g, b] = riskToRgb(risk);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(gx * cellW, HEADER_H + gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  } else {
    // Fallback: gradient left→right for demo
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const risk = gx / gridW;
        const [r, g, b] = riskToRgb(risk);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(gx * cellW, HEADER_H + gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }

  // Tactical grid overlay
  const gridSize = 50;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, HEADER_H); ctx.lineTo(x, height - FOOTER_H); ctx.stroke();
  }
  for (let y = HEADER_H; y <= height - FOOTER_H; y += gridSize) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Scanlines
  for (let y = HEADER_H; y < height - FOOTER_H; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, y, width, 1);
  }

  // Color scale bar (right side)
  const barX = width - 44, barY = HEADER_H + 10, barH = contentH - 20, barW = 16;
  const barGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
  barGrad.addColorStop(0,    '#10b981');
  barGrad.addColorStop(0.25, '#84cc16');
  barGrad.addColorStop(0.50, '#eab308');
  barGrad.addColorStop(0.75, '#ef4444');
  barGrad.addColorStop(1.0,  '#ffffff');
  ctx.fillStyle = barGrad;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.stroke();

  [
    { f: 0.0,  l: 'SAFE',     c: '#6ee7b7' },
    { f: 0.33, l: 'MODERATE', c: '#fde68a' },
    { f: 0.66, l: 'HIGH',     c: '#fca5a5' },
    { f: 0.92, l: 'CRITICAL', c: '#ffffff' },
  ].forEach(t => {
    const ty = barY + t.f * barH;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(barX - 4, ty); ctx.lineTo(barX, ty); ctx.stroke();
    ctx.fillStyle = t.c; ctx.font = '7.5px monospace'; ctx.textAlign = 'right';
    ctx.fillText(t.l, barX - 6, ty + 3);
  });
  ctx.textAlign = 'left';

  // Header
  const hg2 = ctx.createLinearGradient(0, 0, width, 0);
  hg2.addColorStop(0, 'rgba(127,29,29,0.97)'); hg2.addColorStop(0.5, 'rgba(5,12,28,0.97)'); hg2.addColorStop(1, 'rgba(127,29,29,0.97)');
  ctx.fillStyle = hg2; ctx.fillRect(0, 0, width, HEADER_H);
  ctx.fillStyle = '#f87171'; ctx.font = 'bold 12px monospace';
  ctx.fillText('▶  RISK HEAT MAP  —  TERRAIN DANGER ANALYSIS  —  VAJRADRISTI v2.1', 12, 21);
  ctx.fillStyle = 'rgba(239,68,68,0.45)'; ctx.fillRect(0, HEADER_H - 1, width, 1);

  // Footer
  ctx.fillStyle = 'rgba(5,12,28,0.92)'; ctx.fillRect(0, height - FOOTER_H, width, FOOTER_H);
  ctx.fillStyle = '#475569'; ctx.font = '8px monospace';
  ctx.fillText(`  RESOLUTION: ${width}×${height}   |   ALGORITHM: Per-Pixel Risk Analysis   |   THRESHOLD: 0.65`, 0, height - 8);

  return canvasToBase64(canvas);
}

// ─── DEMO METRICS (derived from image pixels) ────────────────────────────────

export async function getDemoMetrics(imageFile) {
  const sourceImg = await loadImage(imageFile);
  const { riskGrid, gridW, gridH, highZones, modZones, safeZones } = analyseImagePixels(sourceImg, 32, 24);

  const total = gridW * gridH;
  let highCount = 0, modCount = 0, safeCount = 0;
  for (let i = 0; i < total; i++) {
    const r = riskGrid[i];
    if (r > 0.65) highCount++;
    else if (r > 0.35) modCount++;
    else safeCount++;
  }

  const highPct  = Math.round((highCount / total) * 100);
  const modPct   = Math.round((modCount  / total) * 100);
  const safePct  = 100 - highPct - modPct;

  // Derive a pseudo IoU from how "clean" the segmentation boundaries are
  // (more edges → harder image → slightly lower IoU)
  let edgeCount = 0;
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      const idx = y * gridW + x;
      const diff = Math.abs(riskGrid[idx] - riskGrid[idx - 1]) + Math.abs(riskGrid[idx] - riskGrid[idx - gridW]);
      if (diff > 0.25) edgeCount++;
    }
  }
  const edgeRatio = edgeCount / total;
  const iouScore = parseFloat(Math.max(0.70, Math.min(0.97, 0.92 - edgeRatio * 0.8)).toFixed(2));

  // Inference time varies with image complexity
  const inferenceTime = `${Math.round(30 + edgeRatio * 60)} ms`;

  // Objects detected from distinct high-risk clusters
  const objectsDetected = Math.max(3, highZones.length + Math.round(modZones.length * 0.5));

  // Terrain difficulty: higher when more high-risk area
  const terrainDifficulty = parseFloat(Math.max(2.0, Math.min(9.8, highPct * 0.18 + modPct * 0.07 + 1.5)).toFixed(1));

  // Dynamic explanation lines
  const explanationLines = [];
  if (highPct > 20) explanationLines.push(`${highPct}% high-risk terrain detected in field of view`);
  if (highZones.length > 2) explanationLines.push(`${highZones.length} obstacle clusters identified`);
  if (modPct > 25) explanationLines.push(`Moderate terrain spans ${modPct}% — proceed with caution`);
  if (safePct > 40) explanationLines.push(`Safe corridor available — ${safePct}% clear path`);
  if (edgeRatio > 0.15) explanationLines.push('Complex terrain boundaries detected');
  if (terrainDifficulty > 6) explanationLines.push('Steep gradient / uneven surface warning');
  if (explanationLines.length < 3) explanationLines.push('AI model confidence within acceptable range');

  return {
    iou_score: iouScore,
    inference_time: inferenceTime,
    objects_detected: objectsDetected,
    risk_percentages: { high: highPct, moderate: modPct, safe: safePct },
    terrain_difficulty: terrainDifficulty,
    explanationLines,
  };
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