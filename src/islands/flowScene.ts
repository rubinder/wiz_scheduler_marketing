/**
 * "Monday morning, then Wiz": a manager in despair inside a turbulent field,
 * a wizard hat drops, a calm field spreads from it, a schedule fills in and
 * everyone cheers. Black ink on warm paper, everything inside one canvas.
 */
import { makeNoise, rngFrom, traceStreamlines, type Curve, type Rng } from "./flowField";

const W = 1200;
const H = 640;
const PAPER = "#F5F2EA";
const INK = "#1A1815";

type Pose = "despair" | "agitated" | "cheer";
type Mood = "despair" | "agitated" | "happy";
interface Fig {
  x: number;
  y: number;
  s: number;
  dir: number;
}

const MANAGER: Fig = { x: 600, y: 590, s: 1.6, dir: 1 };
const PEOPLE: Fig[] = [
  { x: 150, y: 615, s: 1.2, dir: 1 },
  { x: 295, y: 545, s: 1.2, dir: 1 },
  { x: 435, y: 625, s: 1.2, dir: 1 },
  { x: 765, y: 625, s: 1.2, dir: -1 },
  { x: 905, y: 545, s: 1.2, dir: -1 },
  { x: 1050, y: 615, s: 1.2, dir: -1 },
];
const head = (f: Fig) => ({ x: f.x, y: f.y - 120 * f.s, r: 15 * f.s });

// The hat sits on the manager's head; HAT_Y is the brim's resting line.
const HAT_Y = head(MANAGER).y - head(MANAGER).r + 4;
const CARD = { x: 380, y: 30, w: 440, h: 196 };
const SHIFTS = [
  [1, 1, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1],
];

function figure(ctx: CanvasRenderingContext2D, f: Fig, pose: Pose) {
  const { x, y, s, dir } = f;
  const seg = (lw: number, ...p: number[]) => {
    ctx.lineWidth = lw * s;
    ctx.beginPath();
    ctx.moveTo(x + p[0] * s, y + p[1] * s);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(x + p[i] * s, y + p[i + 1] * s);
    ctx.stroke();
  };
  seg(16, 0, -100, 0, -52);
  seg(11, 0, -52, -15, -2);
  seg(11, 0, -52, 15, -2);
  for (const d of [-1, 1]) {
    if (pose === "despair") seg(9, 0, -96, d * 36, -126, d * 9, -141);
    else if (pose === "cheer") seg(9, 0, -96, d * 22, -126, d * 36, -160);
    else if (d === dir) seg(9, 0, -96, d * 30, -118, d * 54, -138);
    else seg(9, 0, -96, d * 22, -76, d * 10, -58);
  }
  const h = head(f);
  ctx.beginPath();
  ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
  ctx.fill();
}

function face(ctx: CanvasRenderingContext2D, f: Fig, mood: Mood) {
  const { x, y, r } = head(f);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = Math.max(1.4, r * 0.09);
  ctx.lineCap = "round";
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1 * r, y1 * r);
    ctx.lineTo(x2 * r, y2 * r);
    ctx.stroke();
  };
  if (mood === "happy") {
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(d * 0.36 * r, 0.02 * r, 0.17 * r, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0.12 * r, 0.46 * r, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  } else {
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(d * 0.34 * r, 0.02 * r, 0.07 * r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (mood === "despair") {
      line(-0.52, -0.24, -0.18, -0.36);
      line(0.52, -0.24, 0.18, -0.36);
      ctx.beginPath();
      ctx.arc(0, 0.78 * r, 0.34 * r, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0.46 * r, 0.14 * r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function hatPath(ctx: CanvasRenderingContext2D, cx: number, by: number) {
  ctx.beginPath();
  ctx.moveTo(cx - 36, by - 2);
  ctx.quadraticCurveTo(cx - 18, by - 70, cx + 26, by - 118);
  ctx.quadraticCurveTo(cx + 14, by - 70, cx + 36, by - 2);
  ctx.closePath();
  ctx.moveTo(cx + 58, by);
  ctx.ellipse(cx, by, 58, 10, 0, 0, Math.PI * 2);
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** The hat as ink hatching: fan lines up the cone, level lines on the brim. */
function drawHat(ctx: CanvasRenderingContext2D, cx: number, by: number, squash: number) {
  ctx.save();
  ctx.translate(cx, by);
  ctx.scale(1 + squash * 0.12, 1 - squash * 0.12);
  ctx.translate(-cx, -by);
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 12;
  hatPath(ctx, cx, by);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  hatPath(ctx, cx, by);
  ctx.clip();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = -9; i <= 9; i++) {
    ctx.moveTo(cx + i * 4.2, by - 2);
    ctx.quadraticCurveTo(cx + i * 3.4 - 6, by - 72, cx + 26, by - 118);
  }
  for (let j = -8; j <= 8; j += 4.5) {
    ctx.moveTo(cx - 60, by + j);
    ctx.lineTo(cx + 60, by + j);
  }
  ctx.stroke();
  ctx.fillStyle = PAPER;
  starPath(ctx, cx - 2, by - 44, 13);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 14, by - 78, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawSchedule(ctx: CanvasRenderingContext2D, filled: number) {
  const { x, y, w, h } = CARD;
  const head = 30;
  const cw = w / 7;
  const rh = (h - head) / 3;
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  for (let c = 1; c < 7; c++) {
    ctx.moveTo(x + c * cw, y);
    ctx.lineTo(x + c * cw, y + h);
  }
  for (let r = 0; r < 3; r++) {
    ctx.moveTo(x, y + head + r * rh);
    ctx.lineTo(x + w, y + head + r * rh);
  }
  for (let c = 0; c < 7; c++) {
    ctx.moveTo(x + c * cw + cw * 0.3, y + head / 2);
    ctx.lineTo(x + c * cw + cw * 0.7, y + head / 2);
  }
  ctx.stroke();
  // Assigned cells hatch in one by one, day by day.
  let n = 0;
  ctx.lineWidth = 1.1;
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 3; r++) {
      if (!SHIFTS[r][c]) continue;
      const k = Math.min(1, Math.max(0, filled - n));
      n++;
      if (k <= 0) continue;
      const cx = x + c * cw + 8;
      const cy = y + head + r * rh + 10;
      ctx.beginPath();
      const lines = Math.floor((rh - 18) / 5);
      for (let l = 0; l < lines; l++) {
        const len = (cw - 16) * (l % 3 === 2 ? 0.55 : 1) * k;
        ctx.moveTo(cx, cy + l * 5);
        ctx.lineTo(cx + len, cy + l * 5);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}
const SHIFT_COUNT = SHIFTS.flat().filter(Boolean).length;

interface Plate {
  curves: Curve[];
  dist: Float32Array;
  faces: { fig: Fig; mood: Mood; dist: number }[];
  origin: { x: number; y: number };
}

function buildPlate(kind: "chaos" | "calm", rng: Rng, dSep: number): Plate | null {
  const mw = W / 2;
  const mh = H / 2;
  const mask = makeCanvas(mw, mh);
  const mctx = mask?.getContext("2d");
  if (!mask || !mctx) return null;
  mctx.scale(0.5, 0.5);
  mctx.strokeStyle = "#000";
  mctx.fillStyle = "#000";
  mctx.lineCap = "round";
  mctx.lineJoin = "round";
  if (kind === "chaos") {
    figure(mctx, MANAGER, "despair");
    PEOPLE.forEach((p) => figure(mctx, p, "agitated"));
    mctx.font = "bold 58px Georgia, serif";
    mctx.textAlign = "center";
    const marks = ["!", "?", "", "", "?!", "!"];
    PEOPLE.forEach((p, i) => marks[i] && mctx.fillText(marks[i], p.x + p.dir * 30, p.y - 196 * p.s));
    // A storm scribble over the manager's head.
    mctx.lineWidth = 7;
    mctx.beginPath();
    for (let i = 0; i <= 10; i++) mctx.lineTo(530 + i * 14, 300 + (i % 2 ? -16 : 12));
    mctx.stroke();
  } else {
    figure(mctx, MANAGER, "cheer");
    PEOPLE.forEach((p) => figure(mctx, p, "cheer"));
    mctx.lineWidth = 16;
    hatPath(mctx, MANAGER.x, HAT_Y);
    mctx.fill();
    mctx.stroke();
    mctx.fillRect(CARD.x - 8, CARD.y - 8, CARD.w + 16, CARD.h + 16);
  }
  const alpha = mctx.getImageData(0, 0, mw, mh).data;
  const solid = new Float32Array(mw * mh);
  for (let i = 0; i < solid.length; i++) solid[i] = alpha[i * 4 + 3] > 127 ? 1 : 0;
  const soft = blur(blur(solid, mw, mh, 7), mw, mh, 7);

  const noise = makeNoise(rng);
  const vortex = { x: MANAGER.x, y: 400 };
  const base = (x: number, y: number): number => {
    if (kind === "calm") return (noise(x * 0.0032, y * 0.0032) - 0.5) * 1.6 + Math.sin(x * 0.006) * 0.25;
    const n = noise(x * 0.008, y * 0.008) * 0.75 + noise(x * 0.022, y * 0.022) * 0.25;
    const a = n * Math.PI * 3.2;
    const dx = x - vortex.x;
    const dy = y - vortex.y;
    const wv = Math.exp(-Math.hypot(dx, dy) / 260);
    const t = Math.atan2(dy, dx) + Math.PI / 2 + 0.35;
    return Math.atan2(Math.sin(a) * (1 - wv) + Math.sin(t) * wv, Math.cos(a) * (1 - wv) + Math.cos(t) * wv);
  };

  // Precompute the field on a 4px grid; near a figure, bend it along the outline.
  const gs = 4;
  const gw = W / gs + 1;
  const gh = H / gs + 1;
  const fc = new Float32Array(gw * gh);
  const fs = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const x = i * gs;
      const y = j * gs;
      const a = base(x, y);
      let vx = Math.cos(a);
      let vy = Math.sin(a);
      const mx = Math.min(mw - 2, Math.max(1, x >> 1));
      const my = Math.min(mh - 2, Math.max(1, y >> 1));
      const b = soft[my * mw + mx];
      if (b > 0.01) {
        const gx = soft[my * mw + mx + 1] - soft[my * mw + mx - 1];
        const gy = soft[(my + 1) * mw + mx] - soft[(my - 1) * mw + mx];
        const g = Math.hypot(gx, gy);
        if (g > 1e-5) {
          const w = Math.min(1, b * 3.2);
          let tx = -gy / g;
          let ty = gx / g;
          if (tx * vx + ty * vy < 0) {
            tx = -tx;
            ty = -ty;
          }
          vx = vx * (1 - w) + tx * w;
          vy = vy * (1 - w) + ty * w;
        }
      }
      fc[j * gw + i] = vx;
      fs[j * gw + i] = vy;
    }
  }
  const angleAt = (x: number, y: number) => {
    const gx = x / gs;
    const gy = y / gs;
    const i = Math.min(gw - 2, gx | 0);
    const j = Math.min(gh - 2, gy | 0);
    const u = gx - i;
    const v = gy - j;
    const k = j * gw + i;
    const lerp2 = (f: Float32Array) =>
      (f[k] * (1 - u) + f[k + 1] * u) * (1 - v) + (f[k + gw] * (1 - u) + f[k + gw + 1] * u) * v;
    return Math.atan2(lerp2(fs), lerp2(fc));
  };
  const isVoid = (x: number, y: number) => solid[(y >> 1) * mw + (x >> 1)] > 0;

  const curves = traceStreamlines(angleAt, isVoid, rng, {
    width: W,
    height: H,
    dSep,
    dTest: dSep * 0.42,
    step: 1.6,
    maxSteps: 260,
    randomSeeds: 400,
  });
  const origin = kind === "chaos" ? { x: MANAGER.x, y: 420 } : { x: MANAGER.x, y: HAT_Y - 40 };
  const d = (x: number, y: number) => Math.hypot(x - origin.x, y - origin.y);
  const dist = new Float32Array(curves.length);
  curves.forEach((c, i) => (dist[i] = d(c.pts[c.seed * 2], c.pts[c.seed * 2 + 1])));
  const mood: Mood = kind === "chaos" ? "agitated" : "happy";
  const faces = [
    { fig: MANAGER, mood: kind === "chaos" ? ("despair" as Mood) : "happy", dist: d(MANAGER.x, head(MANAGER).y) },
    ...PEOPLE.map((p) => ({ fig: p, mood, dist: d(p.x, head(p).y) })),
  ];
  return { curves, dist, faces, origin };
}

function blur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const span = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / span;
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / span;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c.getContext("2d") ? c : null;
}

/** One plate drawn progressively: each curve grows out from its seed once the reveal front reaches it. */
class Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lo: Int32Array;
  hi: Int32Array;
  facesDone: boolean[];
  constructor(
    public plate: Plate,
    pw: number,
    ph: number,
    private k: number,
  ) {
    this.canvas = makeCanvas(pw, ph)!;
    this.ctx = this.canvas.getContext("2d")!;
    this.lo = new Int32Array(plate.curves.length);
    this.hi = new Int32Array(plate.curves.length);
    this.facesDone = plate.faces.map(() => false);
    this.reset();
  }
  reset() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    this.plate.curves.forEach((c, i) => {
      this.lo[i] = c.seed;
      this.hi[i] = c.seed;
    });
    this.facesDone.fill(false);
  }
  /** Front radius `r` in scene units; curves take `grow` seconds to draw fully. */
  advance(front: number, speed: number, grow: number) {
    const { ctx, plate } = this;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.05;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    plate.curves.forEach((c, i) => {
      const since = (front - plate.dist[i]) / speed;
      if (since <= 0) return;
      const n = c.pts.length / 2;
      const p = Math.min(1, since / grow);
      const lo = Math.max(0, Math.round(c.seed - c.seed * p));
      const hi = Math.min(n - 1, Math.round(c.seed + (n - 1 - c.seed) * p));
      const pts = c.pts;
      if (lo < this.lo[i]) {
        ctx.moveTo(pts[this.lo[i] * 2], pts[this.lo[i] * 2 + 1]);
        for (let j = this.lo[i] - 1; j >= lo; j--) ctx.lineTo(pts[j * 2], pts[j * 2 + 1]);
        this.lo[i] = lo;
      }
      if (hi > this.hi[i]) {
        ctx.moveTo(pts[this.hi[i] * 2], pts[this.hi[i] * 2 + 1]);
        for (let j = this.hi[i] + 1; j <= hi; j++) ctx.lineTo(pts[j * 2], pts[j * 2 + 1]);
        this.hi[i] = hi;
      }
    });
    ctx.stroke();
    plate.faces.forEach((f, i) => {
      if (!this.facesDone[i] && front > f.dist + 20) {
        face(ctx, f.fig, f.mood);
        this.facesDone[i] = true;
      }
    });
  }
}

// Timeline, in seconds.
const T = {
  chaosIn: 4.2,
  chaosHold: 2.6,
  drop: 1.1,
  settle: 0.5,
  calmIn: 3.6,
  calmHold: 5.5,
  fade: 1.2,
};
const REACH = 820;
const GROW = 1.1;

export interface SceneHandle {
  stop: () => void;
  setRunning: (on: boolean) => void;
}

export function startScene(
  canvas: HTMLCanvasElement,
  opts: { seed: number; still: boolean },
): SceneHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cssW = canvas.clientWidth || W;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round((cssW * dpr * H) / W);
  const k = canvas.width / W;
  // Keep curves at least ~3.5 CSS px apart on small screens.
  const dSep = Math.max(5.5, (3.5 * W) / cssW);
  const rng = rngFrom(opts.seed);
  const chaosPlate = buildPlate("chaos", rng, dSep);
  const calmPlate = buildPlate("calm", rng, dSep);
  if (!chaosPlate || !calmPlate) return null;
  const chaos = new Layer(chaosPlate, canvas.width, canvas.height, k);
  const calm = new Layer(calmPlate, canvas.width, canvas.height, k);

  const paint = (draw: () => void) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    draw();
  };
  const blit = (l: Layer) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(l.canvas, 0, 0);
    ctx.restore();
  };

  if (opts.still) {
    calm.advance(1e6, 1, GROW);
    paint(() => {
      blit(calm);
      drawHat(ctx, MANAGER.x, HAT_Y, 0);
      drawSchedule(ctx, SHIFT_COUNT);
    });
    return { stop: () => {}, setRunning: () => {} };
  }

  const speed = REACH / T.chaosIn;
  const t1 = T.chaosIn + T.chaosHold;
  const t2 = t1 + T.drop;
  const t3 = t2 + T.settle;
  const t4 = t3 + T.calmIn;
  const t5 = t4 + T.calmHold;
  const t6 = t5 + T.fade;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let cycleStarted = false;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    clock += dt;
    if (clock >= t6 || !cycleStarted) {
      clock = clock >= t6 ? 0 : clock;
      chaos.reset();
      calm.reset();
      cycleStarted = true;
    }
    const t = clock;
    if (t < t2 + T.settle) chaos.advance(t * speed, speed, GROW);
    if (t >= t3) calm.advance((t - t3) * speed, speed, GROW);

    paint(() => {
      blit(chaos);
      if (t >= t3) {
        const r = (t - t3) * speed;
        ctx.fillStyle = PAPER;
        ctx.beginPath();
        ctx.arc(calmPlate.origin.x, calmPlate.origin.y, r, 0, Math.PI * 2);
        ctx.fill();
        blit(calm);
      }
      if (t >= t1) {
        const p = Math.min(1, (t - t1) / T.drop);
        const by = -20 + (HAT_Y + 20) * p * p;
        const squash = t > t2 ? Math.sin(Math.min(1, (t - t2) / T.settle) * Math.PI) : 0;
        if (t > t2 && t < t3 + 0.4) sparkle(ctx, (t - t2) / (T.settle + 0.4));
        drawHat(ctx, MANAGER.x, by, squash);
      }
      if (t >= t3 + 0.8) drawSchedule(ctx, Math.min(SHIFT_COUNT, ((t - t3 - 0.8) / 2.6) * SHIFT_COUNT));
      if (t >= t5) {
        ctx.globalAlpha = Math.min(1, (t - t5) / T.fade);
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    });
  };

  const setRunning = (on: boolean) => {
    if (on === running) return;
    running = on;
    if (on) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else cancelAnimationFrame(raf);
  };
  return { stop: () => setRunning(false), setRunning };
}

/** Short ink rays bursting from the brim when the hat lands. */
function sparkle(ctx: CanvasRenderingContext2D, p: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 1 - p;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = Math.PI + (i / 13) * Math.PI;
    const r0 = 70 + p * 40;
    const r1 = r0 + 18;
    ctx.moveTo(MANAGER.x + Math.cos(a) * r0, HAT_Y - 30 + Math.sin(a) * r0 * 0.8);
    ctx.lineTo(MANAGER.x + Math.cos(a) * r1, HAT_Y - 30 + Math.sin(a) * r1 * 0.8);
  }
  ctx.stroke();
  ctx.restore();
}
