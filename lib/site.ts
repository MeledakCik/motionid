function resolveSiteUrl(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://motionid.vercel.app'
    ).origin;
  } catch {
    return 'https://motionid.vercel.app';
  }
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = 'MotionKu';
export const SITE_TITLE = 'MotionKu — Generator Video TikTok & Reels Otomatis, Gratis';
export const SITE_DESCRIPTION =
  'Ketik topik, jadi video pendek untuk TikTok, Reels, Shorts, dan status WhatsApp. Naskah, gaya visual, dan animasi disusun otomatis, lalu dirender jadi MP4 1080p langsung di browser. Gratis.';
