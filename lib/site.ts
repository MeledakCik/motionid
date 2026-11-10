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
  'Ketik topik, jadi video motion graphic untuk TikTok, Reels & Shorts lengkap dengan hook, 4 scene animasi, CTA, caption dan hashtag. 9 template, tanpa API key, gratis.';
