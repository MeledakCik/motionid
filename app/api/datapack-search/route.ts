import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_VISUAL_DATA_PACKS,
  matchBestDataPack,
  synthesizeAllSceneImagesFromDataPack,
} from '@/lib/google-datapack-image-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'promo kopi susu gula aren 18rb';
  const category = searchParams.get('category') || 'promo';

  const matched = matchBestDataPack(query, category);
  const sampleScenes = [
    { text: `Hook Visual: ${query}`, subtext: matched.pack.badgeLabels[0] },
    { text: `Detail & Solusi Utama`, subtext: matched.pack.badgeLabels[1] },
    { text: `Bukti & Value Terbaik`, subtext: matched.pack.badgeLabels[2] },
    { text: `CTA & Aksi Sekarang`, subtext: matched.pack.badgeLabels[3] },
  ];

  const synthesizedImages = synthesizeAllSceneImagesFromDataPack({
    topic: query,
    category,
    scenes: sampleScenes,
  });

  return NextResponse.json({
    ok: true,
    query,
    matchedPack: matched.pack,
    confidence: matched.confidence,
    matchedKeywords: matched.matchedKeywords,
    availablePacksCount: GOOGLE_VISUAL_DATA_PACKS.length,
    synthesizedImages,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = String(body.topic || 'promo kopi susu 18rb');
    const category = String(body.category || 'promo');
    const priceLabel = body.priceLabel ? String(body.priceLabel) : undefined;
    const scenes = Array.isArray(body.scenes)
      ? body.scenes
      : [
          { text: topic, subtext: 'Scene 1 Hook' },
          { text: 'Keunggulan Utama', subtext: 'Scene 2 Isi' },
          { text: 'Bukti Nyata', subtext: 'Scene 3 Bukti' },
          { text: 'Ambil Sekarang', subtext: 'Scene 4 CTA' },
        ];

    const matched = matchBestDataPack(topic, category);
    const synthesizedImages = synthesizeAllSceneImagesFromDataPack({
      topic,
      category,
      priceLabel,
      scenes,
    });

    return NextResponse.json({
      ok: true,
      matchedPack: matched.pack,
      confidence: matched.confidence,
      synthesizedImages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid payload';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
