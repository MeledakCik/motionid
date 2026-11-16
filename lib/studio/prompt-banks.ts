/**
 * Bank pengetahuan Prompt Engine v7.
 *
 * Isinya saran umum yang benar (tips, kesalahan, manfaat, langkah), fakta populer yang sudah umum diketahui,
 * tempat wisata terkenal, kutipan orisinal per tema, dan ucapan per hari besar. Dipakai supaya video langsung
 * berisi kalimat jadi — bukan kerangka "tulis di sini" — selama topiknya dikenali. Topik yang tidak dikenali
 * tetap memakai teks contoh bertanda (wajib diganti), karena fakta & data spesifik tidak boleh dikarang.
 *
 * Format baris: [judul, keterangan].
 */

export type Line = [string, string];

/* ------------------------------------------------------------------ */
/* Tips per bidang                                                      */
/* ------------------------------------------------------------------ */
export const TIPS: Record<string, Line[]> = {
  pinjol: [
    ['Cek izinnya di OJK', 'Pinjol legal terdaftar & diawasi OJK.'],
    ['Waspada bunga & denda tak wajar', 'Pinjol ilegal sering memasang bunga mencekik.'],
    ['Jangan beri akses kontak', 'Pinjol ilegal kerap menyebar data peminjam.'],
    ['Abaikan tawaran lewat SMS/WA', 'Tawaran pinjaman lewat pesan pribadi patut dicurigai.'],
    ['Pinjam sesuai kemampuan bayar', 'Hitung dulu cicilan dari penghasilanmu.'],
    ['Laporkan bila diteror', 'Adukan ke Kontak OJK 157 atau polisi.'],
  ],
  kebiasaan: [
    ['Bangun lebih pagi', 'Punya waktu tenang sebelum hari sibuk.'],
    ['Minum air putih', 'Tubuh terhidrasi, pikiran lebih segar.'],
    ['Gerak ringan sebentar', 'Peregangan atau jalan kaki 10–15 menit.'],
    ['Tentukan prioritas hari ini', 'Tulis 3 hal terpenting yang harus selesai.'],
    ['Sarapan bergizi', 'Energi lebih stabil sampai siang.'],
    ['Baca atau belajar sebentar', 'Investasi kecil untuk pikiran.'],
    ['Tunda buka HP', 'Jangan biarkan notifikasi mengatur pagimu.'],
    ['Luangkan waktu bersyukur', 'Mulai hari dengan pikiran positif.'],
  ],
  hewan: [
    ['Sisir bulunya rutin', 'Bulu mati terangkat, kusut pun berkurang.'],
    ['Beri makanan bergizi', 'Protein & lemak sehat bantu bulu tetap sehat.'],
    ['Sediakan air minum bersih', 'Ganti airnya setiap hari.'],
    ['Mandikan seperlunya', 'Terlalu sering mandi bikin kulit kering.'],
    ['Jaga kebersihan kandang', 'Lingkungan bersih mencegah kutu & jamur.'],
    ['Rutin periksa ke dokter hewan', 'Rontok berlebihan bisa tanda masalah kesehatan.'],
    ['Ajak bermain setiap hari', 'Hewan yang nggak stres lebih sehat.'],
    ['Vaksin & obat cacing teratur', 'Ikuti jadwal dari dokter hewan.'],
  ],
  dapur: [
    ['Beli secukupnya', 'Bahan segar cepat layu kalau kebanyakan.'],
    ['Simpan dengan benar', 'Wadah kedap udara & kulkas bikin bahan lebih awet.'],
    ['Bekukan stok bahan', 'Cabai & bumbu halus beku tahan berminggu-minggu.'],
    ['Rencanakan menu mingguan', 'Belanja jadi terarah, sisa bahan berkurang.'],
    ['Belanja di pasar pagi', 'Pilihan lebih segar, harga bisa ditawar.'],
    ['Tanam sendiri di pot', 'Cabai & daun bawang gampang tumbuh di rumah.'],
    ['Cari bahan pengganti', 'Cabai kering atau bubuk bisa jadi alternatif.'],
    ['Bandingkan harga dulu', 'Cek beberapa pedagang sebelum membeli.'],
  ],
  keuangan: [
    ['Pisahkan rekening', 'Satu untuk kebutuhan, satu untuk tabungan.'],
    ['Pakai aturan 50/30/20', 'Kebutuhan, keinginan, dan tabungan.'],
    ['Catat semua pengeluaran', 'Yang kecil-kecil justru paling bocor.'],
    ['Bikin dana darurat', 'Minimal 3–6 kali pengeluaran bulanan.'],
    ['Tunda beli 24 jam', 'Kalau masih mau besok, baru beli.'],
    ['Investasi rutin', 'Nominal kecil tapi konsisten tiap bulan.'],
    ['Hindari utang konsumtif', 'Paylater itu tetap utang.'],
    ['Evaluasi tiap akhir bulan', 'Lihat pos mana yang bisa dihemat.'],
  ],
  hemat: [
    ['Masak sendiri', 'Belanja bahan mingguan jauh lebih hemat dari jajan.'],
    ['Bawa bekal & tumbler', 'Jajan kecil tiap hari diam-diam bikin boncos.'],
    ['Bagi uang per minggu', 'Jatah mingguan bikin nggak kalap di awal bulan.'],
    ['Catat pengeluaran harian', 'Biar tahu uangmu bocor ke mana.'],
    ['Belanja pakai daftar', 'Beli yang perlu, bukan yang lagi diskon.'],
    ['Tabung di awal, bukan sisa', 'Sisihkan dulu begitu uang masuk.'],
    ['Kurangi ngopi di luar', 'Seduh sendiri, rasanya tetap enak.'],
    ['Pakai promo seperlunya', 'Promo cuma hemat kalau barangnya memang butuh.'],
  ],
  jualan: [
    ['Kenali target pembeli', 'Bicara langsung ke masalah mereka.'],
    ['Foto produk yang terang', 'Cahaya alami bikin produk lebih menarik.'],
    ['Hook 3 detik pertama', 'Kalimat pertama menentukan orang berhenti scroll.'],
    ['Tampilkan testimoni', 'Bukti sosial bikin orang lebih yakin.'],
    ['Kasih alasan beli sekarang', 'Promo terbatas atau bonus khusus.'],
    ['Balas chat secepatnya', 'Respon cepat = closing lebih banyak.'],
    ['Posting konsisten', 'Algoritma suka akun yang rajin.'],
    ['Upsell dengan paket', 'Bundling bikin nilai belanja naik.'],
  ],
  konten: [
    ['Riset tren dulu', 'Lihat FYP dan cari pola yang berulang.'],
    ['Hook kuat di detik awal', 'Pertanyaan atau pernyataan mengejutkan.'],
    ['Durasi singkat & padat', '15–30 detik paling aman.'],
    ['Pakai teks di layar', 'Banyak orang nonton tanpa suara.'],
    ['Konsisten jam posting', 'Biasakan audiens menunggu kontenmu.'],
    ['Balas komentar jadi video', 'Konten baru sekaligus interaksi.'],
    ['Analisis insight', 'Ulangi format yang performanya bagus.'],
    ['Kolaborasi', 'Pinjam audiens kreator lain.'],
  ],
  belajar: [
    ['Belajar 25 menit, istirahat 5', 'Teknik pomodoro bikin fokus tahan lama.'],
    ['Jelaskan ulang ke orang lain', 'Kalau bisa menjelaskan, berarti paham.'],
    ['Latihan soal, bukan cuma baca', 'Ingatan menguat saat dipakai.'],
    ['Tidur cukup', 'Otak menyimpan memori saat tidur.'],
    ['Singkirkan HP', 'Notifikasi adalah musuh fokus.'],
    ['Ulangi berkala', 'Spaced repetition: hari 1, 3, 7.'],
    ['Buat peta konsep', 'Hubungkan ide biar gampang diingat.'],
    ['Tetapkan target kecil', 'Satu bab per hari lebih realistis.'],
  ],
  kesehatan: [
    ['Minum air 8 gelas', 'Tubuh terhidrasi, pikiran lebih segar.'],
    ['Jalan kaki 30 menit', 'Olahraga ringan yang paling mudah.'],
    ['Kurangi gula', 'Energi lebih stabil sepanjang hari.'],
    ['Tidur sebelum jam 11', 'Kualitas tidur ikut menentukan mood.'],
    ['Perbanyak sayur & buah', 'Isi setengah piring dengan warna.'],
    ['Peregangan tiap jam', 'Leher dan punggung bakal berterima kasih.'],
    ['Batasi layar sebelum tidur', 'Cahaya biru mengganggu jam biologis.'],
    ['Cek kesehatan rutin', 'Lebih baik mencegah daripada mengobati.'],
  ],
  karier: [
    ['Sesuaikan CV dengan lowongan', 'Pakai kata kunci dari deskripsi pekerjaan.'],
    ['Tulis pencapaian pakai angka', 'Hasil kerja yang terukur lebih meyakinkan.'],
    ['Riset perusahaan dulu', 'Tunjukkan kamu paham apa yang mereka kerjakan.'],
    ['Latihan jawab pertanyaan umum', 'Ceritakan dirimu singkat dan jelas.'],
    ['Datang 10 menit lebih awal', 'Kesan pertama dimulai dari tepat waktu.'],
    ['Siapkan pertanyaan balik', 'Tanya soal tim, target, dan budaya kerja.'],
    ['Rapikan profil LinkedIn', 'Rekruter sering cek profil online-mu.'],
    ['Kirim ucapan terima kasih', 'Follow-up sopan setelah wawancara.'],
  ],
  komunikasi: [
    ['Dengarkan sampai selesai', 'Jangan memotong saat orang lain bicara.'],
    ['Sampaikan dengan jelas & singkat', 'Satu pesan, satu tujuan.'],
    ['Tanya kalau belum paham', 'Lebih baik bertanya daripada salah paham.'],
    ['Kabari progres', 'Update kecil bikin tim tenang.'],
    ['Kritik idenya, bukan orangnya', 'Fokus pada solusi bersama.'],
    ['Hargai kontribusi teman', 'Ucapan terima kasih itu penting.'],
    ['Sepakati pembagian tugas', 'Siapa mengerjakan apa, sampai kapan.'],
    ['Pilih saluran yang tepat', 'Hal penting dibahas langsung, bukan cuma lewat chat.'],
  ],
  produktif: [
    ['Tentukan 3 prioritas harian', 'Kerjakan yang paling penting dulu.'],
    ['Pakai time blocking', 'Jadwalkan tugas seperti janji temu.'],
    ['Matikan notifikasi saat fokus', 'Satu notifikasi bisa memecah konsentrasi.'],
    ['Kerjakan tugas berat di pagi hari', 'Energi dan fokus biasanya paling tinggi.'],
    ['Pecah tugas besar jadi kecil', 'Langkah kecil terasa lebih ringan.'],
    ['Istirahat sejenak tiap jam', 'Otak butuh jeda supaya tetap tajam.'],
    ['Rapikan meja kerja', 'Ruang rapi, pikiran lebih jernih.'],
    ['Evaluasi di akhir hari', 'Catat yang selesai dan rencana besok.'],
  ],
  tidur: [
    ['Tidur & bangun di jam yang sama', 'Jam biologis jadi lebih teratur.'],
    ['Jauhkan HP 30 menit sebelum tidur', 'Cahaya layar bikin susah terlelap.'],
    ['Batasi kafein sore hari', 'Efek kopi bisa bertahan berjam-jam.'],
    ['Redupkan lampu kamar', 'Gelap memberi sinyal tubuh untuk istirahat.'],
    ['Atur suhu kamar sejuk', 'Suhu nyaman bikin tidur lebih nyenyak.'],
    ['Hindari makan berat sebelum tidur', 'Beri jeda 2–3 jam setelah makan.'],
    ['Tulis isi pikiran', 'Kosongkan kepala sebelum rebahan.'],
    ['Tidur siang secukupnya', 'Cukup 20–30 menit supaya malam tetap ngantuk.'],
  ],
  skincare: [
    ['Pakai sunscreen tiap hari', 'Termasuk saat cuaca mendung.'],
    ['Cuci muka 2 kali sehari', 'Pagi dan malam, pakai pembersih yang lembut.'],
    ['Jangan pencet jerawat', 'Bisa meninggalkan bekas dan memicu infeksi.'],
    ['Patch test produk baru', 'Coba di area kecil sebelum ke seluruh wajah.'],
    ['Tetap pakai pelembap', 'Kulit berminyak pun butuh hidrasi.'],
    ['Ganti sarung bantal rutin', 'Kotoran dan minyak menempel tiap malam.'],
    ['Kenali jenis kulitmu', 'Pilih produk sesuai kebutuhan kulit.'],
    ['Konsisten, jangan gonta-ganti', 'Hasil skincare butuh beberapa minggu.'],
  ],
  tanaman: [
    ['Pilih bibit yang sehat', 'Daun segar dan batang kokoh.'],
    ['Pakai media tanam gembur', 'Campur tanah, kompos, dan sekam.'],
    ['Pastikan ada lubang drainase', 'Air berlebih bikin akar busuk.'],
    ['Taruh di tempat yang kena matahari', 'Banyak tanaman butuh sekitar 6 jam sinar.'],
    ['Siram pagi atau sore', 'Hindari menyiram saat terik.'],
    ['Beri pupuk berkala', 'Pupuk organik aman untuk pemula.'],
    ['Cabut gulma rutin', 'Gulma merebut nutrisi tanaman.'],
    ['Cek hama tiap hari', 'Tangani sejak dini sebelum menyebar.'],
  ],
  hp: [
    ['Hindari suhu panas', 'Panas berlebih cepat merusak baterai.'],
    ['Isi daya di kisaran 20–80%', 'Tidak perlu selalu sampai 100%.'],
    ['Pakai charger yang sesuai', 'Charger asal-asalan berisiko merusak.'],
    ['Turunkan kecerahan layar', 'Layar adalah penyedot daya terbesar.'],
    ['Matikan fitur yang tidak dipakai', 'Bluetooth, GPS, dan hotspot.'],
    ['Update sistem rutin', 'Pembaruan sering membawa perbaikan.'],
    ['Hapus aplikasi yang jarang dipakai', 'Memori lega, HP lebih ringan.'],
    ['Restart sesekali', 'Membersihkan proses yang menumpuk.'],
  ],
  kendaraan: [
    ['Ganti oli sesuai jadwal', 'Cek buku manual untuk jarak tempuhnya.'],
    ['Cek tekanan ban', 'Ban kurang angin bikin boros dan tidak aman.'],
    ['Panaskan mesin sebentar', 'Cukup 1–3 menit sebelum jalan.'],
    ['Periksa rem secara rutin', 'Keselamatan nomor satu.'],
    ['Jaga rantai tetap bersih', 'Lumasi supaya tidak cepat aus.'],
    ['Servis berkala di bengkel', 'Masalah kecil ketahuan lebih awal.'],
    ['Cek lampu & klakson', 'Pastikan berfungsi sebelum berkendara.'],
    ['Cuci kendaraan rutin', 'Mencegah karat dan kotoran menumpuk.'],
  ],
  listrik: [
    ['Cabut charger setelah dipakai', 'Charger tetap menyedot daya walau tak terpakai.'],
    ['Pakai lampu LED', 'Lebih terang dengan daya lebih kecil.'],
    ['Atur AC di 24–25°C', 'Sejuk tanpa bikin tagihan membengkak.'],
    ['Manfaatkan cahaya alami', 'Buka jendela di siang hari.'],
    ['Jangan buka kulkas terlalu lama', 'Kulkas jadi bekerja ekstra.'],
    ['Matikan alat dari stopkontak', 'Mode standby tetap makan listrik.'],
    ['Cuci baju sekaligus', 'Kurangi frekuensi pakai mesin cuci.'],
    ['Rawat perangkat elektronik', 'Alat yang bersih bekerja lebih efisien.'],
  ],
  travel: [
    ['Datang pagi', 'Belum ramai & cahaya foto lebih bagus.'],
    ['Cek cuaca dulu', 'Rencana aman, liburan tetap seru.'],
    ['Pesan penginapan lebih awal', 'Pilihan lebih banyak, harga lebih bersahabat.'],
    ['Bawa botol minum sendiri', 'Hemat & ramah lingkungan.'],
    ['Siapkan uang tunai', 'Tidak semua tempat menerima pembayaran digital.'],
    ['Pakai transportasi lokal', 'Lebih hemat & dapat pengalaman baru.'],
  ],
  umum: [
    ['Mulai dari yang kecil', 'Langkah kecil yang konsisten lebih kuat.'],
    ['Buat jadwal rutin', 'Kebiasaan mengalahkan motivasi.'],
    ['Catat progresmu', 'Melihat kemajuan bikin semangat.'],
    ['Belajar dari yang sudah berhasil', 'Cari mentor atau contoh nyata.'],
    ['Evaluasi tiap minggu', 'Buang cara yang tidak berhasil.'],
    ['Jangan bandingkan diri', 'Fokus pada prosesmu sendiri.'],
    ['Pakai alat bantu', 'Kerja cerdas, bukan cuma keras.'],
    ['Rayakan kemenangan kecil', 'Energi positif untuk langkah berikutnya.'],
  ],
};

/** Kata kunci → bidang tips (urutan = prioritas). */
export const DOMAIN_RULES: Array<[RegExp, string]> = [
  [/\b(pinjol|pinjaman online|pinjaman ilegal|rentenir online|utang online|galbay)\b/, 'pinjol'],
  [/\b(kucing|anjing|hamster|kelinci|burung|ikan hias|hewan peliharaan|anabul|peliharaan|pet)\b/, 'hewan'],
  [/\b(kebiasaan|habit|rutinitas|morning routine|pagi hari)\b/, 'kebiasaan'],
  [/\b(cabai|cabe|bawang|sayur(?:an)?|sembako|minyak goreng|beras|telur|bahan dapur|belanja dapur|belanja bulanan|belanja pasar)\b.*\b(hemat|irit|mahal|naik|awet|simpan|murah)\b|\b(hemat|irit|awet)\b.*\b(cabai|cabe|bawang|sayur(?:an)?|sembako|bahan dapur|belanja dapur|belanja bulanan)\b/, 'dapur'],
  [/\b(cv|ats|interview|wawancara|lamar(an)?|melamar|karier|karir|linkedin|kerja baru|cari kerja|fresh graduate)\b/, 'karier'],
  [/\b(komunikasi|tim|kerja ?sama|kolaborasi|rapat|meeting|rekan kerja|kantor|atasan)\b/, 'komunikasi'],
  [/\b(anak kos|kos|kost|akhir bulan|hemat|irit|boros|uang saku|mahasiswa)\b/, 'hemat'],
  [/\b(uang|keuangan|nabung|menabung|tabung(an)?|investasi|gaji|saham|finansial|cuan|utang|hutang|paylater|budget)\b/, 'keuangan'],
  [/\b(jualan|jual|bisnis|usaha|umkm|toko|closing|pembeli|olshop|online shop|marketing|dagang|reseller)\b/, 'jualan'],
  [/\b(konten|tiktok|fyp|viral|kreator|creator|youtube|youtuber|followers|algoritma|reels|instagram)\b/, 'konten'],
  [/\b(skincare|kulit|wajah|jerawat|glowing|sunscreen|serum|kusam)\b/, 'skincare'],
  [/\b(tidur|insomnia|begadang|ngantuk)\b/, 'tidur'],
  [/\b(belajar|ujian|kuliah|sekolah|skripsi|bahasa|les|ujian|nilai|hafal)\b/, 'belajar'],
  [/\b(produktif|produktivitas|fokus|malas|mager|menunda|prokrastinasi|deadline|waktu)\b/, 'produktif'],
  [/\b(tanam|menanam|tanaman|kebun|berkebun|polybag|pupuk|bibit|hidroponik|cabai|cabe|tomat|sayur)\b/, 'tanaman'],
  [/\b(hp|handphone|smartphone|baterai|batre|gadget|android|iphone|charger)\b/, 'hp'],
  [/\b(motor|mobil|kendaraan|sepeda motor|oli|ban)\b/, 'kendaraan'],
  [/\b(listrik|token|pln|hemat energi|ac|kulkas)\b/, 'listrik'],
  [/\b(sehat|kesehatan|diet|olahraga|gym|berat badan|imun|jalan kaki|lari|gizi)\b/, 'kesehatan'],
];

/* ------------------------------------------------------------------ */
/* Kesalahan yang sering terjadi (untuk prompt "kesalahan/hindari")      */
/* ------------------------------------------------------------------ */
export const MISTAKES: Record<string, Line[]> = {
  jualan: [
    ['Nggak tahu target pembeli', 'Jualan ke semua orang = nggak ke siapa-siapa.'],
    ['Foto produk gelap & buram', 'Pembeli menilai dari foto pertama.'],
    ['Balas chat terlalu lama', 'Calon pembeli keburu pindah toko.'],
    ['Nggak ada ajakan beli', 'Bilang jelas apa yang harus mereka lakukan.'],
    ['Posting nggak konsisten', 'Akun sepi bikin orang ragu.'],
    ['Asal banting harga', 'Untung tipis bikin bisnis cepat lelah.'],
    ['Nggak mencatat keuangan', 'Uang pribadi dan usaha jadi campur.'],
    ['Mengabaikan testimoni', 'Ulasan pembeli adalah promosi gratis.'],
  ],
  keuangan: [
    ['Nggak punya anggaran', 'Uang habis tanpa tahu ke mana.'],
    ['Menabung dari sisa', 'Sisihkan di awal, bukan di akhir bulan.'],
    ['Tergoda paylater', 'Cicilan kecil-kecil bisa menumpuk.'],
    ['Nggak punya dana darurat', 'Kejadian mendadak jadi bikin utang.'],
    ['Ikut-ikutan investasi', 'Pahami dulu sebelum menaruh uang.'],
    ['Gengsi ikut gaya hidup', 'Hidup sesuai kemampuan, bukan tren.'],
    ['Nggak mencatat pengeluaran', 'Pengeluaran kecil paling sering bocor.'],
    ['Mencampur semua uang', 'Pisahkan kebutuhan, tabungan, dan keinginan.'],
  ],
  konten: [
    ['Hook terlalu lama', '3 detik pertama menentukan orang lanjut nonton.'],
    ['Nggak pakai teks di layar', 'Banyak orang nonton tanpa suara.'],
    ['Asal ikut tren', 'Sesuaikan dengan niche-mu.'],
    ['Posting nggak konsisten', 'Algoritma suka akun yang rajin.'],
    ['Mengabaikan komentar', 'Interaksi bikin konten makin luas.'],
    ['Video terlalu panjang', 'Potong bagian yang tidak penting.'],
    ['Nggak cek insight', 'Data menunjukkan apa yang disukai penonton.'],
    ['Audio kurang jelas', 'Suara bising bikin orang skip.'],
  ],
  belajar: [
    ['Belajar sistem kebut semalam', 'Ingatan jangka pendek cepat hilang.'],
    ['Cuma membaca ulang', 'Latihan soal jauh lebih efektif.'],
    ['Belajar sambil main HP', 'Fokus terpecah, hasil nggak maksimal.'],
    ['Begadang sebelum ujian', 'Otak butuh tidur untuk menyimpan memori.'],
    ['Nggak bikin jadwal', 'Materi menumpuk di akhir.'],
    ['Malu bertanya', 'Bingung yang dibiarkan jadi makin besar.'],
    ['Multitasking', 'Satu materi dalam satu waktu.'],
    ['Melewatkan istirahat', 'Jeda singkat menjaga fokus.'],
  ],
  karier: [
    ['CV terlalu panjang', '1–2 halaman sudah cukup.'],
    ['Satu CV untuk semua lowongan', 'Sesuaikan dengan posisi yang dilamar.'],
    ['Nggak riset perusahaan', 'Pewawancara tahu kalau kamu tidak siap.'],
    ['Email lamaran asal-asalan', 'Tulis subjek dan isi yang rapi.'],
    ['Telat datang interview', 'Kesan pertama sulit diperbaiki.'],
    ['Menjelekkan kantor lama', 'Tetap profesional saat bercerita.'],
    ['Nggak follow-up', 'Kirim terima kasih setelah wawancara.'],
    ['Foto profil kurang profesional', 'Pakai foto yang rapi dan jelas.'],
  ],
  skincare: [
    ['Skip sunscreen', 'Sinar matahari tetap ada walau mendung.'],
    ['Pakai banyak produk sekaligus', 'Kulit bisa iritasi dan sulit tahu penyebabnya.'],
    ['Memencet jerawat', 'Bisa meninggalkan bekas.'],
    ['Gonta-ganti produk', 'Hasil butuh waktu beberapa minggu.'],
    ['Lupa patch test', 'Coba dulu di area kecil.'],
    ['Tidur tanpa cuci muka', 'Kotoran menumpuk semalaman.'],
  ],
  umum: [
    ['Menunda-nunda', 'Mulai sekarang walau kecil.'],
    ['Nggak punya tujuan jelas', 'Tujuan memberi arah setiap langkah.'],
    ['Membandingkan diri terus', 'Fokus pada progresmu sendiri.'],
    ['Takut gagal', 'Gagal adalah bagian dari belajar.'],
    ['Nggak pernah evaluasi', 'Tanpa evaluasi, kesalahan terulang.'],
    ['Mengerjakan semua sendirian', 'Minta bantuan itu wajar.'],
    ['Mengabaikan istirahat', 'Tubuh dan pikiran butuh jeda.'],
    ['Mudah menyerah', 'Hasil besar butuh waktu.'],
  ],
};

/* ------------------------------------------------------------------ */
/* Manfaat kegiatan umum (untuk prompt "manfaat X")                    */
/* ------------------------------------------------------------------ */
export const BENEFITS: Array<{ re: RegExp; lines: Line[] }> = [
  {
    re: /jalan kaki|berjalan/,
    lines: [
      ['Jantung lebih sehat', 'Rutin bergerak membantu menjaga kesehatan jantung.'],
      ['Mood lebih baik', 'Aktivitas fisik membantu meredakan stres.'],
      ['Bantu jaga berat badan', 'Kalori terbakar tanpa alat apa pun.'],
      ['Tidur lebih nyenyak', 'Tubuh yang aktif lebih mudah beristirahat.'],
      ['Otot & sendi lebih kuat', 'Gerakan ringan yang aman untuk banyak orang.'],
      ['Pikiran lebih segar', 'Jalan di luar ruangan bantu menjernihkan kepala.'],
    ],
  },
  {
    re: /air putih|minum air/,
    lines: [
      ['Tubuh tetap terhidrasi', 'Hampir semua fungsi tubuh butuh air.'],
      ['Konsentrasi lebih terjaga', 'Kurang minum bisa bikin cepat lelah.'],
      ['Bantu pencernaan', 'Air membantu proses pencernaan berjalan lancar.'],
      ['Kulit ikut terjaga', 'Hidrasi membantu menjaga kelembapan kulit.'],
      ['Pengganti minuman manis', 'Lebih sehat dan tanpa gula.'],
      ['Bantu kontrol nafsu makan', 'Kadang rasa haus terasa seperti lapar.'],
    ],
  },
  {
    re: /tidur/,
    lines: [
      ['Fokus lebih tajam', 'Otak yang cukup istirahat bekerja lebih baik.'],
      ['Mood lebih stabil', 'Kurang tidur bikin gampang emosi.'],
      ['Daya tahan tubuh terjaga', 'Tubuh memulihkan diri saat tidur.'],
      ['Ingatan lebih kuat', 'Otak menyimpan memori saat tidur.'],
      ['Energi seharian', 'Bangun lebih segar dan siap beraktivitas.'],
      ['Nafsu makan lebih terkontrol', 'Kurang tidur sering memicu ngemil.'],
    ],
  },
  {
    re: /membaca|baca buku/,
    lines: [
      ['Kosakata bertambah', 'Makin banyak membaca, makin kaya bahasa.'],
      ['Fokus lebih terlatih', 'Membaca melatih konsentrasi.'],
      ['Wawasan makin luas', 'Belajar dari pengalaman banyak orang.'],
      ['Bantu meredakan stres', 'Sejenak lepas dari layar dan keramaian.'],
      ['Melatih imajinasi', 'Cerita membuka cara pandang baru.'],
      ['Jadi teman ngobrol yang asyik', 'Banyak bahan cerita yang menarik.'],
    ],
  },
  {
    re: /menabung|nabung|tabungan/,
    lines: [
      ['Siap hadapi keadaan darurat', 'Tidak perlu panik saat ada kebutuhan mendadak.'],
      ['Bisa wujudkan impian', 'Rencana besar jadi lebih mungkin.'],
      ['Hidup lebih tenang', 'Ada pegangan untuk masa depan.'],
      ['Terhindar dari utang', 'Kebutuhan bisa dipenuhi dari uang sendiri.'],
      ['Belajar disiplin', 'Menahan keinginan demi tujuan.'],
      ['Modal untuk investasi', 'Tabungan bisa jadi awal uang bertumbuh.'],
    ],
  },
  {
    re: /olahraga|lari|senam|gym|bersepeda|sepeda/,
    lines: [
      ['Jantung lebih sehat', 'Aktivitas fisik rutin baik untuk jantung.'],
      ['Badan lebih bugar', 'Stamina meningkat untuk aktivitas harian.'],
      ['Mood lebih baik', 'Bergerak membantu meredakan stres.'],
      ['Tidur lebih nyenyak', 'Tubuh yang lelah sehat lebih mudah tidur.'],
      ['Daya tahan tubuh meningkat', 'Tubuh lebih siap melawan penyakit.'],
      ['Lebih percaya diri', 'Merasa lebih baik dengan diri sendiri.'],
    ],
  },
  {
    re: /sarapan/,
    lines: [
      ['Energi untuk memulai hari', 'Tubuh butuh bahan bakar setelah tidur.'],
      ['Konsentrasi lebih baik', 'Perut kenyang, pikiran lebih fokus.'],
      ['Nggak kalap saat makan siang', 'Lapar berlebihan bikin makan berlebihan.'],
      ['Mood lebih stabil', 'Gula darah lebih terjaga.'],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Langkah untuk tugas yang sering diminta                              */
/* ------------------------------------------------------------------ */
export const STEPS: Array<{ re: RegExp; lines: Line[] }> = [
  {
    re: /dalgona/,
    lines: [
      ['Siapkan bahan', 'Kopi instan, gula, dan air panas sama banyak.'],
      ['Kocok sampai kental', 'Pakai mixer atau whisk hingga berbusa kaku.'],
      ['Siapkan susu dingin', 'Isi gelas dengan es batu dan susu.'],
      ['Tuang krim kopinya', 'Letakkan di atas susu, aduk saat diminum.'],
    ],
  },
  {
    re: /kopi susu gula aren|es kopi susu/,
    lines: [
      ['Seduh kopi yang pekat', 'Espresso atau kopi tubruk yang kental.'],
      ['Tuang gula aren cair', 'Taruh di dasar gelas.'],
      ['Tambahkan es & susu', 'Susu segar dingin bikin lebih creamy.'],
      ['Tuang kopi di atasnya', 'Aduk dulu sebelum diminum.'],
    ],
  },
  {
    re: /nasi goreng/,
    lines: [
      ['Siapkan bumbu', 'Bawang merah, bawang putih, dan cabai.'],
      ['Tumis bumbu', 'Pakai sedikit minyak sampai harum.'],
      ['Masukkan telur', 'Orak-arik sebentar bersama bumbu.'],
      ['Tambahkan nasi', 'Aduk rata dengan kecap, garam, dan kaldu.'],
      ['Sajikan hangat', 'Tambah kerupuk & acar biar makin mantap.'],
    ],
  },
  {
    re: /pisang goreng/,
    lines: [
      ['Buat adonan', 'Tepung terigu, sedikit gula, garam, dan air.'],
      ['Celup pisangnya', 'Pilih pisang matang yang masih padat.'],
      ['Goreng sampai keemasan', 'Pakai minyak panas & api sedang.'],
      ['Tiriskan & sajikan', 'Nikmati hangat dengan topping favorit.'],
    ],
  },
  {
    re: /\bcv\b|curriculum vitae|resume/,
    lines: [
      ['Pakai format sederhana', 'Hindari tabel, kolom, dan grafik yang ramai.'],
      ['Tulis data diri yang jelas', 'Nama, kontak, dan kota domisili.'],
      ['Masukkan kata kunci lowongan', 'Ambil dari deskripsi pekerjaan yang dilamar.'],
      ['Tulis pengalaman dengan angka', 'Hasil kerja yang terukur lebih meyakinkan.'],
      ['Cantumkan skill yang relevan', 'Pilih yang sesuai dengan posisi.'],
      ['Simpan dalam PDF', 'Beri nama file yang rapi, mis. CV_NamaKamu.pdf.'],
    ],
  },
  {
    re: /vercel|deploy|hosting web|online-kan website|website/,
    lines: [
      ['Push project ke GitHub', 'Pastikan project bisa di-build di lokal.'],
      ['Masuk ke Vercel', 'Login pakai akun GitHub.'],
      ['Import repository', 'Pilih repo project-mu di dashboard Vercel.'],
      ['Isi environment variable', 'Salin variabel dari file .env kamu.'],
      ['Klik Deploy', 'Vercel build otomatis lalu memberi link.'],
      ['Pasang domain sendiri', 'Opsional, lewat menu Domains.'],
    ],
  },
  {
    re: /tanam|menanam|polybag|bibit|berkebun/,
    lines: [
      ['Siapkan polybag & media tanam', 'Campur tanah, kompos, dan sekam.'],
      ['Semai benih dulu', 'Tunggu bibit punya beberapa helai daun.'],
      ['Pindahkan bibit ke polybag', 'Satu bibit untuk satu polybag.'],
      ['Siram secara rutin', 'Pagi atau sore, jangan sampai becek.'],
      ['Beri pupuk berkala', 'Pupuk organik aman untuk pemula.'],
      ['Rawat sampai panen', 'Cek hama dan cabut gulma secara rutin.'],
    ],
  },
  {
    re: /seduh|manual brew|v60|pour over/,
    lines: [
      ['Panaskan air ±90°C', 'Jangan pakai air yang baru mendidih.'],
      ['Giling kopi ukuran sedang', 'Teksturnya seperti pasir kasar.'],
      ['Bilas kertas filter', 'Supaya rasa kertas hilang.'],
      ['Blooming 30 detik', 'Tuang sedikit air lalu diamkan.'],
      ['Tuang air perlahan melingkar', 'Sampai takaran yang diinginkan.'],
      ['Sajikan', 'Nikmati selagi hangat.'],
    ],
  },
  {
    re: /edit video|capcut|ngedit|mengedit/,
    lines: [
      ['Siapkan klip & musik', 'Kumpulkan semua bahan di satu folder.'],
      ['Potong bagian yang tidak perlu', 'Sisakan momen terbaik saja.'],
      ['Susun urutan cerita', 'Awal yang memancing, isi, lalu penutup.'],
      ['Tambahkan teks & transisi', 'Secukupnya, jangan berlebihan.'],
      ['Sesuaikan dengan ketukan musik', 'Potongan pas di beat terasa lebih hidup.'],
      ['Export kualitas terbaik', 'Pilih resolusi 1080p.'],
    ],
  },
  {
    re: /jualan online|bisnis online|mulai usaha|mulai bisnis|buka usaha/,
    lines: [
      ['Tentukan produk & target pembeli', 'Siapa yang paling butuh produkmu?'],
      ['Hitung modal & harga jual', 'Pastikan ada untung setelah semua biaya.'],
      ['Siapkan foto produk yang menarik', 'Terang, jelas, dan konsisten.'],
      ['Buka akun jualan', 'Marketplace, media sosial, atau WhatsApp Business.'],
      ['Promosikan secara rutin', 'Konten yang konsisten membangun kepercayaan.'],
      ['Layani pembeli dengan cepat', 'Respon cepat bikin pembeli kembali.'],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Fakta populer (yang sudah umum diketahui)                           */
/* ------------------------------------------------------------------ */
export const FACTS: Array<{ re: RegExp; lines: Line[] }> = [
  {
    re: /kucing/,
    lines: [
      ['Kucing tidur 12–16 jam sehari', 'Sebagian besar waktunya dipakai untuk istirahat.'],
      ['Telinganya punya lebih dari 30 otot', 'Makanya bisa berputar ke berbagai arah.'],
      ['Kucing nggak bisa merasakan manis', 'Lidahnya tidak punya reseptor rasa manis.'],
      ['Kumis adalah alat ukur', 'Membantu merasakan lebar celah di sekitarnya.'],
      ['Mengeong lebih sering untuk manusia', 'Kucing dewasa jarang mengeong ke sesama kucing.'],
      ['Mendengkur bukan cuma tanda senang', 'Kucing juga mendengkur untuk menenangkan diri.'],
    ],
  },
  {
    re: /anjing/,
    lines: [
      ['Penciumannya super tajam', 'Jauh lebih peka daripada penciuman manusia.'],
      ['Pola hidungnya unik', 'Berbeda-beda seperti sidik jari.'],
      ['Peka terhadap emosi pemilik', 'Anjing bisa membaca ekspresi wajah.'],
      ['Berkeringat lewat telapak kaki', 'Juga mendinginkan tubuh dengan menjulurkan lidah.'],
      ['Kibasan ekor punya arti', 'Tidak selalu berarti senang.'],
      ['Lahir dalam keadaan belum bisa melihat', 'Matanya terbuka sekitar dua minggu kemudian.'],
    ],
  },
  {
    re: /kopi/,
    lines: [
      ['Berasal dari Ethiopia', 'Legendanya ditemukan oleh penggembala bernama Kaldi.'],
      ['Biji kopi adalah biji buah', 'Buahnya merah saat matang dan disebut ceri kopi.'],
      ['Dua jenis paling populer', 'Arabika dan Robusta.'],
      ['Indonesia produsen kopi besar dunia', 'Termasuk salah satu penghasil terbesar.'],
      ['Kopi luwak asli Indonesia', 'Bijinya melewati pencernaan luwak.'],
      ['Kafein butuh waktu untuk terasa', 'Biasanya mulai terasa 15–45 menit setelah diminum.'],
    ],
  },
  {
    re: /lebah|madu/,
    lines: [
      ['Madu bisa awet sangat lama', 'Kadar airnya rendah sehingga sulit ditumbuhi bakteri.'],
      ['Lebah berkomunikasi lewat tarian', 'Tarian goyang menunjukkan arah sumber bunga.'],
      ['Satu koloni punya satu ratu', 'Ratu lebah bertugas bertelur.'],
      ['Lebah pekerja semuanya betina', 'Lebah jantan tidak punya sengat.'],
      ['Lebah membantu penyerbukan', 'Banyak tanaman pangan bergantung padanya.'],
    ],
  },
  {
    re: /laut|samudra|samudera|lautan/,
    lines: [
      ['Laut menutupi sekitar 71% Bumi', 'Sebagian besar planet kita adalah air.'],
      ['Sebagian besar laut belum dijelajahi', 'Dasar laut dalam masih menyimpan banyak misteri.'],
      ['Penghasil oksigen penting', 'Fitoplankton menghasilkan sekitar separuh oksigen Bumi.'],
      ['Titik terdalam: Palung Mariana', 'Kedalamannya hampir 11 kilometer.'],
      ['Indonesia negara kepulauan terbesar', 'Punya lebih dari 17.000 pulau.'],
    ],
  },
  {
    re: /bulan|luar angkasa|antariksa|planet|matahari|bintang/,
    lines: [
      ['Bulan pelan-pelan menjauh', 'Sekitar 3,8 cm setiap tahun.'],
      ['Kita selalu melihat sisi yang sama', 'Hanya satu sisi Bulan yang tampak dari Bumi.'],
      ['Matahari adalah bintang', 'Bintang yang paling dekat dengan Bumi.'],
      ['Cahaya Matahari butuh ±8 menit', 'Untuk sampai ke Bumi.'],
      ['Luar angkasa itu sunyi', 'Bunyi butuh udara untuk merambat.'],
      ['Sehari di Venus lebih lama dari setahunnya', 'Venus berputar sangat lambat.'],
    ],
  },
  {
    re: /otak|tubuh manusia|tubuh kita|jantung|tulang/,
    lines: [
      ['Otak memakai banyak energi', 'Sekitar 20% energi tubuh, padahal beratnya ±2%.'],
      ['Jantung berdetak ±100.000 kali sehari', 'Tanpa pernah istirahat.'],
      ['Tulang terkecil ada di telinga', 'Namanya tulang sanggurdi (stapes).'],
      ['Tulang orang dewasa berjumlah 206', 'Bayi lahir dengan lebih banyak tulang yang lalu menyatu.'],
      ['Kuku tangan tumbuh lebih cepat', 'Dibanding kuku kaki.'],
      ['Kita berkedip ribuan kali sehari', 'Untuk menjaga mata tetap lembap.'],
    ],
  },
  {
    re: /indonesia|nusantara/,
    lines: [
      ['Lebih dari 17.000 pulau', 'Negara kepulauan terbesar di dunia.'],
      ['Ratusan bahasa daerah', 'Lebih dari 700 bahasa daerah masih dipakai.'],
      ['Rumah komodo', 'Hidup liar di Nusa Tenggara Timur.'],
      ['Punya Candi Borobudur', 'Candi Buddha terbesar di dunia.'],
      ['Dilewati garis khatulistiwa', 'Wilayahnya beriklim tropis.'],
      ['Penduduk terbanyak ke-4 dunia', 'Termasuk empat besar dunia.'],
    ],
  },
  {
    re: /cokelat|coklat|kakao/,
    lines: [
      ['Cokelat dibuat dari biji kakao', 'Biji kakao difermentasi, dikeringkan, lalu disangrai.'],
      ['Kakao tumbuh di daerah tropis', 'Termasuk di Indonesia.'],
      ['Indonesia penghasil kakao besar', 'Termasuk produsen utama dunia.'],
      ['Berbahaya untuk anjing & kucing', 'Kandungan teobromin beracun bagi mereka.'],
      ['Cokelat putih tanpa kakao padat', 'Bahannya mentega kakao, gula, dan susu.'],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tempat wisata terkenal                                                */
/* ------------------------------------------------------------------ */
/** Kuliner khas per kota (nama hidangan, bukan nama tempat makan). */
export const CITY_FOODS: Record<string, Line[]> = {
  Jogja: [['Gudeg', 'Nangka muda dimasak santan & gula jawa.'], ['Sate klathak', 'Sate kambing bertusuk jeruji besi.'], ['Bakpia', 'Oleh-oleh legendaris isi kacang hijau.'], ['Kopi joss', 'Kopi hitam dengan arang membara.'], ['Mie lethek', 'Mie singkong khas Bantul.']],
  Bandung: [['Batagor', 'Bakso tahu goreng dengan saus kacang.'], ['Surabi', 'Serabi hangat dengan aneka topping.'], ['Seblak', 'Kerupuk basah pedas yang bikin nagih.'], ['Mie kocok', 'Mie kuah kaldu sapi dengan kikil.'], ['Cireng', 'Aci goreng renyah dengan bumbu rujak.']],
  Bali: [['Ayam betutu', 'Ayam berbumbu rempah yang dimasak lama.'], ['Sate lilit', 'Daging cincang dililit di batang serai.'], ['Nasi jinggo', 'Nasi bungkus porsi kecil yang bersahabat.'], ['Sambal matah', 'Sambal iris segar khas Bali.'], ['Pie susu', 'Oleh-oleh manis yang populer.']],
  Jakarta: [['Kerak telor', 'Jajanan Betawi dari ketan & telur.'], ['Soto Betawi', 'Soto berkuah santan & susu.'], ['Ketoprak', 'Tahu, lontong, & bihun bersaus kacang.'], ['Nasi uduk', 'Nasi gurih santan untuk sarapan.'], ['Gado-gado', 'Sayuran rebus dengan bumbu kacang.']],
  Malang: [['Bakso Malang', 'Bakso dengan aneka gorengan & siomay.'], ['Rawon', 'Sup daging berkuah hitam dari kluwek.'], ['Cwie mie', 'Mie dengan ayam cincang & pangsit.'], ['Tahu telor', 'Tahu & telur dadar bersiram petis.'], ['Keripik tempe', 'Oleh-oleh renyah khas Malang.']],
  Semarang: [['Lumpia', 'Isi rebung, telur, & udang.'], ['Tahu gimbal', 'Tahu & bakwan udang bersaus kacang.'], ['Bandeng presto', 'Bandeng empuk sampai ke durinya.'], ['Wingko babat', 'Kue kelapa yang legit.'], ['Soto Semarang', 'Soto bening yang segar.']],
  Lombok: [['Ayam taliwang', 'Ayam bakar pedas khas Lombok.'], ['Plecing kangkung', 'Kangkung segar dengan sambal tomat.'], ['Sate rembiga', 'Sate sapi manis pedas.'], ['Nasi balap puyung', 'Nasi dengan ayam suwir pedas.'], ['Bebalung', 'Sup iga sapi berbumbu.']],
  Bogor: [['Toge goreng', 'Tauge, mie, & oncom bersaus tauco.'], ['Soto mie', 'Soto dengan mie & risol.'], ['Asinan Bogor', 'Buah & sayur berkuah asam pedas.'], ['Laksa Bogor', 'Kuah santan kuning dengan oncom.'], ['Roti unyil', 'Roti mungil aneka isi.']],
  'Danau Toba': [['Arsik ikan mas', 'Ikan mas berbumbu andaliman.'], ['Mie gomak', 'Mie lidi khas Batak.'], ['Ombus-ombus', 'Kue tepung beras isi gula merah.']],
};

export const PLACES: Array<{ re: RegExp; name: string; lines: Line[] }> = [
  {
    re: /\bbali\b/,
    name: 'Bali',
    lines: [
      ['Tanah Lot', 'Pura di atas batu karang, cantik saat matahari terbenam.'],
      ['Ubud', 'Sawah terasering, seni, dan suasana tenang.'],
      ['Uluwatu', 'Pura di tebing dan tari Kecak saat senja.'],
      ['Nusa Penida', 'Pantai Kelingking yang ikonik.'],
      ['Pantai Melasti', 'Tebing kapur dan air laut biru jernih.'],
      ['Kintamani', 'Pemandangan Gunung & Danau Batur.'],
    ],
  },
  {
    re: /\b(jogja|yogya|yogyakarta|jogjakarta)\b/,
    name: 'Jogja',
    lines: [
      ['Candi Prambanan', 'Kompleks candi Hindu yang megah.'],
      ['Malioboro', 'Belanja oleh-oleh dan kuliner malam.'],
      ['Keraton Yogyakarta', 'Istana dan pusat budaya Jawa.'],
      ['Taman Sari', 'Bekas taman istana yang estetik.'],
      ['Tebing Breksi', 'Bekas tambang batu yang jadi spot foto.'],
      ['Pantai Parangtritis', 'Pantai legendaris di selatan Jogja.'],
    ],
  },
  {
    re: /\bbandung\b/,
    name: 'Bandung',
    lines: [
      ['Kawah Putih', 'Danau kawah berwarna hijau toska.'],
      ['Tangkuban Perahu', 'Gunung dengan kawah yang bisa dilihat dari dekat.'],
      ['Lembang', 'Udara sejuk dan banyak wisata keluarga.'],
      ['Jalan Braga', 'Bangunan klasik dan kafe estetik.'],
      ['Dago', 'Kuliner dan pemandangan kota dari atas.'],
      ['Orchid Forest Cikole', 'Hutan pinus dengan taman anggrek.'],
    ],
  },
  {
    re: /\blombok\b/,
    name: 'Lombok',
    lines: [
      ['Gili Trawangan', 'Pulau kecil tanpa kendaraan bermotor.'],
      ['Pantai Kuta Mandalika', 'Pasir putih dekat Sirkuit Mandalika.'],
      ['Bukit Merese', 'Padang rumput dengan pemandangan laut.'],
      ['Air Terjun Tiu Kelep', 'Air terjun sejuk di kaki Rinjani.'],
      ['Desa Sade', 'Kampung adat suku Sasak.'],
      ['Pink Beach', 'Pantai dengan pasir kemerahan.'],
    ],
  },
  {
    re: /\b(malang|batu)\b/,
    name: 'Malang',
    lines: [
      ['Gunung Bromo', 'Matahari terbit di atas lautan pasir.'],
      ['Jatim Park', 'Taman rekreasi keluarga di Kota Batu.'],
      ['Museum Angkut', 'Koleksi kendaraan dari berbagai era.'],
      ['Kampung Warna-Warni Jodipan', 'Kampung penuh warna untuk foto.'],
      ['Coban Rondo', 'Air terjun sejuk di Batu.'],
      ['Alun-Alun Kota Batu', 'Kuliner dan suasana malam yang hangat.'],
    ],
  },
  {
    re: /labuan bajo|komodo/,
    name: 'Labuan Bajo',
    lines: [
      ['Pulau Komodo', 'Melihat komodo di habitat aslinya.'],
      ['Pulau Padar', 'Bukit dengan tiga teluk yang ikonik.'],
      ['Pantai Pink', 'Pasir merah muda yang langka.'],
      ['Taka Makassar', 'Gundukan pasir di tengah laut.'],
      ['Gua Batu Cermin', 'Gua dengan pantulan cahaya alami.'],
      ['Bukit Sylvia', 'Spot matahari terbenam di daratan.'],
    ],
  },
  {
    re: /\bjakarta\b/,
    name: 'Jakarta',
    lines: [
      ['Monas', 'Ikon Jakarta dengan pemandangan dari puncak.'],
      ['Kota Tua', 'Bangunan kolonial dan museum.'],
      ['Taman Mini Indonesia Indah', 'Budaya Nusantara dalam satu tempat.'],
      ['Ancol', 'Pantai dan taman rekreasi.'],
      ['Kepulauan Seribu', 'Pulau dekat Jakarta untuk snorkeling.'],
      ['Museum Nasional', 'Koleksi sejarah dan budaya Indonesia.'],
    ],
  },
  {
    re: /danau toba|samosir|\bmedan\b|sumatera utara/,
    name: 'Danau Toba',
    lines: [
      ['Danau Toba', 'Danau vulkanik terbesar di Indonesia.'],
      ['Pulau Samosir', 'Pulau di tengah Danau Toba.'],
      ['Air Terjun Sipiso-piso', 'Air terjun tinggi dengan view danau.'],
      ['Bukit Holbung', 'Bukit hijau untuk menikmati Danau Toba.'],
      ['Desa Tomok', 'Makam raja dan budaya Batak.'],
      ['Berastagi', 'Udara sejuk dan pasar buah.'],
    ],
  },
  {
    re: /raja ampat/,
    name: 'Raja Ampat',
    lines: [
      ['Piaynemo', 'Gugusan pulau karst yang ikonik.'],
      ['Wayag', 'Pemandangan pulau-pulau dari puncak bukit.'],
      ['Pasir Timbul', 'Pulau pasir yang muncul saat surut.'],
      ['Arborek', 'Desa wisata dengan spot snorkeling.'],
      ['Kali Biru', 'Sungai biru jernih di tengah hutan.'],
      ['Teluk Kabui', 'Teluk tenang di antara tebing karst.'],
    ],
  },
  {
    re: /\b(bogor|puncak)\b/,
    name: 'Bogor',
    lines: [
      ['Kebun Raya Bogor', 'Kebun botani bersejarah di tengah kota.'],
      ['Taman Safari Indonesia', 'Melihat satwa dari dekat di Cisarua.'],
      ['Curug Leuwi Hejo', 'Air hijau jernih di antara bebatuan.'],
      ['Gunung Pancar', 'Hutan pinus dan pemandian air panas.'],
      ['Kebun Teh Gunung Mas', 'Hamparan kebun teh yang sejuk.'],
    ],
  },
  {
    re: /banyuwangi|kawah ijen|\bijen\b/,
    name: 'Banyuwangi',
    lines: [
      ['Kawah Ijen', 'Fenomena api biru saat dini hari.'],
      ['Pantai Pulau Merah', 'Pantai dengan bukit kecil kemerahan.'],
      ['De Djawatan', 'Hutan trembesi yang magis.'],
      ['Teluk Hijau', 'Air laut hijau toska yang tenang.'],
      ['Taman Nasional Baluran', 'Savana yang dijuluki Afrika van Java.'],
    ],
  },
  {
    re: /\bsemarang\b/,
    name: 'Semarang',
    lines: [
      ['Lawang Sewu', 'Gedung bersejarah dengan banyak pintu.'],
      ['Kota Lama Semarang', 'Bangunan kolonial yang fotogenik.'],
      ['Sam Poo Kong', 'Kelenteng bersejarah dengan arsitektur Tionghoa.'],
      ['Masjid Agung Jawa Tengah', 'Payung raksasa yang bisa terbuka.'],
      ['Pagoda Avalokitesvara', 'Pagoda tujuh tingkat yang megah.'],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Kutipan orisinal per tema                                            */
/* ------------------------------------------------------------------ */
export const QUOTES: Record<string, string[]> = {
  islami: [
    'Sesungguhnya bersama kesulitan ada kemudahan. (QS. Al-Insyirah: 6)',
    'Allah tidak membebani seseorang melainkan sesuai kesanggupannya. (QS. Al-Baqarah: 286)',
    'Jadikan sabar dan salat sebagai penolongmu. (QS. Al-Baqarah: 45)',
    'Doa yang belum terkabul bukan berarti ditolak.',
    'Libatkan Allah dalam setiap langkahmu.',
    'Yang ditakdirkan untukmu tidak akan tertukar.',
  ],
  senja: [
    'Senja mengajarkan bahwa yang indah tak harus selamanya.',
    'Langit sore selalu tahu cara menenangkan.',
    'Terima kasih, hari ini. Sampai jumpa besok.',
    'Pulang membawa cerita dan cahaya senja.',
    'Tenang seperti senja, hangat seperti cahayanya.',
  ],
  motivasi: [
    'Pelan-pelan saja, yang penting tidak berhenti.',
    'Kamu tidak harus hebat untuk memulai, tapi harus memulai untuk jadi hebat.',
    'Lelah boleh, menyerah jangan.',
    'Proses tidak pernah mengkhianati hasil.',
    'Hari ini berat, tapi kamu lebih kuat.',
    'Mimpi besar dimulai dari langkah kecil hari ini.',
    'Jangan bandingkan bab satu kamu dengan bab dua puluh orang lain.',
    'Disiplin adalah jembatan antara tujuan dan pencapaian.',
  ],
  kerja: [
    'Capekmu hari ini adalah investasi untuk dirimu besok.',
    'Istirahat bukan berarti menyerah, kamu cuma sedang mengisi ulang tenaga.',
    'Kerja keras yang sunyi suatu saat akan bersuara.',
    'Hari yang berat akan selesai juga. Kamu hebat sudah bertahan.',
    'Ingat lagi alasan kamu memulai.',
    'Nggak apa-apa pelan, asal terus melangkah.',
  ],
  sabar: [
    'Sabar itu bukan diam, tapi tetap berjalan sambil menunggu waktu yang tepat.',
    'Yang ditanam dengan sabar akan dipanen dengan bahagia.',
    'Setiap hal baik butuh waktu untuk tumbuh.',
    'Tenang, semua ada waktunya.',
    'Kesabaran hari ini adalah ketenangan esok hari.',
    'Bunga tidak mekar dalam semalam.',
  ],
  syukur: [
    'Bersyukur membuat yang sedikit terasa cukup.',
    'Ikhlas itu melepaskan tanpa harus menjelaskan.',
    'Hidup terasa ringan saat hati mau menerima.',
    'Syukuri yang ada, perjuangkan yang belum.',
    'Tidak semua yang hilang adalah kerugian.',
    'Cukup itu bukan soal jumlah, tapi soal rasa.',
  ],
  sukses: [
    'Sukses adalah kumpulan usaha kecil yang diulang setiap hari.',
    'Jangan berhenti hanya karena hasilnya belum terlihat.',
    'Orang sukses juga pernah gagal, bedanya mereka tidak berhenti.',
    'Fokus pada proses, hasil akan mengikuti.',
    'Disiplin hari ini, bangga di kemudian hari.',
    'Mimpi tanpa aksi hanya akan jadi angan.',
  ],
  belajar: [
    'Skripsi yang baik adalah skripsi yang selesai.',
    'Satu paragraf hari ini tetap lebih baik dari nol.',
    'Revisi bukan tanda gagal, tapi tanda kamu sedang menuju selesai.',
    'Pelan-pelan, bab demi bab pasti selesai.',
    'Ilmu yang kamu kejar hari ini akan menjagamu nanti.',
    'Toga sudah menunggu, jangan berhenti sekarang.',
  ],
  bangkit: [
    'Gagal itu guru, bukan akhir cerita.',
    'Jatuh boleh, tapi jangan lupa bangkit.',
    'Setiap kegagalan memberi satu pelajaran baru.',
    'Kamu belum kalah selama masih mau mencoba.',
    'Bangkit pelan-pelan juga tetap bangkit.',
    'Hari buruk bukan berarti hidup yang buruk.',
  ],
  pagi: [
    'Selamat pagi, hari baru kesempatan baru.',
    'Mulai hari dengan niat baik dan senyuman.',
    'Pagi ini, mari jadi sedikit lebih baik dari kemarin.',
    'Bangun, bersyukur, lalu berjuang lagi.',
    'Secangkir semangat untuk memulai hari.',
    'Matahari terbit lagi, begitu juga harapanmu.',
  ],
  keluarga: [
    'Ibu, doamu adalah alasan langkahku sejauh ini.',
    'Rumah terbaik adalah pelukan keluarga.',
    'Terima kasih untuk cinta yang tak pernah meminta kembali.',
    'Sejauh apa pun pergi, keluarga tetap tempat pulang.',
    'Kasih ibu tak pernah ada habisnya.',
    'Bahagia itu sederhana: makan bersama keluarga.',
  ],
  sahabat: [
    'Sahabat adalah keluarga yang kita pilih sendiri.',
    'Teman sejati tetap ada saat kamu tidak sedang bersinar.',
    'Terima kasih sudah jadi tempat cerita.',
    'Tertawa bersamamu selalu jadi obat.',
    'Jarak tidak mengubah arti persahabatan.',
    'Sahabat itu yang tahu kamu sedang tidak baik-baik saja.',
  ],
  cinta: [
    'Cinta itu tentang tetap memilih orang yang sama setiap hari.',
    'Bersamamu, hal sederhana terasa istimewa.',
    'Yang tepat akan datang di waktu yang tepat.',
    'Cinta yang baik membuatmu tumbuh, bukan layu.',
    'Kamu alasan aku tersenyum hari ini.',
    'Saling menjaga, saling menguatkan.',
  ],
  galau: [
    'Ternyata yang paling sulit itu pura-pura baik-baik saja.',
    'Aku tidak marah, aku cuma capek berharap.',
    'Ada rindu yang tidak bisa diucapkan, hanya bisa dipendam.',
    'Kadang yang pergi bukan berarti tidak sayang.',
    'Pelan-pelan, hati juga butuh waktu untuk sembuh.',
    'Malam selalu lebih jujur soal perasaan.',
    'Kita pernah sedekat itu, lalu jadi asing.',
    'Tidak apa-apa menangis, besok kita coba lagi.',
  ],
  rindu: [
    'Rindu ini tidak tahu jalan pulang.',
    'Ada nama yang masih kusebut dalam diam.',
    'Jarak mengajarkan arti menunggu.',
    'Kangen itu berat kalau cuma bisa dipendam.',
    'Semoga kamu baik-baik saja di sana.',
    'Rindu paling sepi adalah rindu yang tidak bisa dikirim.',
  ],
  moveon: [
    'Melepaskan juga bentuk mencintai diri sendiri.',
    'Yang sudah selesai biarlah jadi pelajaran.',
    'Move on bukan melupakan, tapi berdamai.',
    'Kamu pantas bahagia, meski bukan dengannya.',
    'Pintu yang tertutup memberi ruang untuk yang baru.',
    'Tidak semua yang datang ditakdirkan menetap.',
  ],
  malam: [
    'Tidak semua yang kamu pikirkan malam ini benar adanya.',
    'Istirahatlah, besok kita pikirkan lagi.',
    'Malam ini, izinkan dirimu beristirahat.',
    'Pikiranmu lelah, bukan hidupmu yang gagal.',
    'Overthinking hanya mencuri tenangmu malam ini.',
    'Peluk dirimu, kamu sudah berusaha.',
  ],
  rezeki: [
    'Rezeki tidak akan tertukar.',
    'Kerja keras dan doa adalah pasangan terbaik.',
    'Rezeki terbaik datang dari jalan yang baik.',
    'Sedikit demi sedikit, lama-lama menjadi bukit.',
    'Hemat pangkal kaya.',
    'Yang penting berkah, bukan sekadar banyak.',
  ],
};

/** Tema kutipan dari kata di prompt (urutan = prioritas). */
export const QUOTE_THEMES: Array<[RegExp, string]> = [
  [/\b(islami|islam|muslim|hijrah|dakwah|allah|doa|sholat|shalat|ngaji|jumat berkah|tawakal|istiqomah)\b/, 'islami'],
  [/\b(sunset|senja|matahari terbenam|langit sore|golden hour)\b/, 'senja'],
  [/\b(mantan|move ?on|putus|ditinggal|pergi)\b/, 'moveon'],
  [/\b(kangen|rindu|ldr|jarak jauh)\b/, 'rindu'],
  [/\b(overthinking|malam|insomnia|nggak bisa tidur)\b/, 'malam'],
  [/\b(galau|sedih|patah hati|kecewa|nangis|sendiri|baper)\b/, 'galau'],
  [/\b(skripsi|mahasiswa|kuliah|belajar|ujian|wisuda|sekolah|pns|cpns|tes|seleksi|utbk|snbt|beasiswa)\b/, 'belajar'],
  [/\b(capek kerja|lelah kerja|kerja|kantor|lembur|karyawan)\b/, 'kerja'],
  [/\b(sabar|kesabaran|menunggu)\b/, 'sabar'],
  [/\b(syukur|bersyukur|ikhlas|keikhlasan|cukup)\b/, 'syukur'],
  [/\b(gagal|kegagalan|bangkit|jatuh|terpuruk)\b/, 'bangkit'],
  [/\b(sukses|kesuksesan|berhasil|mimpi|cita-cita|target)\b/, 'sukses'],
  [/\b(pagi|subuh|bangun tidur)\b/, 'pagi'],
  [/\b(ibu|ayah|bapak|orang tua|keluarga|mama|papa)\b/, 'keluarga'],
  [/\b(sahabat|teman|persahabatan|bestie|bestfriend)\b/, 'sahabat'],
  [/\b(cinta|sayang|pasangan|pacar|suami|istri|romantis)\b/, 'cinta'],
  [/\b(rezeki|rejeki|uang|cuan|kaya|berkah)\b/, 'rezeki'],
];

/* ------------------------------------------------------------------ */
/* Ucapan hari besar                                                     */
/* ------------------------------------------------------------------ */
export interface Occasion {
  re: RegExp;
  title: string; // {tahun}, {ke}, {nama} diisi bila ada
  messages: string[];
  hijri?: boolean;
}
export const OCCASIONS: Occasion[] = [
  { re: /idul ?fitri|lebaran|hari raya(?! idul adha)/, title: 'Selamat Hari Raya Idul Fitri{tahun}', messages: ['Mohon maaf lahir dan batin.', 'Semoga kita kembali fitri dan penuh berkah.', 'Taqabbalallahu minna wa minkum.'], hijri: true },
  { re: /idul ?adha|qurban|kurban/, title: 'Selamat Hari Raya Idul Adha{tahun}', messages: ['Semoga pengorbanan kita membawa keberkahan.', 'Mari berbagi kebahagiaan bersama.'], hijri: true },
  { re: /ramadh?an|puasa/, title: 'Selamat Menunaikan Ibadah Puasa Ramadan{tahun}', messages: ['Semoga Ramadan kali ini penuh berkah dan ampunan.', 'Semoga ibadah kita diterima.'], hijri: true },
  { re: /natal|christmas/, title: 'Selamat Hari Natal', messages: ['Damai Natal untuk kita semua.', 'Semoga sukacita Natal menyertai keluargamu.'] },
  { re: /tahun baru(?! imlek)|new year/, title: 'Selamat Tahun Baru{tahun}', messages: ['Semoga tahun ini membawa harapan baru.', 'Terima kasih untuk tahun yang luar biasa.'] },
  { re: /imlek|chinese new year|gong xi/, title: 'Selamat Tahun Baru Imlek', messages: ['Gong Xi Fa Cai!', 'Semoga rezeki dan kebahagiaan melimpah.'] },
  { re: /kemerdekaan|merdeka|17 agustus|hut ri|dirgahayu/, title: 'Dirgahayu Republik Indonesia{ke}', messages: ['Merdeka!', 'Mari isi kemerdekaan dengan karya.'] },
  { re: /hari ibu/, title: 'Selamat Hari Ibu', messages: ['Terima kasih, Ibu, atas segalanya.', 'Kasih ibu sepanjang masa.'] },
  { re: /hari guru/, title: 'Selamat Hari Guru', messages: ['Terima kasih atas ilmu dan kesabaranmu.', 'Jasamu abadi di setiap langkah kami.'] },
  { re: /kartini/, title: 'Selamat Hari Kartini', messages: ['Habis gelap terbitlah terang.', 'Perempuan hebat, Indonesia kuat.'] },
  { re: /hari pahlawan/, title: 'Selamat Hari Pahlawan', messages: ['Terima kasih para pahlawan bangsa.', 'Mari teruskan perjuangan dengan karya.'] },
  { re: /sumpah pemuda/, title: 'Selamat Hari Sumpah Pemuda', messages: ['Satu nusa, satu bangsa, satu bahasa.', 'Pemuda bersatu, Indonesia maju.'] },
  { re: /wisuda|graduation/, title: 'Selamat Wisuda{nama}', messages: ['Akhir dari satu perjalanan, awal dari yang baru.', 'Bangga atas kerja kerasmu.'] },
  { re: /pernikahan|menikah|nikahan|wedding|happy wedding/, title: 'Selamat Menempuh Hidup Baru{nama}', messages: ['Semoga menjadi keluarga yang sakinah, mawadah, warahmah.', 'Bahagia selalu untuk kalian berdua.'] },
  { re: /ulang tahun|ultah|ulangtahun|anniversary|milad|hut\b|birthday/, title: 'Selamat Ulang Tahun{ke}{nama}', messages: ['Semoga makin sukses dan bahagia.', 'Terima kasih sudah tumbuh bersama kami.'] },
];

/* ------------------------------------------------------------------ */
/* Kalimat pembuka (hook) & ajakan (CTA) per jenis                       */
/* {produk} {harga} {hargaPas} {hargaMulai} {diskon} {kampanye} {toko} {n} {topik} {kota} {acara} {posisi}     */
/* {durasi} {target}. {?x} = wajib ada tetapi tidak dicetak.                                         */
/* ------------------------------------------------------------------ */
export const HOOKS: Record<string, string[]> = {
  promo: [
    '{produk} cuma {hargaPas}? Serius!',
    'Segini aja? {produk} cuma {hargaPas}',
    '{produk} harganya {hargaPas} aja!',
    '{produk} mulai {hargaMulai} aja!',
    'Harga mulai {hargaMulai} buat {produk}!',
    'Diskon {diskon} buat {produk}!',
    '{produk} lagi diskon {diskon}!',
    'Hemat {diskon} buat {produk}, yuk!',
    '{kampanye}! Diskon {diskon} untuk {produk}',
    'Stop scroll! Ada promo {produk} nih',
    'Jangan beli {produk} sebelum lihat ini',
    'Promo {produk} paling worth it minggu ini',
    'Yang belum coba {produk}, rugi banget',
    'Lagi cari {produk}? Ini dia',
  ],
  jasa: [
    'Butuh {produk}? Serahkan ke kami',
    '{produk} mulai {hargaMulai} aja!',
    '{produk} cuma {hargaPas}!',
    'Nggak perlu ribet, ada {produk}',
    'Lagi cari {produk} yang beres? Ini dia',
  ],
  'flash-sale': [
    'FLASH SALE! {produk} cuma {hargaPas}',
    'FLASH SALE {kampanye}! Diskon {diskon}',
    'Buruan! {produk} diskon {diskon}',
    'Diskon {diskon}, cuma {durasi}!',
    'Detik-detik terakhir promo {produk}',
    'Harga {produk} lagi jatuh!',
  ],
  properti: ['{jual}! {produk} di {lokasi}', '{jual}: {produk}, {hargaPas}', '{jual}! {produk}'],
  kuliner: [
    'Lapar? {produk} siap bikin nagih',
    'Menu andalan {toko} yang wajib dicoba',
    'Rasanya bikin balik lagi: {produk}',
    'Ngiler lihat menu {toko}?',
    'Kuliner yang wajib kamu coba minggu ini',
  ],
  launching: ['Akhirnya rilis: {produk}!', 'Kenalan sama {produk} yang baru', 'Yang kamu tunggu sudah datang: {produk}', 'Ada yang baru dari {toko}!'],
  opening: ['Grand opening {produk}!', '{produk} resmi dibuka!', 'Akhirnya buka juga: {produk}'],
  event: ['Catat tanggalnya! {acara}{?tgl}', 'Jangan sampai ketinggalan {acara}', '{acara} segera dimulai!{?tgl}', 'Ikutan {acara}, yuk!'],
  undangan: ['Kamu diundang ke {acara}', 'Save the date: {acara}', 'Dengan bahagia kami mengundangmu'],
  tips: ['{n} tips {topik}', '{n} tips {topik} yang jarang orang tahu', 'Simpan dulu: {n} tips {topik}', 'Biar {target}, lakukan ini'],
  kesalahan: ['{n} kesalahan {topik}', 'Jangan lakukan ini: {topik}', 'Sering nggak sadar: {n} kesalahan {topik}'],
  waspada: ['Waspada {topik}! Ini {n} hal penting', 'Jangan sampai jadi korban {topik}', '{n} hal soal {topik} yang wajib kamu tahu'],
  manfaat: ['{n} manfaat {topik}', 'Rutin {topik}? Ini manfaatnya', 'Ternyata {topik} punya manfaat ini'],
  tutorial: ['Cara {topik} dalam {n} langkah', 'Tutorial {topik} anti ribet', 'Ikuti {n} langkah ini: {topik}', 'Gampang! Cara {topik}'],
  resep: ['Resep {topik} anti gagal', 'Cara bikin {topik} di rumah', 'Bikin {topik} cuma {n} langkah'],
  fakta: ['{n} fakta {topik} yang bikin kaget', 'Tahukah kamu? Fakta seputar {topik}', 'Fakta unik {topik} yang jarang dibahas'],
  travel: ['{n} tempat wajib di {kota}', 'Liburan ke {kota}? Simpan ini', 'Hidden gem {kota} yang wajib dikunjungi'],
  itinerary: ['Itinerary {kota} {durasi}', 'Liburan hemat ke {kota} {durasi}{?hemat}', 'Rencana liburan {kota} {durasi}', 'Liburan ke {kota} {durasi}, ini rutenya'],
  kulinerKota: ['{n} kuliner wajib di {kota}', 'Ke {kota}? Wajib cobain ini', 'Kuliner khas {kota} yang bikin kangen'],
  testimoni: ['Kata mereka setelah coba {produk}', 'Review jujur pelanggan {toko}', 'Bukan kata kami, kata pelanggan'],
  'before-after': ['Sebelum vs sesudah: {produk}', 'Perubahannya nyata banget!', 'Lihat bedanya setelah {durasi}'],
  lowongan: ['Kami mencari {posisi}!', 'Lowongan kerja: {posisi}', 'Mau gabung tim {toko}?', 'Dibutuhkan segera: {posisi}{?segera}', '{toko} mencari {posisi}!'],
  pengumuman: ['Pengumuman penting!', 'Info terbaru dari {toko}', 'Mohon perhatian, ada info penting'],
  cerita: ['Aku nggak nyangka ini terjadi', 'Ini kisah {topik}', 'Dulu aku pikir ini mustahil', 'Cerita singkat: {topik}'],
};

export const CTAS: Record<string, string[]> = {
  promo: ['Pesan sekarang, yuk!', 'Klik link di bio & checkout', 'DM sekarang untuk order!', 'Checkout sekarang, yuk!'],
  'promo-jasa': ['Booking sekarang, yuk!', 'Chat kami untuk konsultasi', 'Pesan jadwalmu sekarang!'],
  'promo-jasaOrder': ['Order sekarang, yuk!', 'Konsultasi dulu, yuk!', 'Chat kami sekarang, yuk!'],
  'promo-kelas': ['Daftar sekarang, yuk!', 'Amankan kursimu sekarang!', 'Yuk, gabung kelasnya!'],
  'promo-sewa': ['Booking sekarang, yuk!', 'Chat kami untuk cek jadwal', 'Amankan jadwal sewamu!'],
  'promo-properti': ['Hubungi kami untuk survei lokasi', 'Minat? Langsung hubungi kami', 'Jadwalkan survei sekarang!'],
  'promo-travel': ['Amankan kursimu sekarang!', 'Daftar sekarang, yuk!', 'Konsultasikan rencanamu dengan kami'],
  'promo-kuliner': ['Pesan sekarang, yuk!', 'Order sekarang, yuk!', 'Cobain sekarang, yuk!'],
  'promo-tempat': ['Mampir & cobain, yuk!', 'Ajak temanmu ke sini!', 'Ditunggu kedatanganmu!'],
  edukasi: ['Simpan & bagikan ke temanmu!', 'Follow untuk tips berikutnya', 'Tulis pengalamanmu di komentar', 'Share ke yang butuh ini!'],
  quote: ['Kirim ke seseorang yang butuh ini', 'Follow untuk kata-kata harian', 'Simpan buat pengingat diri', 'Tag temanmu di kolom komentar'],
  event: ['Daftar sekarang, yuk!', 'Amankan tempatmu hari ini', 'Klik link di bio untuk daftar'],
  eventPublik: ['Ajak teman & keluarga, ya!', 'Sampai jumpa di sana!', 'Jangan sampai ketinggalan!'],
  launching: ['Coba sekarang, link di bio!', 'Jadi yang pertama mencoba!', 'Download sekarang, yuk!'],
  launchingProduk: ['Cobain sekarang, yuk!', 'Jadi yang pertama mencoba!', 'Order sekarang, yuk!'],
  opening: ['Datang & ajak temanmu!', 'Ditunggu kedatanganmu!', 'Sampai jumpa di sana!'],
  undangan: ['Kami tunggu kehadiranmu', 'Mohon doa restunya', 'Sampai jumpa di hari bahagia kami'],
  lowongan: ['Kirim CV kamu sekarang!', 'Daftar lewat link di bio', 'Tag temanmu yang cocok!'],
  pengumuman: ['Terima kasih atas perhatiannya', 'Mohon maaf atas ketidaknyamanannya', 'Simpan info ini ya'],
};

/* ------------------------------------------------------------------ */
/* Kualifikasi umum per posisi (lowongan tanpa syarat di prompt)        */
/* ------------------------------------------------------------------ */
export const ROLE_QUALS: Array<{ re: RegExp; lines: string[] }> = [
  { re: /barista/, lines: ['Suka kopi & mau belajar', 'Ramah & komunikatif', 'Bisa kerja dalam tim'] },
  { re: /kurir|driver|sopir|supir|ojek/, lines: ['Punya kendaraan & SIM aktif', 'Paham jalan di area kerja', 'Jujur & tepat waktu'] },
  { re: /kasir/, lines: ['Teliti & jujur', 'Ramah melayani pelanggan', 'Bisa kerja dalam tim'] },
  { re: /\b(cs|customer service|layanan pelanggan|admin chat)\b/, lines: ['Ramah & sabar', 'Komunikasi lisan & tulisan baik', 'Fast response'] },
  { re: /admin|administrasi/, lines: ['Teliti & rapi', 'Bisa mengoperasikan komputer', 'Komunikatif & fast response'] },
  { re: /\b(sales|marketing|pemasaran|telemarketing)\b/, lines: ['Komunikatif & percaya diri', 'Suka tantangan & target', 'Mau belajar hal baru'] },
  { re: /content creator|kreator|videografer|video editor|editor video|host live|host/, lines: ['Kreatif & percaya diri di kamera', 'Paham tren media sosial', 'Punya portofolio konten'] },
  { re: /desain|designer|desainer|ilustrator/, lines: ['Menguasai software desain', 'Punya portofolio', 'Kreatif & tepat waktu'] },
  { re: /programmer|developer|engineer|frontend|backend|fullstack|web/, lines: ['Paham teknologi yang dipakai', 'Punya portofolio atau proyek', 'Bisa kerja dalam tim'] },
  { re: /koki|cook|chef|juru masak|kitchen/, lines: ['Bisa memasak & menjaga kebersihan dapur', 'Cekatan & teliti', 'Bisa kerja dalam tim'] },
  { re: /pelayan|waiter|waitress|crew|pramusaji|staf toko|pramuniaga|spg|spb/, lines: ['Ramah & sigap', 'Berpenampilan rapi', 'Bisa kerja dalam tim'] },
  { re: /guru|pengajar|tutor|mentor/, lines: ['Menguasai materi ajar', 'Sabar & komunikatif', 'Senang mengajar'] },
  { re: /gudang|packing|packer|helper/, lines: ['Teliti & cekatan', 'Sehat jasmani', 'Bisa kerja dalam tim'] },
  { re: /security|satpam/, lines: ['Sehat jasmani', 'Disiplin & tegas', 'Jujur & bertanggung jawab'] },
  { re: /penjahit|tukang|teknisi|mekanik/, lines: ['Terampil di bidangnya', 'Teliti & rapi', 'Jujur & bertanggung jawab'] },
];
export const GENERIC_QUALS = ['Jujur & bertanggung jawab', 'Mau belajar hal baru', 'Bisa kerja dalam tim'];

/* ------------------------------------------------------------------ */
/* Sebelum → sesudah yang umum (before-after tanpa keterangan)          */
/* ------------------------------------------------------------------ */
export const BA_PAIRS: Array<{ re: RegExp; before: string; after: string }> = [
  { re: /jerawat|acne|breakout/, before: 'Jerawat meradang & bikin nggak pede', after: 'Kulit terasa lebih tenang & halus' },
  { re: /komedo|pori/, before: 'Komedo di hidung & dagu', after: 'Pori-pori tampak lebih bersih' },
  { re: /flek|noda hitam|bekas jerawat|dark spot/, before: 'Noda & bekas jerawat mengganggu', after: 'Noda tampak lebih samar' },
  { re: /kusam|cerah|brightening|glowing|vitamin c|whitening/, before: 'Kulit kusam & nggak rata', after: 'Kulit tampak lebih cerah' },
  { re: /rambut rontok|rontok|penumbuh rambut|hair tonic/, before: 'Rambut rontok & tipis', after: 'Rambut terasa lebih kuat' },
  { re: /potong rambut|pangkas|barber|cukur|haircut/, before: 'Rambut panjang & nggak rapi', after: 'Rapi & makin percaya diri' },
  { re: /make ?up|mua|rias/, before: 'Wajah polos tanpa riasan', after: 'Riasan flawless siap acara' },
  { re: /gigi|behel|veneer|bleaching/, before: 'Gigi kuning & kurang rapi', after: 'Senyum tampak lebih cerah' },
  { re: /renovasi|rumah|kamar|dapur|ruang|interior|kos|kost/, before: 'Sempit, berantakan & gelap', after: 'Lega, rapi & terang' },
  { re: /taman|halaman|kebun|landscape/, before: 'Halaman gersang & tak terurus', after: 'Taman hijau & asri' },
  { re: /sepatu|sneakers/, before: 'Sepatu kotor & kusam', after: 'Bersih & kinclong lagi' },
  { re: /mobil|motor|detailing|poles|coating|cuci kendaraan/, before: 'Bodi kusam & banyak baret halus', after: 'Kinclong seperti baru' },
  { re: /sofa|karpet|kasur|springbed|gorden/, before: 'Noda & debu menumpuk', after: 'Bersih, segar & wangi' },
  { re: /laundry|baju|pakaian|noda/, before: 'Baju bernoda & kusam', after: 'Bersih, wangi & rapi' },
  { re: /logo|branding|rebranding|desain/, before: 'Tampilan lama kurang menarik', after: 'Tampilan baru lebih profesional' },
  { re: /website|web|aplikasi|app/, before: 'Tampilan lama lambat & kaku', after: 'Tampilan baru cepat & modern' },
  { re: /foto produk|edit foto|retouch|fotografi/, before: 'Foto gelap & kurang menarik', after: 'Foto terang & siap jualan' },
  { re: /hp|handphone|layar|lcd|servis/, before: 'Rusak & susah dipakai', after: 'Normal lagi, siap dipakai' },
];
