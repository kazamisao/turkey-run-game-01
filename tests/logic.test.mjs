// Uji logika murni "OPERASI: BUKAN LAUK!" — stealth-action kalkun kabur.
// Ditulis SEBELUM implementasi (TDD): jalankan `node --test tests/logic.test.mjs`
// dan saksikan gagal dulu, baru tulis kode sampai hijau.
import test from 'node:test';
import assert from 'node:assert/strict';

import { pointInCone, segmentBlockedByRects, circleHitsRect, moveCircle } from '../game/src/geometry.js';
import { mulberry32 } from '../game/src/rng.js';
import { createTurkey, updateTurkey } from '../game/src/turkey.js';
import { createFarmer, updateFarmer, farmerSeesTurkey } from '../game/src/farmerAI.js';
import { STAGES, createStageState } from '../game/src/stages.js';
import { createWorld, startGame, startStage, updateWorld } from '../game/src/world.js';

const WALL = { x: 100, y: 100, w: 40, h: 200 };
const EMPTY_STAGE = {
  bounds: { x: 0, y: 0, w: 960, h: 600 },
  walls: [], lowFences: [], hides: [], corn: [],
  exit: { x: 900, y: 280, w: 40, h: 40 },
};
const NO_INPUT = { mx: 0, my: 0, sprint: false, jump: false, hide: false, throwAt: null };

// ---- geometry ----
test('pointInCone: titik di depan dalam jangkauan terlihat', () => {
  assert.equal(pointInCone(150, 0, 0, 0, 0, 220, 0.6), true);
});

test('pointInCone: titik di belakang penilik tidak terlihat', () => {
  assert.equal(pointInCone(-150, 0, 0, 0, 0, 220, 0.6), false);
});

test('pointInCone: titik di luar jangkauan tidak terlihat', () => {
  assert.equal(pointInCone(300, 0, 0, 0, 0, 220, 0.6), false);
});

test('pointInCone: titik di luar sudut kerucut tidak terlihat', () => {
  assert.equal(pointInCone(100, 150, 0, 0, 0, 220, 0.6), false);
});

test('segmentBlockedByRects: dinding di antara dua titik memblokir', () => {
  assert.equal(segmentBlockedByRects(0, 200, 300, 200, [WALL]), true);
});

test('segmentBlockedByRects: jalur bersih tidak terblokir', () => {
  assert.equal(segmentBlockedByRects(0, 50, 300, 50, [WALL]), false);
});

test('circleHitsRect: lingkaran menyentuh rect', () => {
  assert.equal(circleHitsRect(95, 200, 16, WALL), true);
  assert.equal(circleHitsRect(50, 200, 16, WALL), false);
});

test('moveCircle: geser di sepanjang dinding, tidak menembus', () => {
  const pos = moveCircle({ x: 80, y: 200 }, 16, 40, 30, [WALL]);
  assert.ok(pos.x <= 100 - 16 + 0.001, `x=${pos.x} menembus dinding`);
  assert.ok(pos.y > 200, 'harus tetap bisa geser ke bawah di sepanjang dinding');
});

test('mulberry32: seed sama memberi urutan sama', () => {
  const a = mulberry32(7); const b = mulberry32(7);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

// ---- turkey ----
test('turkey berjalan searah input dengan kecepatan jalan', () => {
  const t = createTurkey(100, 100);
  updateTurkey(t, { ...NO_INPUT, mx: 1 }, 1, EMPTY_STAGE);
  assert.ok(t.x > 260 && t.x < 280, `x=${t.x}`);
  assert.equal(t.y, 100);
});

test('turkey sprint lebih cepat dan menguras stamina', () => {
  const t = createTurkey(100, 100);
  updateTurkey(t, { ...NO_INPUT, mx: 1, sprint: true }, 1, EMPTY_STAGE);
  assert.ok(t.x > 230, `x=${t.x} (sprint harus > jalan)`);
  assert.ok(t.stamina < 100, `stamina=${t.stamina}`);
});

test('turkey stamina pulih saat tidak sprint', () => {
  const t = createTurkey(100, 100);
  t.stamina = 40;
  updateTurkey(t, NO_INPUT, 1, EMPTY_STAGE);
  assert.ok(t.stamina > 40, `stamina=${t.stamina}`);
});

test('turkey lompat melewati pagar rendah, tanpa lompat tertahan', () => {
  const fence = { x: 140, y: 80, w: 20, h: 120 };
  const stage = { ...EMPTY_STAGE, lowFences: [fence] };
  const stuck = createTurkey(100, 100);
  updateTurkey(stuck, { ...NO_INPUT, mx: 1 }, 1, stage);
  assert.ok(stuck.x < 140 - 16, `tanpa lompat harus tertahan, x=${stuck.x}`);
  const jumper = createTurkey(100, 100);
  updateTurkey(jumper, { ...NO_INPUT, mx: 1, jump: true }, 0.1, stage);
  updateTurkey(jumper, { ...NO_INPUT, mx: 1 }, 0.4, stage);
  assert.ok(jumper.x > 160, `dengan lompat harus lewat pagar, x=${jumper.x}`);
});

test('turkey sembunyi hanya di dalam titik sembunyi sambil menahan E', () => {
  const stage = { ...EMPTY_STAGE, hides: [{ x: 200, y: 200, r: 34 }] };
  const t = createTurkey(200, 200);
  updateTurkey(t, { ...NO_INPUT, hide: true }, 0.1, stage);
  assert.equal(t.hidden, true);
  const t2 = createTurkey(400, 400);
  updateTurkey(t2, { ...NO_INPUT, hide: true }, 0.1, stage);
  assert.equal(t2.hidden, false);
});

test('turkey lempar umpan mengurangi jatah dan mendarat di target', () => {
  const t = createTurkey(100, 100);
  const events = updateTurkey(t, { ...NO_INPUT, throwAt: { x: 250, y: 100 } }, 0.1, EMPTY_STAGE);
  assert.equal(t.bait, 2);
  const bait = events.find((e) => e.type === 'bait');
  assert.ok(bait, 'harus ada event bait');
  assert.ok(Math.abs(bait.x - 250) < 1 && Math.abs(bait.y - 100) < 1);
});

// ---- farmer AI ----
function farmerAt(x, y, waypoints) {
  return createFarmer(x, y, waypoints ?? [{ x, y }, { x: x + 200, y }]);
}

test('farmer patroli mengikuti waypoint', () => {
  const f = farmerAt(100, 100);
  updateFarmer(f, 1, { turkey: createTurkey(500, 500), walls: [], bait: null, noise: null });
  assert.ok(f.x > 100, `farmer harus bergerak, x=${f.x}`);
  assert.equal(f.state, 'patrol');
});

test('farmer melihat kalkun di kerucut pandang tanpa penghalang', () => {
  const f = farmerAt(100, 100);
  f.angle = 0;
  const turkey = createTurkey(200, 100);
  assert.equal(farmerSeesTurkey(f, turkey, []), true);
});

test('farmer tidak melihat kalkun yang bersembunyi', () => {
  const f = farmerAt(100, 100);
  f.angle = 0;
  const turkey = createTurkey(200, 100);
  turkey.hidden = true;
  assert.equal(farmerSeesTurkey(f, turkey, []), false);
});

test('farmer tidak melihat kalkun di balik dinding', () => {
  const f = farmerAt(100, 100);
  f.angle = 0;
  const turkey = createTurkey(200, 100);
  assert.equal(farmerSeesTurkey(f, turkey, [WALL]), false);
});

test('farmer curiga lalu mengejar bila kalkun terus terlihat', () => {
  const f = farmerAt(100, 100);
  f.angle = 0;
  const turkey = createTurkey(200, 100);
  const ctx = { turkey, walls: [], bait: null, noise: null };
  updateFarmer(f, 0.2, ctx);
  assert.equal(f.state, 'suspicious');
  updateFarmer(f, 0.6, ctx);
  assert.equal(f.state, 'chase');
});

test('farmer kehilangan kalkun lalu mencari di posisi terakhir, lalu patroli lagi', () => {
  const f = farmerAt(100, 100);
  f.angle = 0;
  f.state = 'chase';
  f.lastSeen = { x: 200, y: 100 };
  f.loseTimer = 0;
  const far = createTurkey(800, 500);
  const ctx = { turkey: far, walls: [], bait: null, noise: null };
  updateFarmer(f, 3, ctx);
  assert.equal(f.state, 'search');
  updateFarmer(f, 10, ctx);
  assert.equal(f.state, 'patrol');
});

test('umpan mengalihkan farmer patroli ke titik umpan', () => {
  const f = farmerAt(100, 100);
  const ctx = { turkey: createTurkey(500, 500), walls: [], bait: { x: 300, y: 300 }, noise: null };
  updateFarmer(f, 0.1, ctx);
  assert.equal(f.state, 'investigate');
  assert.ok(f.investigateTarget && f.investigateTarget.x === 300);
});

// ---- stages ----
test('tiga stage terdefinisi dengan nama dan exit berbeda', () => {
  assert.equal(STAGES.length, 3);
  assert.equal(STAGES[0].name, 'Halaman Panen');
  assert.equal(STAGES[1].name, 'Gudang Persiapan');
  assert.equal(STAGES[2].name, 'Dapur Thanksgiving');
  for (const s of STAGES) {
    assert.ok(s.exit && s.waypoints.length >= 2, 'setiap stage butuh exit + rute patroli');
    assert.ok(s.hides.length >= 1, 'setiap stage butuh titik sembunyi');
  }
  assert.ok(STAGES[1].hazards.knife, 'stage 2 punya bahaya pisau');
  assert.ok(STAGES[2].hazards.oven, 'stage 3 punya bahaya oven');
});

test('createStageState menyalin jagung agar tidak bocor antar run', () => {
  const a = createStageState(0);
  a.cornTaken[0] = true;
  const b = createStageState(0);
  assert.equal(b.cornTaken[0], false);
});

// ---- world ----
function freshWorld() {
  const w = createWorld();
  startGame(w);
  return w;
}

test('world: mencapai exit pindah ke stage berikut + bonus stage', () => {
  const w = freshWorld();
  const before = w.score;
  w.turkey.x = w.stage.def.exit.x + 5;
  w.turkey.y = w.stage.def.exit.y + 5;
  updateWorld(w, NO_INPUT, 0.1);
  assert.equal(w.stageIndex, 1);
  assert.ok(w.score > before + 150, `score=${w.score}`);
});

test('world: semburan oven di zona panas mengurangi nyawa', () => {
  const w = freshWorld();
  startStage(w, 2);
  w.invulnTimer = 0;
  const oven = w.stage.def.hazards.oven;
  w.turkey.x = oven.zone.x + 5;
  w.turkey.y = oven.zone.y + 5;
  w.stage.hazard.phase = 'burst';
  w.stage.hazard.timer = 0.5;
  const lives = w.lives;
  updateWorld(w, NO_INPUT, 0.1);
  assert.equal(w.lives, lives - 1);
  assert.ok(w.invulnTimer > 0, 'harus ada jeda kebal sesudah kena');
});

test('world: sapuan pisau aktif di zona mengurangi nyawa, lompat menghindarinya', () => {
  const w = freshWorld();
  startStage(w, 1);
  w.invulnTimer = 0;
  const knife = w.stage.def.hazards.knife;
  const lives = w.lives;
  w.turkey.x = knife.zone.x + 5;
  w.turkey.y = knife.zone.y + 5;
  w.stage.hazard.phase = 'sweep';
  w.stage.hazard.timer = 0.3;
  updateWorld(w, NO_INPUT, 0.1);
  assert.equal(w.lives, lives - 1);
  // lompat di atas sapuan: tidak kena
  const w2 = freshWorld();
  startStage(w2, 1);
  w2.invulnTimer = 0;
  w2.turkey.x = knife.zone.x + 5;
  w2.turkey.y = knife.zone.y + 5;
  w2.stage.hazard.phase = 'sweep';
  w2.stage.hazard.timer = 0.3;
  w2.turkey.jumping = 0.3;
  updateWorld(w2, NO_INPUT, 0.1);
  assert.equal(w2.lives, lives);
});

test('world: nyawa habis menampilkan layar tertangkap', () => {
  const w = freshWorld();
  w.lives = 1;
  startStage(w, 2);
  w.invulnTimer = 0;
  const oven = w.stage.def.hazards.oven;
  w.turkey.x = oven.zone.x + 5;
  w.turkey.y = oven.zone.y + 5;
  w.stage.hazard.phase = 'burst';
  w.stage.hazard.timer = 0.5;
  updateWorld(w, NO_INPUT, 0.1);
  assert.equal(w.screen, 'gameover');
});

test('world: kabur dari stage terakhir menampilkan layar lolos + medali', () => {
  const w = freshWorld();
  startStage(w, 2);
  w.turkey.x = w.stage.def.exit.x + 5;
  w.turkey.y = w.stage.def.exit.y + 5;
  w.exitChannel = 5; // sudah menahan di pintu keluar
  updateWorld(w, NO_INPUT, 0.1);
  assert.equal(w.screen, 'escaped');
  assert.ok(w.medals, 'medali harus dihitung');
  assert.equal(typeof w.medals.unseen, 'boolean');
});

test('world: jagung menambah skor', () => {
  const w = freshWorld();
  const corn = w.stage.def.corn[0];
  w.turkey.x = corn.x;
  w.turkey.y = corn.y;
  const before = w.score;
  updateWorld(w, NO_INPUT, 0.1);
  assert.ok(w.score > before, `score=${w.score}`);
});

test('world: stage tanpa terlihat memberi bonus tak-terlihat', () => {
  const w = freshWorld();
  w.spottedThisStage = false;
  const before = w.score;
  w.turkey.x = w.stage.def.exit.x + 5;
  w.turkey.y = w.stage.def.exit.y + 5;
  updateWorld(w, NO_INPUT, 0.1);
  assert.ok(w.score >= before + 150 + 150, `score=${w.score} (bonus stage + tak-terlihat)`);
});

test('world: sprint berisik membuat farmer curiga', () => {
  const w = freshWorld();
  w.farmer.x = 300; w.farmer.y = 300; w.farmer.angle = Math.PI;
  w.turkey.x = 400; w.turkey.y = 300;
  updateWorld(w, { ...NO_INPUT, mx: 1, sprint: true }, 0.2);
  assert.ok(w.farmer.state === 'suspicious' || w.farmer.state === 'chase', `state=${w.farmer.state}`);
});

test('world: petani menangkap kalkun saat bersentuhan', () => {
  const w = freshWorld();
  w.invulnTimer = 0;
  w.farmer.state = 'chase';
  w.farmer.x = w.turkey.x + 10;
  w.farmer.y = w.turkey.y;
  const lives = w.lives;
  updateWorld(w, NO_INPUT, 0.1);
  assert.equal(w.lives, lives - 1);
  assert.ok(w.turkey.x !== 0 || w.stageIndex === 0, 'kalkun harus respawn di awal stage');
});
