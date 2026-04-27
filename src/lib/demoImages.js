/**
 * Generates demo segmentation / risk heatmap / safe-path images using Canvas.
 * Returns base64 PNG strings (no "data:image/png;base64," prefix, matching API format).
 */

function canvasToBase64(canvas) {
  return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
}

export function generateSegmentationDemo(width = 640, height = 480) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background - sky
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.45);
  sky.addColorStop(0, '#1a2a4a');
  sky.addColorStop(1, '#2d4a6e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.45);

  // Ground - safe terrain (green)
  ctx.fillStyle = '#2d7a3a';
  ctx.fillRect(0, height * 0.45, width, height * 0.55);

  // Rocky patches (red - high risk)
  const rocks = [
    { x: 80,  y: height * 0.52, w: 140, h: 80  },
    { x: 420, y: height * 0.48, w: 110, h: 100 },
    { x: 550, y: height * 0.6,  w: 70,  h: 55  },
    { x: 200, y: height * 0.7,  w: 90,  h: 60  },
  ];
  rocks.forEach(r => {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // texture
    ctx.strokeStyle = '#922b21';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(r.x + Math.random() * r.w, r.y + Math.random() * r.h);
      ctx.lineTo(r.x + Math.random() * r.w, r.y + Math.random() * r.h);
      ctx.stroke();
    }
  });

  // Moderate risk patches (amber/yellow)
  const moderate = [
    { x: 300, y: height * 0.55, w: 90, h: 50 },
    { x: 480, y: height * 0.72, w: 70, h: 45 },
    { x: 30,  y: height * 0.68, w: 60, h: 40 },
  ];
  moderate.forEach(m => {
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.ellipse(m.x + m.w / 2, m.y + m.h / 2, m.w / 2, m.h / 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Safe path overlay (blue-green)
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 6;
  ctx.setLineDash([12, 6]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.95);
  ctx.bezierCurveTo(width * 0.5, height * 0.75, width * 0.35, height * 0.65, width * 0.38, height * 0.55);
  ctx.stroke();
  ctx.setLineDash([]);

  // Class legend overlay
  const classes = [
    { color: '#2d7a3a', label: 'Safe Terrain' },
    { color: '#c0392b', label: 'Rocky/Obstacle' },
    { color: '#f39c12', label: 'Moderate Risk' },
    { color: '#1a2a4a', label: 'Background' },
  ];
  classes.forEach((cl, i) => {
    ctx.fillStyle = 'rgba(10,20,40,0.75)';
    ctx.fillRect(10, 10 + i * 22, 120, 18);
    ctx.fillStyle = cl.color;
    ctx.fillRect(12, 13 + i * 22, 14, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText(cl.label, 30, 23 + i * 22);
  });

  // Title
  ctx.fillStyle = 'rgba(10,20,40,0.8)';
  ctx.fillRect(0, 0, width, 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('SEGMENTATION OUTPUT — AI MODEL', 10, 18);

  return canvasToBase64(canvas);
}

export function generateRiskHeatmapDemo(width = 640, height = 480) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark base
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, width, height);

  // Gaussian-like blobs for risk zones
  const blobs = [
    { x: 120, y: height * 0.58, r: 120, color: [220, 38, 38],  alpha: 0.85 }, // high risk
    { x: 460, y: height * 0.52, r: 100, color: [220, 38, 38],  alpha: 0.80 },
    { x: 570, y: height * 0.65, r: 70,  color: [220, 38, 38],  alpha: 0.70 },
    { x: 230, y: height * 0.74, r: 80,  color: [234, 179, 8],  alpha: 0.75 }, // moderate
    { x: 330, y: height * 0.58, r: 75,  color: [234, 179, 8],  alpha: 0.65 },
    { x: 500, y: height * 0.78, r: 65,  color: [234, 179, 8],  alpha: 0.60 },
    { x: 45,  y: height * 0.72, r: 55,  color: [234, 179, 8],  alpha: 0.55 },
    { x: 290, y: height * 0.88, r: 100, color: [34, 197, 94],  alpha: 0.50 }, // safe
    { x: 520, y: height * 0.90, r: 90,  color: [34, 197, 94],  alpha: 0.45 },
    { x: 150, y: height * 0.90, r: 80,  color: [34, 197, 94],  alpha: 0.40 },
  ];

  blobs.forEach(b => {
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0,   `rgba(${b.color.join(',')},${b.alpha})`);
    grad.addColorStop(0.5, `rgba(${b.color.join(',')},${b.alpha * 0.4})`);
    grad.addColorStop(1,   `rgba(${b.color.join(',')},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Grid overlay
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Color scale bar
  const barGrad = ctx.createLinearGradient(width - 30, height * 0.2, width - 30, height * 0.8);
  barGrad.addColorStop(0,    'rgba(34,197,94,1)');
  barGrad.addColorStop(0.5,  'rgba(234,179,8,1)');
  barGrad.addColorStop(1,    'rgba(220,38,38,1)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(width - 28, height * 0.2, 14, height * 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(width - 28, height * 0.2, 14, height * 0.6);
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.fillText('LOW',  width - 44, height * 0.2 + 4);
  ctx.fillText('HIGH', width - 46, height * 0.8 + 4);

  // Title
  ctx.fillStyle = 'rgba(10,20,40,0.85)';
  ctx.fillRect(0, 0, width, 28);
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('RISK HEATMAP — TERRAIN ANALYSIS', 10, 18);

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