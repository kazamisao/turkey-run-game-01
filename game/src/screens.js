// Layar title & akhir: gambar kanvas orisinal (tudung saji, bayangan petani,
// oven menyala) + area tombol. Tanpa aset eksternal.
import { drawTurkeyShape } from './render.js';

export const START_BUTTON = { x: 330, y: 470, w: 300, h: 56 };
export const RESTART_BUTTON = { x: 330, y: 500, w: 300, h: 56 };

function autumnSky(c, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2b1a0e');
  g.addColorStop(0.55, '#7a3b12');
  g.addColorStop(1, '#c96f1e');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // Daun jatuh.
  c.fillStyle = 'rgba(255, 209, 102, 0.8)';
  const leaves = [[90, 90], [820, 70], [760, 180], [140, 200], [880, 300], [60, 340]];
  for (const [x, y] of leaves) {
    c.save();
    c.translate(x, y);
    c.rotate(0.6);
    c.beginPath();
    c.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

function drawButton(c, box, label) {
  c.save();
  c.fillStyle = '#e63946';
  c.strokeStyle = '#ffd166';
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(box.x, box.y, box.w, box.h, 12);
  c.fill();
  c.stroke();
  c.fillStyle = '#fff';
  c.font = 'bold 24px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, box.x + box.w / 2, box.y + box.h / 2 + 1);
  c.restore();
}

export function drawTitleScreen(c, W, H) {
  autumnSky(c, W, H);
  // Oven menyala di kanan + bayangan petani di kiri.
  c.save();
  c.globalAlpha = 0.9;
  const glow = c.createRadialGradient(830, 430, 10, 830, 430, 150);
  glow.addColorStop(0, 'rgba(255, 140, 0, 0.85)');
  glow.addColorStop(1, 'rgba(255, 140, 0, 0)');
  c.fillStyle = glow;
  c.fillRect(680, 280, 300, 300);
  c.fillStyle = '#3a2a1a';
  c.fillRect(790, 380, 90, 110);
  c.fillStyle = '#ff8c00';
  c.fillRect(800, 400, 70, 60);
  c.restore();
  // Bayangan petani (siluet gelap, topi jerami).
  c.save();
  c.globalAlpha = 0.55;
  c.fillStyle = '#1a0f06';
  c.beginPath();
  c.ellipse(150, 470, 55, 90, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(150, 350, 38, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(150, 322, 70, 14, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Tudung saji + kalkun di bawahnya.
  c.save();
  c.translate(480, 330);
  c.fillStyle = 'rgba(0,0,0,0.25)';
  c.beginPath();
  c.ellipse(0, 78, 150, 16, 0, 0, Math.PI * 2);
  c.fill();
  drawTurkeyShape(c, 0, 40, 1.6, 0);
  c.fillStyle = 'rgba(220, 225, 235, 0.92)';
  c.beginPath();
  c.arc(0, 30, 95, Math.PI, 0);
  c.closePath();
  c.fill();
  c.fillStyle = '#c8ccd4';
  c.fillRect(-100, 28, 200, 8);
  c.fillStyle = '#ffd166';
  c.beginPath();
  c.arc(0, -68, 9, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Judul.
  c.save();
  c.textAlign = 'center';
  c.fillStyle = '#ffe66d';
  c.font = 'bold 54px system-ui, sans-serif';
  c.fillText('OPERASI: BUKAN LAUK!', W / 2, 110);
  c.fillStyle = '#fff3d6';
  c.font = '20px system-ui, sans-serif';
  c.fillText('Kalkun kabur dari menu Thanksgiving — tiga arena, satu petani, nol ampun.', W / 2, 150);
  c.font = '16px system-ui, sans-serif';
  c.fillStyle = '#ffd166';
  c.fillText('Stealth-action: sembunyi, pancing, lompat, dan jangan sampai terlihat.', W / 2, 180);
  c.restore();
  drawButton(c, START_BUTTON, '▶  MULAI KABUR');
  c.save();
  c.textAlign = 'center';
  c.fillStyle = '#fff3d6';
  c.font = '14px system-ui, sans-serif';
  c.fillText('WASD gerak  •  SPACE lompat pagar  •  SHIFT sprint (berisik!)  •  E sembunyi  •  KLIK lempar umpan jagung', W / 2, 560);
  c.fillText('Tiga nyawa. Tiga stage: Halaman Panen → Gudang Persiapan → Dapur Thanksgiving.', W / 2, 582);
  c.restore();
}

function drawMedals(c, medals, y) {
  const list = [];
  if (medals.unseen) list.push('🏅 TANPA TERLIHAT');
  if (medals.unhurt) list.push('🏅 TANPA TERLUKA');
  if (medals.speedy) list.push('🏅 KABUR CEPAT');
  if (list.length === 0) return y;
  c.save();
  c.textAlign = 'center';
  c.fillStyle = '#ffd166';
  c.font = 'bold 18px system-ui, sans-serif';
  c.fillText(list.join('   '), 480, y);
  c.restore();
  return y + 34;
}

export function drawEscapedScreen(c, w, W, H) {
  autumnSky(c, W, H);
  // Jendela terbuka + kalkun melayang keluar.
  c.save();
  c.fillStyle = '#7ec8e3';
  c.fillRect(330, 120, 300, 170);
  c.fillStyle = '#fff3d6';
  c.fillRect(330, 120, 300, 12);
  c.fillRect(475, 120, 12, 170);
  c.fillStyle = '#3a2a1a';
  c.fillRect(320, 110, 320, 14);
  c.fillRect(320, 286, 320, 14);
  drawTurkeyShape(c, 480, 200, 1.5, -0.4);
  c.fillStyle = '#ffd166';
  c.font = 'bold 20px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('✦  ✦  ✦', 480, 320);
  c.restore();
  c.save();
  c.textAlign = 'center';
  c.fillStyle = '#7bc96f';
  c.font = 'bold 48px system-ui, sans-serif';
  c.fillText('LOLOS DARI MENU!', W / 2, 380);
  c.fillStyle = '#fff3d6';
  c.font = '20px system-ui, sans-serif';
  c.fillText(`Skor ${w.score}  •  Waktu ${Math.round(w.time)} dtk  •  Jagung ${w.stats.corn}  •  Nyawa tersisa ${w.lives}`, W / 2, 420);
  c.restore();
  const y = drawMedals(c, w.medals, 452);
  c.save();
  c.textAlign = 'center';
  c.fillStyle = '#ffd166';
  c.font = '15px system-ui, sans-serif';
  c.fillText('Kalkun itu bebas. Petani masih mencari di dapur.', W / 2, y + 8);
  c.restore();
  drawButton(c, RESTART_BUTTON, '↻  MAIN LAGI');
}

export function drawGameOverScreen(c, w, W, H) {
  autumnSky(c, W, H);
  // Keranjang + kalkun duduk di dalamnya (tanpa gore).
  c.save();
  c.translate(480, 230);
  c.fillStyle = '#8b5a2b';
  c.beginPath();
  c.moveTo(-110, 0);
  c.lineTo(110, 0);
  c.lineTo(85, 90);
  c.lineTo(-85, 90);
  c.closePath();
  c.fill();
  c.strokeStyle = '#5d3a17';
  c.lineWidth = 4;
  for (let i = -2; i <= 2; i += 1) {
    c.beginPath();
    c.moveTo(i * 40 - 10, 4);
    c.lineTo(i * 40 - 5, 86);
    c.stroke();
  }
  drawTurkeyShape(c, 0, -30, 1.3, 0);
  c.restore();
  c.save();
  c.textAlign = 'center';
  c.fillStyle = '#e63946';
  c.font = 'bold 48px system-ui, sans-serif';
  c.fillText('TERTANGKAP!', W / 2, 380);
  c.fillStyle = '#fff3d6';
  c.font = '20px system-ui, sans-serif';
  c.fillText(`Kamu jadi lauk... Skor ${w.score}  •  Stage ${w.stage.def.name}`, W / 2, 420);
  c.fillStyle = '#ffd166';
  c.font = '15px system-ui, sans-serif';
  c.fillText('Tip: tahan E di tumpukan daun, dan lempar umpan sebelum petani menoleh.', W / 2, 452);
  c.restore();
  drawButton(c, RESTART_BUTTON, '↻  COBA LAGI');
}
