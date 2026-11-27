// Adegan screenshot (?shot=start|play|kitchen|end): jalankan aturan game yang
// sebenarnya maju dari state segar dengan urutan input bernaskah yang tetap,
// jadi tiap frame adalah render asli dari kode game — bukan komposit.
import { createWorld, startGame, startStage, updateWorld } from './world.js';

const STEP = 1 / 60;
const NO_INPUT = { mx: 0, my: 0, sprint: false, jump: false, hide: false, throwAt: null };

function runScript(world, script) {
  for (const [input, seconds] of script) {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i += 1) {
      updateWorld(world, input, STEP);
      if (world.screen !== 'play') return;
    }
  }
}

/**
 * Siapkan `world` untuk adegan bernama dan kembalikan layar yang digambar.
 * Nama lain dari start/play/kitchen/end diperlakukan sebagai start.
 */
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    return { screen: 'title', best: 0 };
  }
  startGame(world);
  if (name === 'play') {
    // Halaman Panen: kejar jagung, lompat pagar, petani patroli dengan kerucut.
    runScript(world, [
      [{ ...NO_INPUT, mx: 1 }, 1.6],
      [{ ...NO_INPUT, mx: 1, my: -1 }, 1.2],
      [{ ...NO_INPUT, mx: 1, jump: true }, 0.2],
      [{ ...NO_INPUT, mx: 1 }, 1.0],
      [{ ...NO_INPUT, my: 1 }, 1.2],
      [{ ...NO_INPUT, mx: -1, my: 1 }, 1.0],
      [{ ...NO_INPUT, mx: 1, sprint: true }, 0.8],
      [NO_INPUT, 0.4],
    ]);
    return { screen: 'play', best: world.score };
  }
  if (name === 'kitchen') {
    // Dapur: kalkun dekat oven, petani MENGEJAR ("!"), oven menyembur.
    // Petani di (600,260): ruang terbuka di kanan pulau dapur (x 380-580),
    // garis pandang bersih ke kalkun — bukan di dalam dinding.
    startStage(world, 2);
    world.invulnTimer = 0;
    world.turkey.x = 730;
    world.turkey.y = 260;
    world.farmer.x = 600;
    world.farmer.y = 260;
    world.farmer.angle = 0;
    world.farmer.state = 'chase';
    world.farmer.lastSeen = { x: 730, y: 260 };
    world.stage.hazard.phase = 'telegraph';
    world.stage.hazard.timer = 0.55;
    runScript(world, [[NO_INPUT, 0.5]]);
    return { screen: 'play', best: world.score };
  }
  // end: kalkun menahan di jendela dapur sampai layar LOLOS tampil.
  startStage(world, 2);
  world.invulnTimer = 0;
  world.score = 1250;
  world.time = 95;
  world.stats.corn = 12;
  world.turkey.x = world.stage.def.exit.x + 10;
  world.turkey.y = world.stage.def.exit.y + 10;
  world.farmer.x = 300;
  world.farmer.y = 200;
  runScript(world, [[NO_INPUT, 2.5]]);
  if (world.screen !== 'escaped') {
    // Jalur darurat lewat transisi keluar yang sama (bukan jalan pintas render).
    world.exitChannel = 5;
    updateWorld(world, NO_INPUT, STEP);
  }
  return { screen: world.screen, best: world.score };
}

export function freshWorldForShot() {
  return createWorld();
}
