// Orkestrator game: layar (title/play/escaped/gameover), nyawa, skor,
// bahaya berkala (pisau/oven), pintu keluar ber-channel, medali replay.
// Logika murni — tanpa DOM — supaya bisa diuji di Node.
import { createTurkey, updateTurkey } from './turkey.js';
import { createFarmer, updateFarmer } from './farmerAI.js';
import { STAGES, createStageState, ARENA } from './stages.js';

export const MAX_LIVES = 3;
export const CORN_SCORE = 10;
export const STAGE_BONUS = 200;
export const UNSEEN_BONUS = 150;
export const ESCAPE_BONUS = 500;
export const NOISE_RADIUS = 170;
export const CATCH_DISTANCE = 26;
export const INVULN_AFTER_HIT = 2;

export function createWorld() {
  return {
    screen: 'title',
    stageIndex: 0,
    stage: null,
    turkey: null,
    farmer: null,
    score: 0,
    lives: MAX_LIVES,
    time: 0,
    best: 0,
    spottedThisStage: false,
    hurtThisStage: false,
    medals: null,
    invulnTimer: 0,
    exitChannel: 0,
    creakDone: false,
    bait: null,
    baitTimer: 0,
    stats: { corn: 0, spotted: false, hurt: false },
    messages: [],
  };
}

export function startGame(w) {
  w.score = 0;
  w.lives = MAX_LIVES;
  w.time = 0;
  w.medals = null;
  w.stats = { corn: 0, spotted: false, hurt: false };
  w.messages = [];
  w.screen = 'play';
  startStage(w, 0);
}

export function startStage(w, index) {
  w.stageIndex = index;
  w.stage = createStageState(index);
  const def = w.stage.def;
  w.turkey = createTurkey(def.spawn.x, def.spawn.y);
  w.turkey.bait = 3;
  w.farmer = createFarmer(def.farmerSpawn.x, def.farmerSpawn.y, def.waypoints);
  w.spottedThisStage = false;
  w.hurtThisStage = false;
  w.invulnTimer = 1;
  w.exitChannel = 0;
  w.creakDone = false;
  w.bait = null;
  w.baitTimer = 0;
}

function pushMessage(w, text) {
  w.messages.push({ text, t: 0 });
  if (w.messages.length > 3) w.messages.shift();
}

function hurtTurkey(w, cause) {
  if (w.invulnTimer > 0 || w.screen !== 'play') return null;
  const type = cause === 'caught' ? 'caught' : 'hurt';
  w.lives -= 1;
  w.hurtThisStage = true;
  w.stats.hurt = true;
  pushMessage(w, cause === 'caught' ? 'TERTANGKAP! Satu nyawa hilang.' : 'ADUH! Satu nyawa hilang.');
  if (w.lives <= 0) {
    w.screen = 'gameover';
    w.medals = computeMedals(w, false);
    return { type, x: w.turkey.x, y: w.turkey.y };
  }
  // Respawn di awal stage yang sama, petani kembali patroli.
  // Umpan sengaja TIDAK diisi ulang saat respawn — jatah umpan per-stage,
  // diisi ulang hanya di startStage.
  const def = w.stage.def;
  w.turkey.x = def.spawn.x;
  w.turkey.y = def.spawn.y;
  w.turkey.stamina = 100;
  w.turkey.hidden = false;
  w.farmer = createFarmer(def.farmerSpawn.x, def.farmerSpawn.y, def.waypoints);
  w.stage.hazard = { phase: 'idle', timer: 0 };
  w.invulnTimer = INVULN_AFTER_HIT;
  w.exitChannel = 0;
  w.bait = null;
  return { type, x: def.spawn.x, y: def.spawn.y };
}

function computeMedals(w, escaped) {
  return {
    unseen: escaped && !w.stats.spotted,
    unhurt: escaped && !w.stats.hurt,
    speedy: escaped && w.time < 240,
  };
}

function completeStage(w) {
  const timeBonus = Math.max(0, Math.round((120 - w.stage.stageTime) * 2));
  w.score += STAGE_BONUS + timeBonus;
  if (!w.spottedThisStage) w.score += UNSEEN_BONUS;
  if (w.stageIndex >= STAGES.length - 1) {
    w.score += ESCAPE_BONUS;
    w.screen = 'escaped';
    w.medals = computeMedals(w, true);
    w.best = Math.max(w.best, w.score);
    return { type: 'success' };
  }
  pushMessage(w, `${w.stage.def.name} dilewati! +${STAGE_BONUS + timeBonus}`);
  startStage(w, w.stageIndex + 1);
  return { type: 'stageClear' };
}

/**
 * Majukan bahaya berkala. Mengembalikan event saat hazard mulai aktif:
 * {type:'knife'} saat pisau masuk fase sweep, {type:'oven'} saat oven
 * masuk fase burst — supaya main.js bisa membunyikan SFX-nya.
 */
function updateHazard(w, dt) {
  const hz = w.stage.def.hazards.knife || w.stage.def.hazards.oven;
  if (!hz) return null;
  const h = w.stage.hazard;
  h.timer += dt;
  const idle = hz.idle;
  const tele = hz.telegraph;
  const act = hz.sweep ?? hz.burst;
  if (h.phase === 'idle' && h.timer >= idle) { h.phase = 'telegraph'; h.timer = 0; }
  else if (h.phase === 'telegraph' && h.timer >= tele) {
    h.phase = hz.sweep ? 'sweep' : 'burst';
    h.timer = 0;
    return { type: hz.sweep ? 'knife' : 'oven' };
  }
  else if ((h.phase === 'sweep' || h.phase === 'burst') && h.timer >= act) { h.phase = 'idle'; h.timer = 0; }
  return null;
}

/** Posisi bilah pisau saat ini — rumus yang sama dengan render (drawHazards). */
export function knifeBladeX(w) {
  const def = w.stage.def;
  const z = def.hazards.knife.zone;
  const p = Math.min(1, w.stage.hazard.timer / def.hazards.knife.sweep);
  return z.x + p * (z.w - 30);
}

function hazardHitsTurkey(w) {
  const def = w.stage.def;
  const h = w.stage.hazard;
  if (h.phase === 'sweep' && def.hazards.knife) {
    // Hitbox = posisi bilah, bukan seluruh zona: hanya kena bila kalkun
    // dekat bilah (bx) dan masih di lajur zona secara vertikal.
    const z = def.hazards.knife.zone;
    const bx = knifeBladeX(w);
    const nearBlade = Math.abs(w.turkey.x - bx) < 30;
    const inLane = w.turkey.y > z.y && w.turkey.y < z.y + z.h;
    return nearBlade && inLane && w.turkey.jumping <= 0;
  }
  if (h.phase === 'burst' && def.hazards.oven) {
    const z = def.hazards.oven.zone;
    return w.turkey.x > z.x && w.turkey.x < z.x + z.w && w.turkey.y > z.y && w.turkey.y < z.y + z.h;
  }
  return false;
}

function turkeyInExit(w) {
  const e = w.stage.def.exit;
  return w.turkey.x > e.x - 6 && w.turkey.x < e.x + e.w + 6
    && w.turkey.y > e.y - 6 && w.turkey.y < e.y + e.h + 6;
}

/**
 * Majukan dunia satu langkah. `input`: {mx,my,sprint,jump,hide,throwAt}.
 * Mengembalikan event gameplay langkah ini — main.js memetakannya ke suara
 * dan efek: spotted, lost, investigating, done-investigating, bait, corn,
 * knife, oven, hurt, caught, creak, stageClear, success.
 */
export function updateWorld(w, input, dt) {
  if (w.screen !== 'play') return [];
  const events = [];
  w.time += dt;
  w.stage.stageTime += dt;
  if (w.invulnTimer > 0) w.invulnTimer -= dt;
  for (const m of w.messages) m.t += dt;
  w.messages = w.messages.filter((m) => m.t < 3);

  const def = w.stage.def;
  const stageView = {
    bounds: ARENA,
    walls: def.walls,
    lowFences: def.lowFences,
    hides: def.hides,
  };

  const tEvents = updateTurkey(w.turkey, input, dt, stageView);
  for (const ev of tEvents) {
    if (ev.type === 'bait') {
      w.bait = { x: ev.x, y: ev.y };
      w.baitTimer = 12;
      pushMessage(w, 'Umpan dilempar — petani mengendus!');
      events.push({ type: 'bait', x: ev.x, y: ev.y });
    }
  }
  if (w.baitTimer > 0) {
    w.baitTimer -= dt;
    if (w.baitTimer <= 0) w.bait = null;
  }

  const noise = (input.sprint && w.turkey.moving)
    ? { x: w.turkey.x, y: w.turkey.y }
    : null;
  const farmerWalls = [...def.walls, ...def.lowFences];
  const fEvents = updateFarmer(w.farmer, dt, {
    turkey: w.turkey, walls: farmerWalls, bait: w.bait, noise,
  });
  for (const ev of fEvents) {
    events.push(ev);
    if (ev.type === 'spotted') {
      w.spottedThisStage = true;
      w.stats.spotted = true;
      pushMessage(w, 'PETANI MELIHATMU! LARI!');
    }
  }

  // Jagung skor.
  def.corn.forEach((c, i) => {
    if (w.stage.cornTaken[i]) return;
    const dx = w.turkey.x - c.x;
    const dy = w.turkey.y - c.y;
    if (dx * dx + dy * dy < 26 * 26) {
      w.stage.cornTaken[i] = true;
      w.score += CORN_SCORE;
      w.stats.corn += 1;
      events.push({ type: 'corn', x: c.x, y: c.y });
    }
  });

  const hzEvent = updateHazard(w, dt);
  if (hzEvent) events.push(hzEvent);
  if (hazardHitsTurkey(w)) {
    const hurtEvent = hurtTurkey(w, 'hazard');
    if (hurtEvent) events.push(hurtEvent);
  }
  if (w.screen !== 'play') return events;

  // Ditangkap petani saat bersentuhan (kecuali sedang kebal / sembunyi).
  const fd = Math.hypot(w.farmer.x - w.turkey.x, w.farmer.y - w.turkey.y);
  if (fd < CATCH_DISTANCE && !w.turkey.hidden) {
    const hurtEvent = hurtTurkey(w, 'caught');
    if (hurtEvent) events.push(hurtEvent);
  }
  if (w.screen !== 'play') return events;

  // Pintu keluar: stage 1 langsung, stage 2-3 butuh menahan (berderit!).
  if (turkeyInExit(w)) {
    const channel = def.exit.channel;
    if (channel === 0) {
      events.push(completeStage(w));
      return events;
    }
    if (!w.creakDone) {
      w.creakDone = true;
      events.push({ type: 'creak' });
      pushMessage(w, 'Pintu berderit... jangan sampai ketahuan!');
      const ed = Math.hypot(w.farmer.x - def.exit.x, w.farmer.y - def.exit.y);
      if (ed < 320 && w.farmer.state !== 'chase') {
        w.farmer.state = 'investigate';
        w.farmer.investigateTarget = { x: def.exit.x, y: def.exit.y };
        w.farmer.investigateTimer = 0;
      }
    }
    w.exitChannel += dt;
    if (w.exitChannel >= channel) {
      events.push(completeStage(w));
      return events;
    }
  } else {
    w.exitChannel = 0;
    w.creakDone = false;
  }
  return events;
}

/** Kemajuan menuju kebebasan 0..1 untuk HUD "Jarak ke Kebebasan". */
export function freedomProgress(w) {
  if (!w.stage) return 0;
  const e = w.stage.def.exit;
  const d = Math.hypot(w.turkey.x - (e.x + e.w / 2), w.turkey.y - (e.y + e.h / 2));
  const near = Math.max(0, 1 - d / 700);
  return Math.min(1, (w.stageIndex + near) / STAGES.length);
}
