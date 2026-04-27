/**
 * VAJRADRISTI — Path Planning Engine v3.0
 * Full A* with risk-aware cost, 8-directional movement,
 * line-of-sight smoothing, and Bezier curve generation.
 */

// ─── TERRAIN CLASSES ─────────────────────────────────────────────────────────
export const TERRAIN_CLASSES = {
  safe:     { weight: 1,   color: [34, 197, 94],   label: 'Safe Terrain'  },
  moderate: { weight: 5,   color: [234, 179, 8],   label: 'Moderate Risk' },
  high:     { weight: 20,  color: [220, 38, 38],   label: 'High Risk'     },
  obstacle: { weight: 100, color: [15, 15, 15],    label: 'Obstacle'      },
  unknown:  { weight: 10,  color: [100, 100, 120], label: 'Unknown'       },
};

// ─── STEP 1+2: BUILD GRID FROM ALIGNED IMAGE PIXEL DATA ──────────────────────

/**
 * Build a grid by analysing pixel data from the terrain image.
 * Applies a 2-pass approach: raw risk score → normalize → classify.
 */
export function buildGridFromPixels(imageData, gridW, gridH, imgW, imgH) {
  const cellW = imgW / gridW;
  const cellH = imgH / gridH;
  const rawRisk = new Float32Array(gridW * gridH);

  // Pass 1 — compute raw risk per cell
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      // Average over cell area for stability
      let rSum = 0, gSum = 0, bSum = 0, samples = 0;
      const x0 = Math.floor(gx * cellW);
      const y0 = Math.floor(gy * cellH);
      const x1 = Math.min(Math.floor((gx + 1) * cellW), imgW);
      const y1 = Math.min(Math.floor((gy + 1) * cellH), imgH);

      for (let py = y0; py < y1; py += 2) {
        for (let px = x0; px < x1; px += 2) {
          const idx = (py * imgW + px) * 4;
          rSum += imageData.data[idx];
          gSum += imageData.data[idx + 1];
          bSum += imageData.data[idx + 2];
          samples++;
        }
      }
      if (samples === 0) samples = 1;
      const r = rSum / samples / 255;
      const g = gSum / samples / 255;
      const b = bSum / samples / 255;

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      const redness    = Math.max(0, r - Math.max(g, b) * 0.85);
      const greenness  = Math.max(0, g - Math.max(r, b) * 0.8);
      const blueness   = Math.max(0, b - Math.max(r, g) * 0.8);
      const darkness   = 1 - brightness;

      let risk = darkness * 0.45 + redness * 0.9 - greenness * 0.6 - blueness * 0.3;
      rawRisk[gy * gridW + gx] = Math.max(0, Math.min(1, risk));
    }
  }

  // Pass 2 — normalize to [0,1] to work for any image
  let minR = 1, maxR = 0;
  for (let i = 0; i < rawRisk.length; i++) {
    if (rawRisk[i] < minR) minR = rawRisk[i];
    if (rawRisk[i] > maxR) maxR = rawRisk[i];
  }
  const span = maxR - minR || 1;

  const grid = [];
  for (let gy = 0; gy < gridH; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      const norm = (rawRisk[gy * gridW + gx] - minR) / span;
      let type, weight;
      if (norm > 0.82)      { type = 'obstacle'; weight = TERRAIN_CLASSES.obstacle.weight; }
      else if (norm > 0.60) { type = 'high';     weight = TERRAIN_CLASSES.high.weight;     }
      else if (norm > 0.35) { type = 'moderate'; weight = TERRAIN_CLASSES.moderate.weight; }
      else                  { type = 'safe';     weight = TERRAIN_CLASSES.safe.weight;     }
      grid[gy][gx] = { gx, gy, risk: weight, type, norm, f: 0, g: 0, h: 0, parent: null };
    }
  }
  return grid;
}

/**
 * Fuse segmentation image data into an existing grid to refine obstacle detection.
 * Segmentation: dark pixels = obstacles, green = safe, red = high risk, yellow = moderate
 */
export function fuseSegmentationGrid(grid, segImageData, gridW, gridH, imgW, imgH) {
  const cellW = imgW / gridW;
  const cellH = imgH / gridH;
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const px = Math.min(Math.floor((gx + 0.5) * cellW), imgW - 1);
      const py = Math.min(Math.floor((gy + 0.5) * cellH), imgH - 1);
      const idx = (py * imgW + px) * 4;
      const r = segImageData.data[idx];
      const g = segImageData.data[idx + 1];
      const b = segImageData.data[idx + 2];

      let type = null, weight = null;
      if (r < 40 && g < 40 && b < 40) { type = 'obstacle'; weight = TERRAIN_CLASSES.obstacle.weight; }
      else if (r > 150 && g < 100)    { type = 'high';     weight = TERRAIN_CLASSES.high.weight; }
      else if (r > 100 && g > 100 && b < 100) { type = 'moderate'; weight = TERRAIN_CLASSES.moderate.weight; }
      else if (g > 120 && r < 120)    { type = 'safe';     weight = TERRAIN_CLASSES.safe.weight; }

      // Only upgrade risk (never downgrade) when segmentation disagrees
      if (type && weight > grid[gy][gx].risk) {
        grid[gy][gx].type = type;
        grid[gy][gx].risk = weight;
      }
    }
  }
  return grid;
}

// ─── DEMO GRID (no image available) ─────────────────────────────────────────

export function buildDemoGrid(gridW, gridH, riskBlobs = []) {
  const grid = [];
  for (let gy = 0; gy < gridH; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      let risk = TERRAIN_CLASSES.safe.weight;
      let type = 'safe';

      for (const blob of riskBlobs) {
        const dx = gx - blob.gx;
        const dy = gy - blob.gy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < blob.r) {
          if (blob.type === 'obstacle' && dist < blob.r * 0.5) {
            risk = TERRAIN_CLASSES.obstacle.weight; type = 'obstacle'; break;
          } else if (blob.type === 'high' && risk < TERRAIN_CLASSES.high.weight) {
            risk = TERRAIN_CLASSES.high.weight; type = 'high';
          } else if (blob.type === 'moderate' && type === 'safe') {
            risk = TERRAIN_CLASSES.moderate.weight; type = 'moderate';
          }
        }
      }
      grid[gy][gx] = { gx, gy, risk, type, norm: 0, f: 0, g: 0, h: 0, parent: null };
    }
  }
  return grid;
}

// ─── STEP 4+5: A* PATHFINDING ────────────────────────────────────────────────

function heuristic(a, b) {
  // Octile distance — optimal for 8-directional movement
  const dx = Math.abs(a.gx - b.gx);
  const dy = Math.abs(a.gy - b.gy);
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

function getNeighbors(grid, node, gridW, gridH) {
  const dirs = [
    [0, -1, 1], [0, 1, 1], [-1, 0, 1], [1, 0, 1],          // cardinal
    [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2],               // diagonal
    [-1, 1, Math.SQRT2],  [1, 1, Math.SQRT2],
  ];
  const neighbors = [];
  for (const [dx, dy, moveCost] of dirs) {
    const nx = node.gx + dx;
    const ny = node.gy + dy;
    if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue;
    const nb = grid[ny][nx];
    if (nb.risk >= TERRAIN_CLASSES.obstacle.weight) continue; // blocked
    // For diagonal moves, require both cardinal neighbours to be passable
    if (dx !== 0 && dy !== 0) {
      if (grid[node.gy][nx].risk >= TERRAIN_CLASSES.obstacle.weight) continue;
      if (grid[ny][node.gx].risk >= TERRAIN_CLASSES.obstacle.weight) continue;
    }
    neighbors.push({ node: nb, moveCost });
  }
  return neighbors;
}

export function astar(grid, start, end, gridW, gridH) {
  // Reset grid state
  for (let y = 0; y < gridH; y++)
    for (let x = 0; x < gridW; x++)
      Object.assign(grid[y][x], { f: 0, g: Infinity, h: 0, parent: null });

  const startNode = grid[start.gy][start.gx];
  const endNode   = grid[end.gy][end.gx];

  // Min-heap via sorted array (good for typical grid sizes)
  const open = [startNode];
  const openSet = new Set([startNode]);
  const closed  = new Set();

  startNode.g = 0;
  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.h;

  const MAX_ITER = gridW * gridH * 2;
  let iterations = 0;

  while (open.length > 0 && iterations++ < MAX_ITER) {
    // Pop lowest f
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    openSet.delete(current);

    if (current === endNode) {
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ gx: node.gx, gy: node.gy, type: node.type, risk: node.risk });
        node = node.parent;
      }
      return path;
    }

    closed.add(current);

    for (const { node: neighbor, moveCost } of getNeighbors(grid, current, gridW, gridH)) {
      if (closed.has(neighbor)) continue;

      // f(n) = g(n) + h(n) + risk_cost (Step 5 cost function)
      const tentativeG = current.g + moveCost + neighbor.risk * moveCost * 0.5;

      if (tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        if (!openSet.has(neighbor)) {
          open.push(neighbor);
          openSet.add(neighbor);
        }
      }
    }
  }
  return null;
}

// ─── STEP 6: PATH SMOOTHING ──────────────────────────────────────────────────

/**
 * Line-of-sight smoothing (String Pulling / Funnel algorithm lite)
 * Removes unnecessary waypoints when there is a clear line of sight.
 */
export function lineOfSightSmooth(path, grid, gridW, gridH) {
  if (path.length < 3) return path;
  const result = [path[0]];
  let anchor = 0;

  for (let i = 1; i < path.length; i++) {
    if (!hasLineOfSight(path[anchor], path[i], grid, gridW, gridH)) {
      result.push(path[i - 1]);
      anchor = i - 1;
    }
  }
  result.push(path[path.length - 1]);
  return result;
}

function hasLineOfSight(a, b, grid, gridW, gridH) {
  // Bresenham line check
  let x0 = a.gx, y0 = a.gy;
  const x1 = b.gx, y1 = b.gy;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    if (x0 < 0 || y0 < 0 || x0 >= gridW || y0 >= gridH) return false;
    if (grid[y0][x0].risk >= TERRAIN_CLASSES.obstacle.weight) return false;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx)  { err += dx; y0 += sy; }
  }
}

/**
 * Bezier curve smoothing — converts sparse waypoints into dense smooth curve
 */
export function bezierSmooth(path, samplesPerSegment = 8) {
  if (path.length < 3) return path;
  const pts = path;
  const smooth = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[Math.min(pts.length - 1, i + 1)];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    for (let t = 0; t < samplesPerSegment; t++) {
      const tt = t / samplesPerSegment;
      const tt2 = tt * tt, tt3 = tt2 * tt;
      // Catmull-Rom → Bezier
      const gx = 0.5 * (
        (2 * p1.gx) +
        (-p0.gx + p2.gx) * tt +
        (2 * p0.gx - 5 * p1.gx + 4 * p2.gx - p3.gx) * tt2 +
        (-p0.gx + 3 * p1.gx - 3 * p2.gx + p3.gx) * tt3
      );
      const gy = 0.5 * (
        (2 * p1.gy) +
        (-p0.gy + p2.gy) * tt +
        (2 * p0.gy - 5 * p1.gy + 4 * p2.gy - p3.gy) * tt2 +
        (-p0.gy + 3 * p1.gy - 3 * p2.gy + p3.gy) * tt3
      );
      smooth.push({ gx, gy, type: p1.type, risk: p1.risk });
    }
  }
  smooth.push(pts[pts.length - 1]);
  return smooth;
}

// ─── STEP 10: METRICS ────────────────────────────────────────────────────────

export function computePathMetrics(path, gridW, gridH, canvasW, canvasH) {
  if (!path || path.length < 2) return { distance: 0, time: 0, safety: 100, obstaclesAvoided: 0 };

  const cellW = canvasW / gridW;
  const cellH = canvasH / gridH;
  const pixelToMeter = 0.12;

  let totalDist = 0, riskSum = 0, obstaclesAvoided = 0;
  const highRiskCells = new Set();

  for (let i = 1; i < path.length; i++) {
    const dx = (path[i].gx - path[i - 1].gx) * cellW;
    const dy = (path[i].gy - path[i - 1].gy) * cellH;
    totalDist += Math.sqrt(dx * dx + dy * dy);
    const w = path[i].risk ?? TERRAIN_CLASSES[path[i].type]?.weight ?? 1;
    riskSum += w;
    if (w >= TERRAIN_CLASSES.high.weight) highRiskCells.add(`${path[i].gx},${path[i].gy}`);
  }
  obstaclesAvoided = highRiskCells.size;

  const distMeters  = totalDist * pixelToMeter;
  const avgRisk     = riskSum / path.length;
  // Safety score: 100 when all safe (weight=1), 0 when all high (weight=20)
  const safetyScore = Math.max(0, Math.min(100, Math.round(100 - ((avgRisk - 1) / 19) * 100)));
  const speedMps    = 3.5;
  const timeSec     = distMeters / speedMps;

  return {
    distance: distMeters.toFixed(1),
    time:     timeSec.toFixed(0),
    safety:   safetyScore,
    obstaclesAvoided,
  };
}