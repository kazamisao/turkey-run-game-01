// Kalkun pemain: jalan, sprint (stamina + berisik), lompat pagar rendah,
// sembunyi di titik sembunyi, lempar umpan jagung.
import { moveCircle, circleHitsRect } from './geometry.js';

export const WALK_SPEED = 170;
export const SPRINT_SPEED = 260;
export const SPRINT_DRAIN = 40;
export const STAMINA_REGEN = 20;
export const JUMP_TIME = 0.45;
export const JUMP_COOLDOWN = 0.8;
export const BAIT_RANGE = 260;
export const TURKEY_RADIUS = 16;

export function createTurkey(x, y) {
  return {
    x, y,
    r: TURKEY_RADIUS,
    angle: 0,
    stamina: 100,
    jumping: 0,
    jumpCooldown: 0,
    hidden: false,
    bait: 3,
    moving: false,
    sprinting: false,
  };
}

function insideHide(x, y, hides) {
  for (const h of hides) {
    const dx = x - h.x;
    const dy = y - h.y;
    if (dx * dx + dy * dy <= h.r * h.r) return true;
  }
  return false;
}

/**
 * Majukan kalkun satu langkah. `stage` membawa bounds, walls, lowFences, hides.
 * Mengembalikan event: [{type:'bait',x,y}] saat umpan dilempar.
 */
export function updateTurkey(t, input, dt, stage) {
  const events = [];
  if (t.jumpCooldown > 0) t.jumpCooldown -= dt;

  const hiding = input.hide && insideHide(t.x, t.y, stage.hides || []);
  t.hidden = hiding;

  const airborne = t.jumping > 0;
  if (t.jumping > 0) t.jumping = Math.max(0, t.jumping - dt);

  const len = Math.hypot(input.mx, input.my);
  const moving = len > 0.01 && !hiding;
  t.moving = moving;
  t.sprinting = false;

  if (moving) {
    const wantSprint = input.sprint && t.stamina > 1;
    const speed = wantSprint ? SPRINT_SPEED : WALK_SPEED;
    t.sprinting = wantSprint;
    if (wantSprint) {
      t.stamina = Math.max(0, t.stamina - SPRINT_DRAIN * dt);
    }
    const nx = input.mx / len;
    const ny = input.my / len;
    t.angle = Math.atan2(ny, nx);
    const solids = [...(stage.walls || [])];
    if (!airborne) solids.push(...(stage.lowFences || []));
    const moved = moveCircle(t, t.r, nx * speed * dt * (airborne ? 1.25 : 1), ny * speed * dt * (airborne ? 1.25 : 1), solids);
    t.x = moved.x;
    t.y = moved.y;
  } else if (!input.sprint) {
    // Diam (tidak bergerak, tidak menahan sprint): pulih 20/dtk — SATU-SATUNYA
    // jalur regen. Jalan kaki tanpa sprint sengaja tidak regen (dikunci uji I3).
    t.stamina = Math.min(100, t.stamina + STAMINA_REGEN * dt);
  }

  const b = stage.bounds || { x: 0, y: 0, w: 960, h: 600 };
  t.x = Math.max(b.x + t.r, Math.min(b.x + b.w - t.r, t.x));
  t.y = Math.max(b.y + t.r, Math.min(b.y + b.h - t.r, t.y));

  if (input.jump && t.jumpCooldown <= 0 && t.jumping <= 0) {
    t.jumping = JUMP_TIME;
    t.jumpCooldown = JUMP_COOLDOWN;
  }

  if (input.throwAt && t.bait > 0) {
    const dx = input.throwAt.x - t.x;
    const dy = input.throwAt.y - t.y;
    const d = Math.hypot(dx, dy);
    const cl = d > BAIT_RANGE ? BAIT_RANGE / d : 1;
    t.bait -= 1;
    events.push({ type: 'bait', x: t.x + dx * cl, y: t.y + dy * cl });
  }
  return events;
}
