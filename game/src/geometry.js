// Geometri murni: kerucut pandang, garis pandang vs dinding, tabrakan lingkaran.
// Tidak menyentuh DOM — bisa diuji langsung di Node.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Apakah titik (px,py) ada di dalam kerucut pandang dari (ox,oy). */
export function pointInCone(px, py, ox, oy, angle, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  return Math.abs(angleDiff(Math.atan2(dy, dx), angle)) <= halfAngle;
}

/** Uji slab: apakah segmen (x1,y1)-(x2,y2) memotong rect {x,y,w,h}. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  const slabs = [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ];
  for (const [p, d, lo, hi] of slabs) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return false;
    }
  }
  return true;
}

/** Apakah ada dinding yang memblokir garis pandang (x1,y1)-(x2,y2). */
export function segmentBlockedByRects(x1, y1, x2, y2, rects) {
  for (const rect of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return true;
  }
  return false;
}

/** Apakah lingkaran (cx,cy,r) menyentuh rect. */
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function circleHitsAny(cx, cy, r, solids) {
  for (const s of solids) {
    if (circleHitsRect(cx, cy, r, s)) return true;
  }
  return false;
}

/**
 * Geser lingkaran sejauh (dx,dy) dengan sub-langkah kecil supaya tidak
 * menembus dinding tipis; sumbu dipisah sehingga lingkaran meluncur
 * di sepanjang dinding, bukan menempel.
 */
export function moveCircle(pos, r, dx, dy, solids) {
  const out = { x: pos.x, y: pos.y };
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i += 1) {
    const nx = out.x + sx;
    if (!circleHitsAny(nx, out.y, r, solids)) out.x = nx;
    const ny = out.y + sy;
    if (!circleHitsAny(out.x, ny, r, solids)) out.y = ny;
  }
  return out;
}
