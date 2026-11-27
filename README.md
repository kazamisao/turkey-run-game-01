# Operasi: Bukan Lauk! — Turkey Escape

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01/)
[![rank](https://make.fun/badge/turkey-run-game-01/kazamisao/turkey-run-game-01/rank.svg)](https://make.fun/c/turkey-run-game-01/)
[![reward](https://make.fun/badge/turkey-run-game-01/kazamisao/turkey-run-game-01/reward.svg)](https://make.fun/c/turkey-run-game-01/)

Stealth-action arena: bantu kalkun kabur dari menu Thanksgiving. Sembunyi di
tumpukan daun, pancing petani dengan umpan jagung, lompat pagar, dan lewati
tiga arena — Halaman Panen, Gudang Persiapan (pisau ukir menyapu jalur),
Dapur Thanksgiving (oven menyembur panas) — sebelum petani menangkapmu.

## Main

```sh
node serve.ts   # lalu buka http://localhost:8080
```

WASD gerak, SPACE lompat pagar rendah, SHIFT sprint (cepat tapi berisik),
E sembunyi di titik sembunyi, klik lempar umpan jagung. Tiga nyawa, tiga
stage, medali replay: tanpa terlihat, tanpa terluka, kabur cepat.

## Struktur

- `game/src/world.js` — layar, nyawa, skor, bahaya berkala, medali
- `game/src/turkey.js` — gerak, sprint, lompat, sembunyi, umpan
- `game/src/farmerAI.js` — patroli → curiga → mengejar → mencari
- `game/src/stages.js` — tiga arena + bahaya pisau/oven
- `game/src/render.js` — semua gambar kanvas
- `game/src/screens.js` — title & layar akhir
- `game/src/feedback.js` — HUD, suara WebAudio, partikel
- `game/src/shots.js` — adegan screenshot deterministik (`?shot=`)
- `tests/logic.test.mjs` — 33 uji logika (`node --test tests/logic.test.mjs`)

Entry untuk kompetisi [turkey-run-game-01](https://make.fun/c/turkey-run-game-01/)
di make.fun. Lisensi MIT.
