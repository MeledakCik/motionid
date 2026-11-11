# MotionID v4.0 — Upgrade Patch & Source Bundle (`MeledakCik/motionid`)

Paket ini berisi pembaruan langsung untuk repositori [https://github.com/MeledakCik/motionid](https://github.com/MeledakCik/motionid):

1. **`supabase/migration.sql`**: Menambahkan dukungan `type = 'video_motion'` dan `'ui_blueprint'`, kolom `video_url`, `creator_handle`, serta `motion_profile` JSONB pada tabel `ai_training_data`.
2. **`lib/training.ts`**: Menambahkan `analyzeCreatorVideoReference()` yang mengekstrak telemetri kurva easing, gerakan kamera, BPM, urutan widget UI, dan palet warna dari video referensi kreator (seperti `@depup.web`).
3. **`lib/smart-engine.ts`**: Memperbarui generator scene lokal agar menghasilkan animasi multi-step ber-widget interaktif (`repo_input_card`, `repo_scanner_card`, `terminal_build_card`, `bento_metrics_grid`) alih-alih teks statis yang monoton.
4. **`components/templates/motion.tsx`**: Merombak komponen render template menjadi bergaya SaaS UI / Kinetic Motion Graphic (`@depup.web` lavender pastel + lime orb + 3D perspective card + live terminal log).
