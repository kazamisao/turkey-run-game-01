// Umpan balik pemain: HUD (skor / jarak ke kebebasan / nyawa / stamina),
// suara orisinal dari WebAudio (tanpa file eksternal), partikel & teks melayang.
import { freedomProgress } from './world.js';
import { mulberry32 } from './rng.js';

let audioCtx = null;
let muted = false;

function ctx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, vol, slideTo) {
  const ac = ctx();
  if (!ac || muted) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.15, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + dur);
}

function noiseBurst(dur, vol, lowpass) {
  const ac = ctx();
  if (!ac || muted) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass || 1200;
  const g = ac.createGain();
  g.gain.value = vol || 0.2;
  src.connect(f).connect(g).connect(ac.destination);
  src.start();
}

export const audio = {
  unlock() { ctx(); },
  toggleMute() { muted = !muted; return muted; },
  get muted() { return muted; },
  gobble() { tone(300, 0.09, 'square', 0.08, 520); setTimeout(() => tone(260, 0.09, 'square', 0.08, 430), 90); },
  click() { tone(700, 0.06, 'triangle', 0.12); },
  alert() { tone(880, 0.16, 'sawtooth', 0.12, 660); setTimeout(() => tone(880, 0.16, 'sawtooth', 0.12, 660), 170); },
  caught() { tone(220, 0.5, 'sawtooth', 0.16, 90); noiseBurst(0.25, 0.15, 600); },
  hurt() { tone(180, 0.25, 'square', 0.14, 120); },
  success() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 110)); },
  stageClear() { [392, 523, 659].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.12), i * 100)); },
  oven() { noiseBurst(0.5, 0.18, 900); },
  knife() { noiseBurst(0.18, 0.2, 3500); },
  creak() { tone(140, 0.4, 'sawtooth', 0.07, 90); },
};

// ---- partikel & teks melayang (kosmetik, seed tetap saat screenshot) ----
// RNG ber-seed (mulberry32) supaya pola partikel deterministik dari seed yang
// sama — bukan Math.random yang tak bisa diulang.
let effectsRng = mulberry32(20261127);
const particles = [];
const floats = [];

export function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i += 1) {
    const a = effectsRng() * Math.PI * 2;
    const s = 30 + effectsRng() * 90;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.6 + effectsRng() * 0.4, t: 0, color });
  }
}

export function spawnFloatText(x, y, text, color) {
  floats.push({ x, y, text, color: color || '#fff', t: 0 });
}

export function updateEffects(dt) {
  for (const p of particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
  for (let i = particles.length - 1; i >= 0; i -= 1) if (particles[i].t >= particles[i].life) particles.splice(i, 1);
  for (const f of floats) { f.t += dt; f.y -= 30 * dt; }
  for (let i = floats.length - 1; i >= 0; i -= 1) if (floats[i].t >= 1.2) floats.splice(i, 1);
}

export function drawEffects(c) {
  for (const p of particles) {
    c.globalAlpha = Math.max(0, 1 - p.t / p.life);
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, 3, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  for (const f of floats) {
    c.globalAlpha = Math.max(0, 1 - f.t / 1.2);
    c.fillStyle = f.color;
    c.font = 'bold 16px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText(f.text, f.x, f.y);
  }
  c.globalAlpha = 1;
}

// ---- HUD ----
export function drawHUD(c, w) {
  const W = 960;
  const H = 600;
  c.save();
  // Bilah atas.
  c.fillStyle = 'rgba(20, 12, 6, 0.72)';
  c.fillRect(0, 0, W, 52);
  c.fillStyle = '#ffd166';
  c.font = 'bold 20px system-ui, sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(`SKOR ${w.score}`, 14, 27);
  // Jarak ke Kebebasan.
  const prog = freedomProgress(w);
  c.fillStyle = '#fff3d6';
  c.font = 'bold 13px system-ui, sans-serif';
  c.fillText('JARAK KE KEBEBASAN', 300, 17);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(300, 26, 220, 10);
  c.fillStyle = prog > 0.66 ? '#7bc96f' : '#ffd166';
  c.fillRect(300, 26, 220 * prog, 10);
  c.fillStyle = '#fff3d6';
  c.font = '12px system-ui, sans-serif';
  c.fillText(`${w.stage.def.name}  •  Stage ${w.stageIndex + 1}/3`, 300, 46);
  // Nyawa (hati).
  for (let i = 0; i < 3; i += 1) {
    const x = 600 + i * 30;
    drawHeart(c, x, 26, i < w.lives ? '#e63946' : 'rgba(255,255,255,0.2)');
  }
  // Stamina + umpan.
  c.fillStyle = '#fff3d6';
  c.font = 'bold 13px system-ui, sans-serif';
  c.textAlign = 'right';
  c.fillText(`STAMINA`, 800, 17);
  c.fillStyle = 'rgba(255,255,255,0.25)';
  c.fillRect(700, 26, 100, 8);
  c.fillStyle = w.turkey.sprinting ? '#ff9f1c' : '#7bc96f';
  c.fillRect(700, 26, 100 * (w.turkey.stamina / 100), 8);
  c.fillStyle = '#ffd166';
  c.font = 'bold 15px system-ui, sans-serif';
  c.fillText(`🌽 × ${w.turkey.bait}`, 940, 27);
  c.textAlign = 'left';
  // Pesan mengambang.
  c.font = 'bold 15px system-ui, sans-serif';
  c.textAlign = 'center';
  w.messages.forEach((m, i) => {
    c.globalAlpha = Math.max(0, 1 - m.t / 3);
    c.fillStyle = '#ffe66d';
    c.fillText(m.text, W / 2, 70 + i * 22);
  });
  c.globalAlpha = 1;
  // Petunjuk kontrol.
  c.fillStyle = 'rgba(20,12,6,0.55)';
  c.fillRect(0, H - 26, W, 26);
  c.fillStyle = '#fff3d6';
  c.font = '12px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('WASD gerak  •  SPACE lompat  •  SHIFT sprint (berisik!)  •  E sembunyi  •  KLIK lempar umpan  •  M bisu', W / 2, H - 13);
  c.restore();
}

function drawHeart(c, x, y, color) {
  c.save();
  c.translate(x, y);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, 7);
  c.bezierCurveTo(-11, -3, -6, -11, 0, -5);
  c.bezierCurveTo(6, -11, 11, -3, 0, 7);
  c.fill();
  c.restore();
}
