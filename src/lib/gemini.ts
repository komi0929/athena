// Gemini AI integration for Athena
// Used for: embedding generation, cluster labeling, similarity computation

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ═══ Text Embedding ═══
// Uses text-embedding-004 model
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(
    `${GEMINI_BASE}/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }],
        },
        taskType: 'SEMANTIC_SIMILARITY',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// ═══ Batch Embedding ═══
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(
    `${GEMINI_BASE}/models/text-embedding-004:batchEmbedContents?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map(text => ({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text }],
          },
          taskType: 'SEMANTIC_SIMILARITY',
        })),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Batch Embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.embeddings.map((e: { values: number[] }) => e.values);
}

// ═══ Cluster Label Generation ═══
// Uses Gemini to auto-generate cluster labels from bookmark texts
export async function generateClusterLabel(texts: string[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return 'Uncategorized';
  }

  const sampleTexts = texts.slice(0, 10).join('\n---\n');

  const response = await fetch(
    `${GEMINI_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `以下のブックマークテキスト群の共通テーマを表す、簡潔な日本語ラベル（2〜5文字）を1つだけ生成してください。余計な説明は不要です。ラベルのみ出力してください。

${sampleTexts}`,
          }],
        }],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.3,
        },
      }),
    }
  );

  if (!response.ok) {
    return 'Uncategorized';
  }

  const data = await response.json();
  const label = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return label || 'Uncategorized';
}

// ═══ 3D Position from Embedding ═══
// Projects high-dimensional embedding to 3D coordinates using simple PCA-like approach
export function embeddingTo3D(
  embedding: number[],
  allEmbeddings: number[][],
  spread: number = 50
): { x: number; y: number; z: number } {
  // Use first 3 principal directions (simplified — deterministic projection)
  const dim = embedding.length;

  // Project onto 3 semi-random but consistent directions
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < dim; i++) {
    x += embedding[i] * Math.sin(i * 0.618);
    y += embedding[i] * Math.cos(i * 0.381);
    z += embedding[i] * Math.sin(i * 0.927 + 0.5);
  }

  // Normalize
  const norm = Math.sqrt(x * x + y * y + z * z) || 1;
  x = (x / norm) * spread;
  y = (y / norm) * spread;
  z = (z / norm) * spread;

  return { x, y, z };
}

// ═══ Cosine Similarity ═══
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// ═══ Find Similar Bookmarks ═══
export function findSimilar(
  targetEmbedding: number[],
  allEmbeddings: { id: string; embedding: number[] }[],
  topK: number = 5
): { id: string; score: number }[] {
  return allEmbeddings
    .map(item => ({
      id: item.id,
      score: cosineSimilarity(targetEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
