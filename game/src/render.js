// Semua gambar kanvas "OPERASI: BUKAN LAUK!" — art Thanksgiving orisinal,
// palet musim gugur koheren, adegan terbaca sekilas di contact sheet kecil.
import { drawHUD, drawEffects } from './feedback.js';
import { drawTitleScreen, drawEscapedScreen, drawGameOverScreen } from './screens.js';

export const VIEW_W = 960;
export const VIEW_H = 600;

const FLOORS = [
  { base: '#5d7d33', alt: '#587630', label: 'HALAMAN' },
  { base: '#8a6a42', alt: '#84643d', label: 'GUDANG' },
  { base: '#cfc3a8', alt: '#c9bda2', label: 'DAPUR' },
];

/** Kalkun tampak atas: kipas ekor, badan, kepala + pial merah. */
export function drawTurkeyShape(c, x, y, scale, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle || 0);
  c.scale(scale || 1, scale || 1);
  // Kipas ekor.
  c.fillStyle = '#8b5a2b';
  for (let i = -2; i <= 2; i += 1) {
    c.save();
    c.rotate(i * 0.35);
    c.beginPath();
    c.ellipse(-14, 0, 12, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.fillStyle = '#a06a35';
  c.beginPath();
  c.ellipse(-10, 0, 10, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  // Badan.
  c.fillStyle = '#7a4a21';
  c.beginPath();
  c.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#935c2b';
  c.beginPath();
  c.ellipse(2, 0, 10, 8, 0, 0, Math.PI * 2);
  c.fill();
  // Kepala + paruh + pial.
  c.fillStyle = '#c98a4b';
  c.beginPath();
  c.arc(15, 0, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#e8a33d';
  c.beginPath();
  c.moveTo(21, -2);
  c.lineTo(28, 1);
  c.lineTo(21, 4);
  c.closePath();
  c.fill();
  c.fillStyle = '#e63946';
  c.beginPath();
  c.arc(17, 5, 3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#1a1a1a';
  c.beginPath();
  c.arc(16, -2, 1.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawFarmerShape(c, f) {
  c.save();
  c.translate(f.x, f.y);
  // Kerucut pandang.
  const alpha = f.state === 'chase' ? 0.26 : f.state === 'suspicious' ? 0.17 : 0.09;
  c.fillStyle = `rgba(230, 57, 70, ${alpha})`;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, 220, f.angle - 0.6, f.angle + 0.6);
  c.closePath();
  c.fill();
  c.strokeStyle = `rgba(230, 57, 70, ${alpha + 0.15})`;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, 220, f.angle - 0.6, f.angle + 0.6);
  c.closePath();
  c.stroke();
  // Badan (overall biru) + kepala + topi jerami.
  c.rotate(f.angle);
  c.fillStyle = '#2f5d8a';
  c.beginPath();
  c.ellipse(0, 0, 17, 14, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#d9a066';
  c.beginPath();
  c.arc(16, 0, 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#e8c33d';
  c.beginPath();
  c.ellipse(16, -2, 13, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(16, -3, 6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Tanda seru / tanya.
  if (f.state === 'chase' || f.state === 'suspicious') {
    c.save();
    c.fillStyle = f.state === 'chase' ? '#e63946' : '#ffd166';
    c.strokeStyle = '#1a0f06';
    c.lineWidth = 3;
    c.font = 'bold 30px system-ui, sans-serif';
    c.textAlign = 'center';
    c.strokeText(f.state === 'chase' ? '!' : '?', f.x, f.y - 34);
    c.fillText(f.state === 'chase' ? '!' : '?', f.x, f.y - 34);
    c.restore();
  }
}

function drawFloor(c, stageIndex) {
  const fl = FLOORS[stageIndex];
  c.fillStyle = fl.base;
  c.fillRect(0, 0, VIEW_W, VIEW_H);
  c.fillStyle = fl.alt;
  for (let y = 0; y < VIEW_H; y += 60) {
    for (let x = (y / 60) % 2 === 0 ? 0 : 60; x < VIEW_W; x += 120) {
      c.fillRect(x, y, 60, 60);
    }
  }
}

function drawRectLabel(c, r, label, bg, fg) {
  c.fillStyle = bg;
  c.fillRect(r.x, r.y, r.w, r.h);
  c.strokeStyle = 'rgba(0,0,0,0.35)';
  c.lineWidth = 2;
  c.strokeRect(r.x, r.y, r.w, r.h);
  if (label) {
    c.fillStyle = fg || 'rgba(255,255,255,0.85)';
    c.font = 'bold 12px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  }
}

function drawHazards(c, w) {
  const def = w.stage.def;
  const h = w.stage.hazard;
  if (def.hazards.knife) {
    const z = def.hazards.knife.zone;
    if (h.phase === 'telegraph') {
      c.fillStyle = 'rgba(230,57,70,0.35)';
      c.fillRect(z.x, z.y, z.w, z.h);
      c.strokeStyle = '#e63946';
      c.lineWidth = 3;
      c.setLineDash([8, 6]);
      c.strokeRect(z.x, z.y, z.w, z.h);
      c.setLineDash([]);
    } else if (h.phase === 'sweep') {
      const p = Math.min(1, h.timer / def.hazards.knife.sweep);
      const bx = z.x + p * (z.w - 30);
      c.fillStyle = 'rgba(230,57,70,0.25)';
      c.fillRect(z.x, z.y, z.w, z.h);
      // Bilah pisau menyapu.
      c.fillStyle = '#dfe3ea';
      c.beginPath();
      c.moveTo(bx, z.y - 4);
      c.lineTo(bx + 30, z.y + z.h / 2);
      c.lineTo(bx, z.y + z.h + 4);
      c.lineTo(bx + 8, z.y + z.h / 2);
      c.closePath();
      c.fill();
      c.fillStyle = '#5d3a17';
      c.fillRect(bx - 12, z.y + z.h / 2 - 4, 14, 8);
    } else {
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.setLineDash([6, 6]);
      c.strokeRect(z.x, z.y, z.w, z.h);
      c.setLineDash([]);
      c.fillStyle = '#dfe3ea';
      c.fillRect(z.x + 8, z.y + 6, 22, 6);
    }
    c.fillStyle = '#fff3d6';
    c.font = 'bold 11px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('PISAU UKIR — LOMPAT!', z.x + z.w / 2, z.y - 8);
  }
  if (def.hazards.oven) {
    const z = def.hazards.oven.zone;
    const oven = { x: 880, y: 120, w: 60, h: 120 };
    drawRectLabel(c, oven, 'OVEN', '#3a2a1a', '#ff8c00');
    if (h.phase === 'telegraph') {
      c.fillStyle = 'rgba(255,140,0,0.35)';
      c.fillRect(z.x, z.y, z.w, z.h);
    } else if (h.phase === 'burst') {
      const g = c.createRadialGradient(z.x + 40, z.y + 40, 5, z.x + 40, z.y + 40, 90);
      g.addColorStop(0, 'rgba(255,180,0,0.75)');
      g.addColorStop(1, 'rgba(255,80,0,0)');
      c.fillStyle = g;
      c.fillRect(z.x - 40, z.y - 40, z.w + 80, z.h + 80);
      c.fillStyle = '#ff6b00';
      for (const [fx, fy, fr] of [[820, 160, 14], [845, 185, 18], [820, 195, 12]]) {
        c.beginPath();
        c.arc(fx, fy, fr, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.fillStyle = '#fff3d6';
    c.font = 'bold 11px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('OVEN PANAS — JAUHI!', z.x + z.w / 2, z.y - 8);
  }
}

function drawWorld(c, w) {
  const def = w.stage.def;
  drawFloor(c, w.stageIndex);
  // Titik sembunyi.
  for (const hide of def.hides) {
    c.fillStyle = w.stageIndex === 1 ? '#6b4a26' : '#3f6b2a';
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      c.beginPath();
      c.ellipse(hide.x + Math.cos(a) * 14, hide.y + Math.sin(a) * 10, 14, 9, a, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#fff3d6';
    c.font = 'bold 10px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('E = SEMBUNYI', hide.x, hide.y + hide.r + 12);
  }
  // Dinding.
  for (const wall of def.walls) {
    const label = w.stageIndex === 0 && wall.w > 150 ? 'LUMBUNG' : w.stageIndex === 1 && wall.w === 200 && wall.h === 90 ? 'MEJA' : '';
    drawRectLabel(c, wall, label, w.stageIndex === 2 ? '#7a5c38' : '#4a3520');
  }
  // Pagar rendah.
  for (const f of def.lowFences) {
    c.fillStyle = '#a9804a';
    c.fillRect(f.x, f.y, f.w, f.h);
    c.fillStyle = '#7d5f33';
    for (let y = f.y + 6; y < f.y + f.h; y += 18) c.fillRect(f.x, y, f.w, 3);
  }
  // Jagung.
  def.corn.forEach((corn, i) => {
    if (w.stage.cornTaken[i]) return;
    c.fillStyle = '#ffd166';
    c.beginPath();
    c.ellipse(corn.x, corn.y, 9, 6, 0.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#e8a33d';
    c.beginPath();
    c.ellipse(corn.x, corn.y, 5, 3, 0.4, 0, Math.PI * 2);
    c.fill();
  });
  // Umpan.
  if (w.bait) {
    c.fillStyle = '#ffd166';
    c.beginPath();
    c.arc(w.bait.x, w.bait.y, 7, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#e63946';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(w.bait.x, w.bait.y, 12, 0, Math.PI * 2);
    c.stroke();
  }
  // Pintu keluar (label di atas rect supaya tidak terpotong tepi layar).
  const e = def.exit;
  const glow = 0.5 + 0.3 * Math.sin(w.time * 4);
  c.fillStyle = `rgba(123, 201, 111, ${glow})`;
  c.fillRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
  drawRectLabel(c, e, '', '#2f7d32');
  c.fillStyle = '#fff3d6';
  c.font = 'bold 12px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText(e.label, Math.min(e.x + e.w / 2, VIEW_W - 34), e.y - 10);
  if (w.exitChannel > 0 && e.channel > 0) {
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(e.x, e.y - 12, e.w, 6);
    c.fillStyle = '#ffd166';
    c.fillRect(e.x, e.y - 12, e.w * (w.exitChannel / e.channel), 6);
  }
  drawHazards(c, w);
  drawFarmerShape(c, w.farmer);
  // Kalkun (berkedip saat kebal; meringkuk saat sembunyi).
  const blink = w.invulnTimer > 0 && Math.floor(w.time * 12) % 2 === 0;
  if (!blink) {
    if (w.turkey.hidden) {
      c.fillStyle = '#3f6b2a';
      c.beginPath();
      c.ellipse(w.turkey.x, w.turkey.y, 18, 12, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff3d6';
      c.font = 'bold 11px system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillText('...', w.turkey.x, w.turkey.y - 20);
    } else {
      drawTurkeyShape(c, w.turkey.x, w.turkey.y, 1, w.turkey.angle);
      if (w.turkey.jumping > 0) {
        c.strokeStyle = 'rgba(0,0,0,0.25)';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(w.turkey.x, w.turkey.y + 14, 10, 4, 0, 0, Math.PI * 2);
        c.stroke();
      }
    }
  }
  drawEffects(c);
  drawHUD(c, w);
}

/** Gambar satu frame sesuai layar aktif. */
export function render(c, w) {
  c.clearRect(0, 0, VIEW_W, VIEW_H);
  if (w.screen === 'title') drawTitleScreen(c, VIEW_W, VIEW_H);
  else if (w.screen === 'escaped') drawEscapedScreen(c, w, VIEW_W, VIEW_H);
  else if (w.screen === 'gameover') drawGameOverScreen(c, w, VIEW_W, VIEW_H);
  else drawWorld(c, w);
}
