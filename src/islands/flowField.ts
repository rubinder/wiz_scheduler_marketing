/**
 * Evenly spaced streamlines (after Jobard & Lefer): curves follow a smooth
 * angle field and stop before they touch another curve or enter a void.
 * Pure geometry, no DOM, so it can be unit-tested.
 */

export type Rng = () => number;

/** mulberry32: small seeded PRNG so a scene is reproducible from its seed. */
export function rngFrom(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded 2D value noise in [0, 1], smoothly interpolated. */
export function makeNoise(rng: Rng): (x: number, y: number) => number {
  const size = 256;
  const values = new Float32Array(size * size);
  for (let i = 0; i < values.length; i++) values[i] = rng();
  const at = (ix: number, iy: number) => values[((iy & 255) << 8) | (ix & 255)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * fx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * fx;
    return a + (b - a) * fy;
  };
}

export interface Curve {
  /** Interleaved x,y points along the curve. */
  pts: Float32Array;
  /** Index (in points, not floats) of the seed the curve grew from. */
  seed: number;
}

export interface TraceOptions {
  width: number;
  height: number;
  /** Minimum spacing between curves, and between a seed and any curve. */
  dSep: number;
  /** A growing curve stops when it comes this close to another curve. */
  dTest: number;
  step: number;
  maxSteps: number;
  randomSeeds: number;
}

export function traceStreamlines(
  angleAt: (x: number, y: number) => number,
  isVoid: (x: number, y: number) => boolean,
  rng: Rng,
  o: TraceOptions,
): Curve[] {
  const cell = o.dSep;
  const cols = Math.ceil(o.width / cell);
  const rows = Math.ceil(o.height / cell);
  const grid: number[][] = Array.from({ length: cols * rows }, () => []);

  const near = (x: number, y: number, d: number): boolean => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const d2 = d * d;
    for (let j = cy - 1; j <= cy + 1; j++) {
      if (j < 0 || j >= rows) continue;
      for (let i = cx - 1; i <= cx + 1; i++) {
        if (i < 0 || i >= cols) continue;
        const bucket = grid[j * cols + i];
        for (let k = 0; k < bucket.length; k += 2) {
          const dx = bucket[k] - x;
          const dy = bucket[k + 1] - y;
          if (dx * dx + dy * dy < d2) return true;
        }
      }
    }
    return false;
  };
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < o.width && y < o.height;

  const grow = (sx: number, sy: number, dir: 1 | -1): number[] => {
    const out: number[] = [];
    let x = sx;
    let y = sy;
    for (let s = 0; s < o.maxSteps; s++) {
      const a = angleAt(x, y);
      const nx = x + Math.cos(a) * o.step * dir;
      const ny = y + Math.sin(a) * o.step * dir;
      if (!inside(nx, ny) || isVoid(nx, ny) || near(nx, ny, o.dTest)) break;
      out.push(nx, ny);
      x = nx;
      y = ny;
    }
    return out;
  };

  const curves: Curve[] = [];
  const queue: Curve[] = [];

  const tryAt = (sx: number, sy: number): boolean => {
    if (!inside(sx, sy) || isVoid(sx, sy) || near(sx, sy, o.dSep)) return false;
    const fwd = grow(sx, sy, 1);
    const back = grow(sx, sy, -1);
    const n = (fwd.length + back.length) / 2 + 1;
    if (n < 6) return false;
    const pts = new Float32Array(n * 2);
    let w = 0;
    for (let i = back.length - 2; i >= 0; i -= 2) {
      pts[w++] = back[i];
      pts[w++] = back[i + 1];
    }
    const seed = w / 2;
    pts[w++] = sx;
    pts[w++] = sy;
    for (let i = 0; i < fwd.length; i++) pts[w++] = fwd[i];
    for (let i = 0; i < pts.length; i += 2) {
      const gx = Math.floor(pts[i] / cell);
      const gy = Math.floor(pts[i + 1] / cell);
      grid[gy * cols + gx].push(pts[i], pts[i + 1]);
    }
    const curve = { pts, seed };
    curves.push(curve);
    queue.push(curve);
    return true;
  };

  // Seed beside existing curves first (that is what keeps spacing even),
  // and fall back to a random point whenever the queue runs dry.
  let budget = o.randomSeeds;
  while (budget > 0) {
    const c = queue.shift();
    if (!c) {
      budget--;
      tryAt(rng() * o.width, rng() * o.height);
      continue;
    }
    const p = c.pts;
    for (let i = 0; i + 3 < p.length; i += 12) {
      const dx = p[i + 2] - p[i];
      const dy = p[i + 3] - p[i + 1];
      const len = Math.hypot(dx, dy) || 1;
      const px = (-dy / len) * o.dSep;
      const py = (dx / len) * o.dSep;
      tryAt(p[i] + px, p[i + 1] + py);
      tryAt(p[i] - px, p[i + 1] - py);
    }
  }
  return curves;
}
