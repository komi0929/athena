import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { generateEmbeddings, generateClusterLabel, embeddingTo3D, findSimilar } from '@/lib/gemini';

// POST /api/embed — Generate embeddings for new bookmarks
// Called after sync to compute 3D positions and clusters
export async function POST(req: NextRequest) {
  try {
    // ═══ Authentication Check ═══
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { texts, ids } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts array required' }, { status: 400 });
    }

    // ═══ Size Limit — prevent API cost explosion ═══
    if (texts.length > 50) {
      return NextResponse.json({ error: '一度に処理できるのは最大50件です' }, { status: 400 });
    }

    // Check if Gemini is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Gemini API未設定のためスキップ',
        positions: texts.map((_: string, i: number) => {
          const seed = i * 127.1 + 311.7;
          const x = Math.sin(seed) * 43758.5453;
          const r = (x - Math.floor(x));
          return {
            x: (r - 0.5) * 80,
            y: (Math.sin(seed + 100) * 43758.5453 % 1 - 0.5) * 80,
            z: (Math.sin(seed + 200) * 43758.5453 % 1 - 0.5) * 80,
          };
        }),
      });
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(texts);

    // Compute 3D positions
    const positions = embeddings.map((emb) =>
      embeddingTo3D(emb, embeddings)
    );

    // Compute similarities
    const embeddingItems = embeddings.map((emb, i) => ({
      id: ids?.[i] || `item-${i}`,
      embedding: emb,
    }));

    const similarities = embeddingItems.map((item) => ({
      id: item.id,
      similar: findSimilar(item.embedding, embeddingItems.filter(e => e.id !== item.id), 4),
    }));

    // Generate cluster label from the batch
    const clusterLabel = await generateClusterLabel(texts);

    return NextResponse.json({
      success: true,
      positions,
      similarities,
      clusterLabel,
    });
  } catch (error) {
    console.error('Embed API error:', error);
    return NextResponse.json(
      { error: 'Embedding生成に失敗しました' },
      { status: 500 }
    );
  }
}
