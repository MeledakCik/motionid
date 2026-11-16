import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Generator Video TikTok & Reels`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ECE6FF',
    theme_color: '#7B50FF',
    lang: 'id',
  };
}
