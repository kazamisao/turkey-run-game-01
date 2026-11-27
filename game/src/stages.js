// Tiga arena eskalasi "OPERASI: BUKAN LAUK!" — semuanya muat satu layar,
// rute selalu terbaca sekilas: halaman, gudang, dapur. Tiap stage punya
// 3 titik sembunyi, jagung skor, rute patroli, dan satu pintu keluar.
// Stage 2: pisau ukir menyapu lorong berkala. Stage 3: oven menyembur panas.
export const ARENA = { x: 0, y: 0, w: 960, h: 600 };

export const STAGES = [
  {
    name: 'Halaman Panen',
    sub: 'Lompati pagar, sembunyi di tumpukan daun, pancing petani dari gerbang.',
    spawn: { x: 90, y: 500 },
    farmerSpawn: { x: 480, y: 300 },
    waypoints: [
      { x: 300, y: 200 }, { x: 660, y: 200 }, { x: 660, y: 420 }, { x: 300, y: 420 },
    ],
    walls: [
      { x: 40, y: 40, w: 180, h: 120 },   // lumbung
      { x: 700, y: 60, w: 70, h: 70 },    // sumur
      { x: 620, y: 430, w: 130, h: 90 },  // tumpukan jerami besar
    ],
    lowFences: [
      { x: 420, y: 110, w: 16, h: 190 },  // pagar halaman atas (lompat!)
      { x: 420, y: 380, w: 16, h: 150 },  // pagar halaman bawah (lompat!)
    ],
    hides: [
      { x: 150, y: 450, r: 34 },
      { x: 800, y: 450, r: 34 },
      { x: 480, y: 80, r: 30 },
    ],
    corn: [
      { x: 300, y: 120 }, { x: 560, y: 130 }, { x: 250, y: 330 },
      { x: 700, y: 330 }, { x: 500, y: 500 }, { x: 850, y: 200 },
    ],
    exit: { x: 908, y: 278, w: 36, h: 44, label: 'GERBANG', channel: 0 },
    hazards: {},
  },
  {
    name: 'Gudang Persiapan',
    sub: 'Lorong sempit, pintu berderit, pisau ukir menyapu jalur berkala.',
    spawn: { x: 90, y: 300 },
    farmerSpawn: { x: 480, y: 140 },
    waypoints: [
      { x: 260, y: 150 }, { x: 700, y: 150 }, { x: 700, y: 450 }, { x: 260, y: 450 },
    ],
    walls: [
      { x: 120, y: 80, w: 200, h: 60 },   // rak kiri atas
      { x: 640, y: 80, w: 200, h: 60 },   // rak kanan atas
      { x: 120, y: 460, w: 200, h: 60 },  // rak kiri bawah
      { x: 640, y: 460, w: 200, h: 60 },  // rak kanan bawah
      { x: 380, y: 240, w: 200, h: 90 },  // meja persiapan
    ],
    lowFences: [
      { x: 470, y: 400, w: 20, h: 90 },   // peti rendah di lorong bawah
    ],
    hides: [
      { x: 200, y: 300, r: 30 },
      { x: 760, y: 300, r: 30 },
      { x: 480, y: 520, r: 30 },
    ],
    corn: [
      { x: 220, y: 180 }, { x: 740, y: 180 }, { x: 480, y: 140 },
      { x: 220, y: 420 }, { x: 740, y: 420 }, { x: 480, y: 380 },
    ],
    exit: { x: 908, y: 278, w: 36, h: 44, label: 'PINTU', channel: 1.2 },
    hazards: {
      knife: {
        zone: { x: 350, y: 350, w: 260, h: 26 },
        idle: 2.2, telegraph: 0.8, sweep: 0.5,
        label: 'PISAU UKIR',
      },
    },
  },
  {
    name: 'Dapur Thanksgiving',
    sub: 'Oven menyembur panas, meja jadi jalur memutar, petani menjaga jendela.',
    spawn: { x: 90, y: 500 },
    farmerSpawn: { x: 480, y: 200 },
    waypoints: [
      { x: 300, y: 300 }, { x: 660, y: 300 }, { x: 760, y: 460 }, { x: 220, y: 460 },
    ],
    walls: [
      { x: 80, y: 80, w: 220, h: 70 },    // meja dapur kiri
      { x: 660, y: 80, w: 220, h: 70 },   // meja dapur kanan
      { x: 380, y: 220, w: 200, h: 80 },  // pulau dapur
      { x: 880, y: 120, w: 60, h: 120 },  // oven
    ],
    lowFences: [
      { x: 470, y: 420, w: 20, h: 80 },   // kursi terbalik
    ],
    hides: [
      { x: 150, y: 480, r: 34 },
      { x: 350, y: 500, r: 30 },
      { x: 760, y: 480, r: 30 },
    ],
    corn: [
      { x: 200, y: 200 }, { x: 760, y: 200 }, { x: 480, y: 340 },
      { x: 200, y: 420 }, { x: 760, y: 380 }, { x: 480, y: 90 },
    ],
    exit: { x: 908, y: 478, w: 36, h: 44, label: 'JENDELA', channel: 1.0 },
    hazards: {
      oven: {
        zone: { x: 800, y: 140, w: 80, h: 80 },
        idle: 2.5, telegraph: 0.7, burst: 0.9,
        label: 'OVEN',
      },
    },
  },
];

/** State runtime satu stage (disalin segar tiap run supaya tidak bocor). */
export function createStageState(index) {
  const def = STAGES[index];
  return {
    def,
    cornTaken: def.corn.map(() => false),
    hazard: { phase: 'idle', timer: 0 },
    stageTime: 0,
  };
}
