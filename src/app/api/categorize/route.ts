import { NextRequest, NextResponse } from 'next/server';

// POST /api/categorize — AI-based category generation using Gemini
// Called once per user to create personalized bookmark categories
export async function POST(req: NextRequest) {
  try {
    const { texts } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts array required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      // Fallback — return generic categories
      return NextResponse.json({
        categories: getDefaultCategories(),
        source: 'fallback',
      });
    }

    // Send to Gemini for categorization
    const sampleTexts = texts
      .slice(0, 30)
      .map((t: string, i: number) => `${i + 1}. ${t.slice(0, 150)}`)
      .join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたはブックマーク分類の専門家です。以下のブックマーク一覧を分析して、6つのカテゴリに分類してください。

ルール:
- 各カテゴリにはラベル（日本語、2〜6文字）とキーワード（日英混在OK、10〜15個）を設定
- キーワードはそのカテゴリに属するブックマークを判定するためのもの
- 全てのブックマークがいずれかのカテゴリに分類されるよう、適度に汎用的なカテゴリも含める
- 必ずJSON配列のみを出力（説明不要）

出力フォーマット:
[
  {"label": "カテゴリ名", "keywords": ["keyword1", "keyword2", ...]},
  ...
]

ブックマーク一覧:
${sampleTexts}`,
            }],
          }],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[Categorize] Gemini API error:', response.status);
      return NextResponse.json({
        categories: getDefaultCategories(),
        source: 'fallback',
      });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) {
      return NextResponse.json({
        categories: getDefaultCategories(),
        source: 'fallback',
      });
    }

    // Parse JSON response
    let categories;
    try {
      categories = JSON.parse(rawText);
    } catch {
      console.error('[Categorize] Failed to parse Gemini response:', rawText.slice(0, 200));
      return NextResponse.json({
        categories: getDefaultCategories(),
        source: 'fallback',
      });
    }

    // Validate structure
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({
        categories: getDefaultCategories(),
        source: 'fallback',
      });
    }

    // Assign spatial centers to each category (evenly spaced on a sphere)
    const centers = [
      [-45, 15, -10],
      [40, -10, 25],
      [-15, -35, -35],
      [35, 30, -30],
      [-5, 40, 40],
      [0, -40, 0],
    ];

    const enrichedCategories = categories.slice(0, 6).map((cat: { label: string; keywords: string[] }, i: number) => ({
      label: cat.label || `カテゴリ${i + 1}`,
      keywords: (cat.keywords || []).map((k: string) => k.toLowerCase()),
      center: centers[i] || [0, 0, 0],
    }));

    return NextResponse.json({
      categories: enrichedCategories,
      source: 'ai',
    });
  } catch (error) {
    console.error('[Categorize] Error:', error);
    return NextResponse.json({
      categories: getDefaultCategories(),
      source: 'fallback',
    });
  }
}

function getDefaultCategories() {
  return [
    {
      label: 'テクノロジー',
      keywords: ['react', 'next', 'vue', 'css', 'html', 'javascript', 'typescript', 'api', 'web', 'node', 'vercel', 'github', 'code', 'dev', 'programming', '開発', 'エンジニア'],
      center: [-45, 15, -10],
    },
    {
      label: 'AI・機械学習',
      keywords: ['ai', 'ml', 'llm', 'gpt', 'openai', 'gemini', 'claude', 'chatgpt', '機械学習', 'rag', 'embedding', 'agent', 'prompt', 'model', '生成ai'],
      center: [40, -10, 25],
    },
    {
      label: 'デザイン',
      keywords: ['design', 'デザイン', 'figma', 'ui', 'ux', 'typography', 'color', 'animation', 'accessibility', 'font', 'branding'],
      center: [-15, -35, -35],
    },
    {
      label: 'ビジネス',
      keywords: ['startup', 'スタートアップ', 'vc', 'saas', 'growth', 'product', 'revenue', 'business', 'ビジネス', 'marketing', 'hiring'],
      center: [35, 30, -30],
    },
    {
      label: '暮らし',
      keywords: ['life', '暮らし', '生活', '思考', 'productivity', 'habit', 'book', '読書', 'health', '健康', 'investment', '投資', 'learn'],
      center: [-5, 40, 40],
    },
    {
      label: 'その他',
      keywords: [],
      center: [0, -40, 0],
    },
  ];
}
