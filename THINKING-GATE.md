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

## Bedah top 1
TIDAK MUNGKIN: 0 entri saat build dimulai, tidak ada artifact top 1. Sebagai gantinya:
bedah kriteria juri verbatim di atas + house game starter (Block Dodger = rung #2) sebagai
patokan bawah — game masak lengkap dengan 6 resep + rush + combo harus mengalahkan game
dodge-and-collect generik di semua 5 kriteria juri.
