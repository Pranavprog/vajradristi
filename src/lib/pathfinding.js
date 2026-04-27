/**
 * VAJRADRISTI — Path Planning Engine
 * A* algorithm with risk-weighted navigation grid
 */

export const TERRAIN_CLASSES = {
  safe:     { weight: 1,   color: [45, 122, 58],   label: 'Safe Terrain'  },
  moderate: { weight: 5,   color: [234, 179, 8],   label: 'Moderate Risk' },
  high:     { weight: 10,  color: [220, 38, 38],   label: 'High Risk'     },
  obstacle: { weight: 100, color: [30, 30, 30],    label: 'Obstacle'      },
};

// Build a risk grid from the heatmap canvas data
export function buildRiskGrid(imageData, gridW, gridH, imgW, imgH) {
  const grid = [];
  const cellW = imgW / gridW;
  const cellH = imgH / gridH;

  for (let gy = 0; gy < gridH; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      // sample center pixel of each cell
      const px = Math.min(Math.floor((gx + 0.5) * cellW), imgW - 1);
      const py = Math.min(Math.floor((gy + 0.5) * cellH), imgH - 1);
      const idx = (py * imgW + px) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];

      // Classify by dominant channel
      let risk, type;
      if (r > 150 && g < 100) {
        risk = TERRAIN_CLASSES.high.weight; type = 'high';
      } else if (r > 150 && g > 100 && b < 100) {
        risk = TERRAIN_CLASSES.moderate.weight; type = 'moderate';
      } else if (g > 100 && r < 150) {
        risk = TERRAIN_CLASSES.safe.weight; type = 'safe';
      } else if (r < 40 && g < 40 && b < 40) {
        risk = TERRAIN_CLASSES.obstacle.weight; type = 'obstacle';
      } else {
        // default: moderate
        const intensity = (r + g + b) / 3;
        risk = intensity > 128 ? TERRAIN_CLASSES.moderate.weight : TERRAIN_CLASSES.safe.weight;
        type = intensity > 128 ? 'moderate' : 'safe';
      }

      grid[gy][gx] = { gx, gy, risk, type, f: 0, g: 0, h: 0, parent: null };
    }
  }
  return grid;
}

// Build a uniform demo grid with risk blobs (fallback when no image)
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
          if (blob.type === 'obstacle' && dist < blob.r * 0.4) {
            risk = TERRAIN_CLASSES.obstacle.weight; type = 'obstacle'; break;
          } else if (blob.type === 'high') {
            risk = TERRAIN_CLASSES.high.weight; type = 'high';
          } else if (blob.type === 'moderate' && type === 'safe') {
            risk = TERRAIN_CLASSES.moderate.weight; type = 'moderate';
          }
        }
      }
      grid[gy][gx] = { gx, gy, risk, type, f: 0, g: 0, h: 0, parent: null };
    }
  }
  return grid;
}

/**
 * Build a risk grid directly from the actual terrain image pixels.
 * Uses the same intensity-threshold approach as the segmentation pipeline:
 *   intensity = (R+G+B)/3
 *   < 60   → obstacle (very dark rocks)
 *   < 110  → high risk (vegetation/trees)
 *   < 170  → moderate risk (navigable but rough)
 *   ≥ 170  → safe (open ground / sky)
 *
 * Returns a promise that resolves to the grid.
 */
export function buildGridFromImage(imageSrc, gridW, gridH) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tmp = document.createElement('canvas');
      tmp.width  = gridW;
      tmp.height = gridH;
      const tc = tmp.getContext('2d');
      tc.drawImage(img, 0, 0, gridW, gridH);
      const { data } = tc.getImageData(0, 0, gridW, gridH);

      const grid = [];
      for (let gy = 0; gy < gridH; gy++) {
        grid[gy] = [];
        for (let gx = 0; gx < gridW; gx++) {
          const i = (gy * gridW + gx) * 4;
          const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;

          let risk, type;
          if (intensity < 60) {
            risk = TERRAIN_CLASSES.obstacle.weight; type = 'obstacle';
          } else if (intensity < 110) {
            risk = TERRAIN_CLASSES.high.weight;     type = 'high';
          } else if (intensity < 170) {
            risk = TERRAIN_CLASSES.moderate.weight; type = 'moderate';
          } else {
            risk = TERRAIN_CLASSES.safe.weight;     type = 'safe';
          }

          grid[gy][gx] = { gx, gy, risk, type, f: 0, g: 0, h: 0, parent: null };
        }
      }
      resolve(grid);
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

function heuristic(a, b) {
  return Math.sqrt((a.gx - b.gx) ** 2 + (a.gy - b.gy) ** 2);
}

function getNeighbors(grid, node, gridW, gridH) {
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];
  return dirs
    .map(([dx, dy]) => {
      const nx = node.gx + dx;
      const ny = node.gy + dy;
      if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) return null;
      return grid[ny][nx];
    })
    .filter(Boolean);
}

export function astar(grid, start, end, gridW, gridH) {
  // Reset grid state
  for (let y = 0; y < gridH; y++)
    for (let x = 0; x < gridW; x++)
      Object.assign(grid[y][x], { f: 0, g: 0, h: 0, parent: null });

  const startNode = grid[start.gy][start.gx];
  const endNode   = grid[end.gy][end.gx];

  const open   = new Set([startNode]);
  const closed = new Set();

  startNode.g = 0;
  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.h;

  let iterations = 0;
  const MAX_ITER = gridW * gridH * 4;

  while (open.size > 0 && iterations++ < MAX_ITER) {
    // Get node with lowest f
    let current = null;
    for (const n of open) {
      if (!current || n.f < current.f) current = n;
    }

    if (current === endNode) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node) { path.unshift({ gx: node.gx, gy: node.gy, type: node.type }); node = node.parent; }
      return path;
    }

    open.delete(current);
    closed.add(current);

    for (const neighbor of getNeighbors(grid, current, gridW, gridH)) {
      if (closed.has(neighbor)) continue;

      const diagonal = neighbor.gx !== current.gx && neighbor.gy !== current.gy;
      const moveCost = diagonal ? 1.414 : 1;
      const tentativeG = current.g + moveCost * neighbor.risk;

      if (!open.has(neighbor) || tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        open.add(neighbor);
      }
    }
  }
  return null; // No path found
}

export function computePathMetrics(path, gridW, gridH, canvasW, canvasH) {
  if (!path || path.length < 2) return { distance: 0, time: 0, safety: 100 };

  const cellW = canvasW / gridW;
  const cellH = canvasH / gridH;
  const scale = Math.sqrt(cellW * cellH); // pixels per cell → meters (assume 1px ≈ 0.1m)
  const pixelToMeter = 0.1;

  let totalDist = 0;
  let riskSum = 0;

  for (let i = 1; i < path.length; i++) {
    const dx = (path[i].gx - path[i - 1].gx) * cellW;
    const dy = (path[i].gy - path[i - 1].gy) * cellH;
    totalDist += Math.sqrt(dx * dx + dy * dy);

    const w = TERRAIN_CLASSES[path[i].type]?.weight ?? 1;
    riskSum += w;
  }

  const distMeters  = totalDist * pixelToMeter;
  const avgRisk     = riskSum / path.length;
  const safetyScore = Math.max(0, Math.round(100 - (avgRisk - 1) / 9 * 60));
  const speedMps    = 3.5; // m/s walking speed
  const timeSec     = distMeters / speedMps;

  return {
    distance: distMeters.toFixed(1),
    time:     timeSec.toFixed(0),
    safety:   safetyScore,
  };
}