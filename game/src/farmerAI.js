// Petani: state machine PATROLI -> CURIGA -> MENGEJAR -> MENCARI,
// plus MENYELIDIKI saat umpan jagung dilempar ke dekatnya.
// Adil: ia hanya melihat kalkun di dalam kerucut pandang + garis pandang
// bersih, dan butuh 0,5 detik curiga sebelum mengejar.
import { pointInCone, segmentBlockedByRects, moveCircle, angleDiff } from './geometry.js';

export const VIEW_RANGE = 220;
export const VIEW_HALF = 0.6;
export const SUSPICIOUS_DELAY = 0.5;
export const LOSE_DELAY = 2.5;
export const SEARCH_TIME = 3;
export const INVESTIGATE_TIME = 2;
export const PATROL_SPEED = 70;
export const CHASE_SPEED = 190; // > jalan kalkun (170), < sprint (260): kejar bisa menutup jarak
export const SEARCH_SPEED = 110;
export const FARMER_RADIUS = 18;

export function createFarmer(x, y, waypoints) {
  return {
    x, y,
    r: FARMER_RADIUS,
    angle: 0,
    state: 'patrol',
    waypoints: waypoints.slice(),
    wpIndex: 0,
    susTimer: 0,
    loseTimer: 0,
    searchTimer: 0,
    searchTarget: null,
    investigateTarget: null,
    investigateTimer: 0,
    lastSeen: null,
  };
}

/** Benar bila kalkun terlihat: tidak sembunyi, di kerucut, garis pandang bersih. */
export function farmerSeesTurkey(f, turkey, walls) {
  if (turkey.hidden) return false;
  if (!pointInCone(turkey.x, turkey.y, f.x, f.y, f.angle, VIEW_RANGE, VIEW_HALF)) return false;
  return !segmentBlockedByRects(f.x, f.y, turkey.x, turkey.y, walls || []);
}

function faceToward(f, tx, ty, dt) {
  const want = Math.atan2(ty - f.y, tx - f.x);
  const d = angleDiff(want, f.angle);
  const step = Math.max(-6 * dt, Math.min(6 * dt, d));
  f.angle += step;
}

function moveToward(f, tx, ty, speed, dt, walls) {
  let dx = tx - f.x;
  let dy = ty - f.y;
  let d = Math.hypot(dx, dy);
  if (d < 4) return true;
  faceToward(f, tx, ty, dt);
  const step = Math.min(speed * dt, d);
  const moved = moveCircle(f, f.r, (dx / d) * step, (dy / d) * step, walls || []);
  f.x = moved.x;
  f.y = moved.y;
  dx = tx - f.x;
  dy = ty - f.y;
  return Math.hypot(dx, dy) < 4;
}

/**
 * Majukan petani satu langkah. `ctx`: {turkey, walls, bait, noise}.
 * Mengembalikan event: spotted / lost / investigating.
 */
export function updateFarmer(f, dt, ctx) {
  const events = [];
  const { turkey, walls } = ctx;

  // Umpan mengalihkan petani yang sedang tidak mengejar.
  if (ctx.bait && f.state !== 'chase') {
    f.state = 'investigate';
    f.investigateTarget = { x: ctx.bait.x, y: ctx.bait.y };
    f.investigateTimer = 0;
  }

  // Sprint berisik: petani menoleh curiga ke sumber suara.
  if (ctx.noise && f.state !== 'chase') {
    const d = Math.hypot(ctx.noise.x - f.x, ctx.noise.y - f.y);
    if (d < 170) {
      f.state = 'suspicious';
      f.susTimer = 0;
      f.lastSeen = { x: ctx.noise.x, y: ctx.noise.y };
    }
  }

  const sees = farmerSeesTurkey(f, turkey, walls);

  switch (f.state) {
    case 'patrol': {
      if (sees) {
        f.state = 'suspicious';
        f.susTimer = 0;
        f.lastSeen = { x: turkey.x, y: turkey.y };
        break;
      }
      const wp0 = f.waypoints[f.wpIndex % f.waypoints.length];
      if (Math.hypot(wp0.x - f.x, wp0.y - f.y) < 8) {
        f.wpIndex = (f.wpIndex + 1) % f.waypoints.length;
      }
      const wp = f.waypoints[f.wpIndex % f.waypoints.length];
      moveToward(f, wp.x, wp.y, PATROL_SPEED, dt, walls);
      break;
    }
    case 'suspicious': {
      if (sees) {
        f.lastSeen = { x: turkey.x, y: turkey.y };
        faceToward(f, turkey.x, turkey.y, dt);
        f.susTimer += dt;
        if (f.susTimer >= SUSPICIOUS_DELAY) {
          f.state = 'chase';
          f.loseTimer = 0;
          events.push({ type: 'spotted' });
        }
      } else {
        f.susTimer -= dt;
        if (f.lastSeen) faceToward(f, f.lastSeen.x, f.lastSeen.y, dt);
        if (f.susTimer <= -0.5) f.state = 'patrol';
      }
      break;
    }
    case 'chase': {
      if (sees) {
        f.loseTimer = 0;
        f.lastSeen = { x: turkey.x, y: turkey.y };
      } else {
        f.loseTimer += dt;
        if (f.loseTimer >= LOSE_DELAY) {
          f.state = 'search';
          f.searchTarget = f.lastSeen ? { ...f.lastSeen } : { x: f.x, y: f.y };
          f.searchTimer = 0;
          events.push({ type: 'lost' });
          break;
        }
      }
      moveToward(f, turkey.x, turkey.y, CHASE_SPEED, dt, walls);
      break;
    }
    case 'search': {
      if (sees) {
        f.state = 'suspicious';
        f.susTimer = 0;
        f.lastSeen = { x: turkey.x, y: turkey.y };
        break;
      }
      const arrived = moveToward(f, f.searchTarget.x, f.searchTarget.y, SEARCH_SPEED, dt, walls);
      if (arrived) {
        f.searchTimer += dt;
        f.angle += dt * 1.5;
        if (f.searchTimer >= SEARCH_TIME) f.state = 'patrol';
      }
      break;
    }
    case 'investigate': {
      if (sees) {
        f.state = 'suspicious';
        f.susTimer = 0;
        f.lastSeen = { x: turkey.x, y: turkey.y };
        break;
      }
      const arrived = moveToward(f, f.investigateTarget.x, f.investigateTarget.y, SEARCH_SPEED, dt, walls);
      if (arrived) {
        f.investigateTimer += dt;
        f.angle += dt * 1.2;
        if (f.investigateTimer >= INVESTIGATE_TIME) {
          f.state = 'patrol';
          f.investigateTarget = null;
          events.push({ type: 'done-investigating' });
        }
      }
      break;
    }
    default:
      f.state = 'patrol';
  }
  return events;
}
