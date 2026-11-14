# MotionKu Studio v6

## Yang baru
- **Pack 300+**: 360 template (30 tema × 12 layout), 360 komponen (30 jenis × 12 gaya), 630+ ikon (Lucide, ISC), 310 transisi, 342 animasi (303 masuk/keluar + 39 loop).
- **Prompt adaptif**: 17 jenis video dideteksi otomatis; jumlah scene mengikuti isi prompt ("5 tips" → 7 scene); harga, diskon, toko, @akun, lokasi, tanggal, dan daftar menu dibaca dari kalimat.
- **Editor ala Figma + CapCut** (`components/studio/`): pilih, geser, ubah ukuran, putar, snap; ketuk dua kali untuk mengetik; timeline scene + transisi; mode Mudah/Pro (track layer); undo/redo; autosave.
- **Foto**: unggah foto produk/latar (dikompres otomatis), jadikan latar scene, elemen foto, atau isi mockup HP.
- **Export mulus**: WebCodecs + mp4-muxer, render frame-per-frame dengan timestamp pasti (fallback MediaRecorder).
- **Admin training** (`/admin`): input SVG ikon, kode komponen (JSON), kode transisi, kode animasi, plus bank hook/CTA — dengan preview langsung. Semua kode deklaratif (tanpa eval).
- **Warna khas "Sunset Coral"** (#FF6A3D + #FFB547 di atas #120E0C) di semua halaman; responsif & hemat beban di HP menengah ke bawah.

## Catatan
- Tidak ada perubahan skema database. Proyek baru disimpan di `projects.script_json` sebagai `{ version: 6, doc }`; proyek lama dibangun ulang otomatis dari topiknya.
- Ikon dibuat ulang dengan `node scripts/build-icon-pack.cjs`.
