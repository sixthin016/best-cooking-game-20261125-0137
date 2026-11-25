# Thinking gate — best-cooking-game-20261125-0137

Kompetisi: "Make the best cooking game" — total $250, juara 1 $60, juara 2 $40, juara 3 $30,
tempat 4–10 $25/$20/$15. Deadline entri 2026-11-25 13:37 UTC = 21:37 WITA.
Blind rounds (4x): ronde 1 tutup 04:37 UTC = 12:37 WITA; ronde 2 15:37 WITA; ronde 3
18:37 WITA; final 21:37 WITA. Juri: z-ai/glm-5.3-flash, pairwise, tanpa tie, margin 1–5.
Entri dinilai dari contact sheet screenshot + outline sumber (dossier-view/v1, 1.536 token).

## 1. Apa yang membuat entri ini MENANG, bukan cuma lolos?
Juri melihat screenshot dulu (kriteria 1 paling berat): dapur lengkap + order board +
bahan di counter + satu hidangan mid-assembly + timer + piring siap saji. Cover shot saya
menampilkan SEMUA itu dalam satu frame yang terbaca saat dikecilkan: 3 tiket order dengan
timer bar, bin bahan berlabel, burger setengah jadi di piring (bun+patty+selada), patty
mendesis di grill dengan uap, shift timer besar, piring siap saji di jendela + popup "+$18".
Kedalaman (kriteria 2): 6 resep, pipeline ambil → cincang → panggang/goreng → rakit →
saji, risiko gosong, combo multiplier, rush hour di 60 detik terakhir, order makin cepat
per hari. Feel (3): partikel cincang, uap grill, popup koin, timer berdenyut merah saat
<10 detik, banner RUSH HOUR. Orisinalitas (4): nama "Ember Kitchen", semua art digambar
canvas sendiri, tanpa aset/karakter komersial. Struktur (5): 9 file sumber, satu tugas
jelas per file, nama fungsi sesuai pekerjaannya.

## R2 (25 Nov ~12:30 WITA) — rebuild visual + twist + playtest
Panel v1: mean 73,0 / min 55 / max 92 — lolos tipis, dan user yang melihat 4 screenshot
menilai visualnya "jelek banget" (benar: lantai beige ~50% frame kosong, jendela serving
placeholder, patty pucat, uap nyaris tak terlihat, papan potong kosong). R2 memperbaiki
ketiganya, bukan menambal:
- **Visual (render.js ditulis ulang):** lantai checkerboard bertekstur + speckle +
  karpet runner bermotif, bayangan lembut di bawah semua counter, jendela serving baru
  (etalase + lampu hangat + piring + pelanggan menunggu + label READY TO SERVE!),
  patty berubah warna mengikuti kematangan + grill marks + uap (partikel dunia nyata
  dari world.js + curl animasi di render), papan potong selalu berisi (pisau + bahan),
  palet lebih hangat/kaya. Tidak ada lagi bidang datar kosong di mana pun.
- **Twist — freshness:** bahan yang sudah dicincang/dipanggang segar 25 detik (cincin
  hijau yang menguras di sekelilingnya), lalu basi. Hidangan serba-segar = bonus +$3;
  ada satu bahan basi = tanpa tip. Prep-ahead cepat tapi hanya masak just-in-time
  yang dibayar penuh — game ini tentang timing, bukan sekadar kecepatan.
  Terlihat di screenshot: cincin freshness di board/grill/plate, popup "FRESH +$3",
  peringatan "stale item — no tip at the window".
- **Playtest (`tools/playtest.mjs`, PLAYTEST.md):** bot greedy memainkan shift penuh
  180 detik di Node (world.js yang sama dengan game): step time p50 0,004 ms /
  p95 0,012 ms, latensi input-ke-efek 1 step (16,7 ms), 0 error di 136 penggunaan
  stasiun, seed sama dua kali = hasil identik, 4/4 cek freshness lolos.
  Frame probe live di Chromium headless: mean ~20 ms (software rendering, VM 1,5 CPU).

## 2. Apa yang bisa MENOLAK entri ini di intake?
- entry_size: game/ kecil (vanilla JS, tanpa library), jauh di bawah 48 MiB / 993 file.
- references: semua referensi lokal (ES module relatif); tanpa font/CDN/gambar eksternal.
- screenshots: 4 JPEG 1280x800, masing-masing ≤256 KiB, render asli dari kode game
  (mode ?shot=, autopilot memainkan aturan asli + staging state yang bisa dicapai).
- dossier_matches: main.ts memanggil buildDossier dari vendor/makefun-game.ts persis
  seperti starter; jalankan 2x dan samakan byte-nya (deterministik).
- transcripts: build FRESH di sesi ini (sesi dimulai setelah kompetisi buka 01:37 UTC);
  semua baris kode ditulis lewat write/edit saya sendiri; tiap file direvisi ≥2 pesan;
  target authored ~100% (hanya vendor/makefun-game.ts + LICENSE dari kit, keduanya
  dikecualikan dari hitungan).
- repo_created_after_open + claim file: urusan parent saat submit (repo GitHub dibuat
  setelah buka + .makefun/owner.json); BUKAN di build ini (tugas ini: JANGAN buat repo/push/submit).
- Disqualifikasi: tidak ada gambar dari entri lain (semua screenshot render sendiri),
  tidak ada copy starter (game ini 100% kode baru, bukan Block Dodger).

## 3. Apakah teknik ini sudah dipakai akun lain?
Kompetisi judge-scored (bukan deterministik): tidak ada teknik rahasia yang bisa dicuri
lewat file identik. Starter kit adalah house game #2 — entri saya TIDAK memakai satu pun
file game starter (game/src starter tidak disalin; hanya vendor/makefun-game.ts +
LICENSE yang memang wajib dari kit). Pola ?shot= + autopilot mengikuti pola starter
yang didokumentasikan di RULES.txt, tapi implementasi autopilot + staging ditulis baru.

## 4. Anggaran authored-line
Total ±2.300 baris (game ~2.000, main.ts + serve.ts + README ~300). Semuanya ditulis
di sesi terekam ini via write/edit — target ≥40% (harapan ~100% dari baris yang dihitung).
Tiap file: tulis awal + minimal 1 revisi edit/append sebelum selesai.

## 5. Gain vs entri live
Belum ada entri live: kompetisi dibuka hari ini 09:37 WITA, entries_count = 0, belum ada
leaderboard/top 1 untuk dibedah (blind rounds, tidak ada rank yang terlihat). Gain =
menjadi entri pertama yang lengkap + lolos gate + menang game pairwise lawan house games
di ronde blind. Target: masuk 40 besar dev board (kursi final heat) lalu top 10 final.
**R2: panel v1 mean 73,0 / min 55 — target panel v2 mean ≥78 / min ≥65.**
Bila panel v2 tidak lebih baik dari v1, JANGAN resubmit (Force_Last menghukum resubmit
yang lebih buruk).

## Bedah top 1
TIDAK MUNGKIN: 0 entri saat build dimulai, tidak ada artifact top 1. Sebagai gantinya:
bedah kriteria juri verbatim di atas + house game starter (Block Dodger = rung #2) sebagai
patokan bawah — game masak lengkap dengan 6 resep + rush + combo harus mengalahkan game
dodge-and-collect generik di semua 5 kriteria juri.
