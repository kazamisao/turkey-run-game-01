// Bootstrap "OPERASI: BUKAN LAUK!": kanvas, input keyboard + mouse,
// loop game, dan mode ?shot= untuk screenshot deterministik.
import { createWorld, startGame, updateWorld } from './world.js';
import { render, VIEW_W, VIEW_H } from './render.js';
import { audio, updateEffects, spawnParticles, spawnFloatText } from './feedback.js';
import { stageShot } from './shots.js';
import { START_BUTTON, RESTART_BUTTON } from './screens.js';

const SCALE_W = 1280;
const SCALE_H = 800;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = SCALE_W;
canvas.height = SCALE_H;

const world = createWorld();
const keys = new Set();
let mouse = { x: 0, y: 0 };
let pendingThrow = null;
let shotMode = null;

function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

function readInput() {
  const mx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0)
    - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  const my = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0)
    - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
  return {
    mx, my,
    sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    jump: keys.has('Space'),
    hide: keys.has('KeyE'),
    throwAt: null,
  };
}

function pointInBox(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

window.addEventListener('keydown', (ev) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.code)) ev.preventDefault();
  if (ev.code === 'KeyM') { audio.toggleMute(); return; }
  if (ev.code === 'Enter') {
    if (world.screen === 'title') { audio.unlock(); audio.gobble(); startGame(world); }
    else if (world.screen === 'escaped' || world.screen === 'gameover') { audio.click(); startGame(world); }
    return;
  }
  keys.add(ev.code);
});
window.addEventListener('keyup', (ev) => keys.delete(ev.code));

canvas.addEventListener('mousemove', (ev) => { mouse = toLogical(ev.clientX, ev.clientY); });
canvas.addEventListener('click', (ev) => {
  audio.unlock();
  const p = toLogical(ev.clientX, ev.clientY);
  if (world.screen === 'title') {
    if (pointInBox(p, START_BUTTON)) { audio.gobble(); startGame(world); }
    return;
  }
  if (world.screen === 'escaped' || world.screen === 'gameover') {
    if (pointInBox(p, RESTART_BUTTON)) { audio.click(); startGame(world); }
    return;
  }
  if (world.screen === 'play' && world.turkey.bait > 0) {
    // Lempar umpan ke titik klik (world membaca throwAt sekali).
    pendingThrow = p;
    audio.click();
  }
});

let last = performance.now();

/** Petakan event gameplay (dari updateWorld) ke suara + efek visual. */
function playEvent(ev) {
  switch (ev.type) {
    case 'spotted': audio.alert(); break;
    case 'hurt':
      audio.hurt();
      spawnParticles(ev.x, ev.y, '#e63946', 12);
      spawnFloatText(ev.x, ev.y - 24, 'ADUH!', '#e63946');
      break;
    case 'caught':
      audio.caught();
      spawnParticles(ev.x, ev.y, '#e63946', 16);
      spawnFloatText(ev.x, ev.y - 24, 'TERTANGKAP!', '#e63946');
      break;
    case 'stageClear': audio.stageClear(); break;
    case 'success': audio.success(); break;
    case 'knife': audio.knife(); break;
    case 'oven': audio.oven(); break;
    case 'creak': audio.creak(); break;
    case 'corn':
      spawnParticles(ev.x, ev.y, '#ffd166', 10);
      spawnFloatText(ev.x, ev.y - 20, '+10', '#ffd166');
      break;
    case 'bait': audio.gobble(); break;
    default: break;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (world.screen === 'play') {
    const input = readInput();
    if (pendingThrow) { input.throwAt = pendingThrow; pendingThrow = null; }
    const events = updateWorld(world, input, dt);
    for (const ev of events) playEvent(ev);
    updateEffects(dt);
  }
  ctx.save();
  ctx.scale(SCALE_W / VIEW_W, SCALE_H / VIEW_H);
  render(ctx, world);
  ctx.restore();
  requestAnimationFrame(frame);
}

// Mode screenshot: ?shot=start|play|kitchen|end — adegan disiapkan sekali,
// lalu digambar statis (tanpa loop) supaya headless bisa memotret.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  shotMode = shot;
  stageShot(shot, world);
  ctx.save();
  ctx.scale(SCALE_W / VIEW_W, SCALE_H / VIEW_H);
  render(ctx, world);
  ctx.restore();
  document.title = `shot:${shot}`;
} else {
  requestAnimationFrame(frame);
}
