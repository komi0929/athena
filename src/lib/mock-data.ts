// Generates realistic mock data for demo mode
import { Bookmark, Cluster } from './types';

const TECH_TOPICS = [
  { text: 'React Server Componentsの新しいパターンが革新的。ストリーミングSSRとの組み合わせでUXが劇的に向上する。', author: 'tech_ninja', ogp: 'Deep Dive into RSC Patterns' },
  { text: 'WebGPUがついにStable。Three.jsのWebGPURendererでパフォーマンスが3倍に。ゲームチェンジャーだ。', author: 'gpu_wizard', ogp: 'WebGPU: The Future of Web Graphics' },
  { text: 'Supabaseの新しいVector検索機能、pgvectorとの統合が完璧。コスト効率も最高。', author: 'db_master', ogp: 'Supabase Vector Search Guide' },
  { text: 'TypeScript 5.5のInferred Type Predicatesが型安全性を大幅に改善。フィルター操作が美しくなった。', author: 'ts_lover', ogp: 'TypeScript 5.5 Release Notes' },
  { text: 'Edge Runtimeでのストリーミングレスポンス、Vercelの新しいインフラで300ms以下のTTFBを実現。', author: 'cloud_arch', ogp: 'Edge Computing Best Practices' },
  { text: 'Rust + WASMでフロントエンドのパフォーマンスボトルネックを解消。計算集約型の処理に最適。', author: 'rust_dev', ogp: 'WASM Performance Benchmarks' },
  { text: 'Figma to Codeの精度が驚異的に向上。デザインシステムの構築が10倍速くなった。', author: 'design_eng', ogp: 'Design-to-Code Revolution' },
  { text: 'Bun v2のNode.js互換性が99%に。ビルド時間が1/5に短縮、devサーバーの起動が瞬時。', author: 'bun_fan', ogp: 'Bun v2 Migration Guide' },
  { text: 'GraphQL federationでマイクロサービス間のデータ統合が劇的に簡素化。Apollo Routerの進化が凄い。', author: 'api_guru', ogp: 'GraphQL Federation in Production' },
  { text: 'Tailwind CSS v4のOxide Engineで、CSSのビルドが20倍高速に。開発体験の革新。', author: 'css_artist', ogp: 'Tailwind v4 Deep Dive' },
];

const AI_TOPICS = [
  { text: 'GPT-5のマルチモーダル能力が衝撃的。画像理解と生成を同時にこなす統一モデル。', author: 'ai_researcher', ogp: 'GPT-5 Technical Report' },
  { text: 'ローカルLLMの進化が止まらない。Llama 4がGPT-4レベルの性能を8Bパラメータで実現。', author: 'ml_engineer', ogp: 'Local LLM Benchmarks 2026' },
  { text: 'RAGの新しいアプローチ：Contextual Retrievalで検索精度が49%向上。ベクトル検索+BM25のハイブリッド。', author: 'rag_expert', ogp: 'Advanced RAG Techniques' },
  { text: 'Diffusionモデルの新アーキテクチャ、生成速度が10倍に。リアルタイム画像生成の時代。', author: 'genai_dev', ogp: 'Next-Gen Image Generation' },
  { text: 'AIエージェントフレームワークの比較：LangChain vs CrewAI vs AutoGen。プロダクション利用の現実。', author: 'agent_builder', ogp: 'AI Agent Framework Comparison' },
  { text: 'Embeddingモデルの低コスト化が進む。text-embedding-3-smallで十分な精度、コストは1/10。', author: 'nlp_dev', ogp: 'Embedding Models Cost Analysis' },
  { text: 'ファインチューニングなしで高精度なタスク特化AIを構築。Few-shot + Chain-of-Thoughtの威力。', author: 'prompt_eng', ogp: 'Zero-Shot Specialization' },
  { text: 'マルチエージェントシステムの設計パターン。協調、競合、階層型の3モデルの使い分け。', author: 'systems_ai', ogp: 'Multi-Agent Design Patterns' },
  { text: 'AIの環境負荷問題。学習コストの削減手法：蒸留、量子化、スパース活性化の最前線。', author: 'green_ai', ogp: 'Sustainable AI Computing' },
  { text: 'コード生成AIの精度検証。Copilot vs Cursor vs Windsurf、実際のプロダクションコードでの比較。', author: 'code_ai', ogp: 'AI Coding Assistants Benchmark' },
];

const DESIGN_TOPICS = [
  { text: '空間コンピューティングのUX原則。Apple Vision Proから学ぶ、奥行きと距離感のデザイン。', author: 'spatial_ux', ogp: 'Spatial Computing UX Guidelines' },
  { text: 'ニューモーフィズムから3Dモーフィズムへ。次世代UIデザインの潮流と実装テクニック。', author: 'ui_trend', ogp: 'Post-Neumorphic Design' },
  { text: 'インタラクションデザインの心理学。マイクロアニメーションが認知負荷を軽減するメカニズム。', author: 'ux_psych', ogp: 'The Psychology of Micro-interactions' },
  { text: 'ダークモードの色彩科学。単純な反転ではない、真のダークテーマ設計の技術。', author: 'color_sci', ogp: 'Dark Mode Color Science' },
  { text: 'アクセシビリティとデザインの両立。WAI-ARIA 2.0で実現する美しいインクルーシブデザイン。', author: 'a11y_adv', ogp: 'Inclusive Design 2.0' },
  { text: 'タイポグラフィの進化。可変フォントで実現する、コンテンツに最適化された動的書体。', author: 'type_nerd', ogp: 'Variable Fonts in Practice' },
  { text: 'iPhone 16のUIガイドラインが更新。Dynamic Island対応のデザインパターン集。', author: 'ios_design', ogp: 'iOS 18 Human Interface' },
  { text: 'Glassmorphism 2.0。ブラー効果の最適化でパフォーマンスを犠牲にしない実装方法。', author: 'glass_ui', ogp: 'Glassmorphism Performance Guide' },
];

const STARTUP_TOPICS = [
  { text: 'YCの最新バッチの傾向分析。AI×B2Bが70%、VerticalSaaSの時代が本格化。', author: 'vc_analyst', ogp: 'YC Batch Analysis 2026' },
  { text: 'PMFまでの平均期間が6ヶ月に短縮。AI活用による高速プロトタイピングの効果。', author: 'startup_metrics', ogp: 'Path to PMF Report' },
  { text: 'リモートファーストの組織設計。非同期コミュニケーションで生産性が40%向上した事例。', author: 'remote_ceo', ogp: 'Remote-First Playbook' },
  { text: 'マイクロSaaSの収益モデル。月額$500以下のツールで月収$50Kを達成するまで。', author: 'indie_hacker', ogp: 'Micro-SaaS Revenue Guide' },
  { text: 'テックスタートアップの採用戦略2026。AIネイティブな人材を見極める面接設計。', author: 'hr_tech', ogp: 'Hiring AI-Native Talent' },
  { text: 'プロダクト主導の成長（PLG）戦略。フリーミアムモデルの設計とコンバージョン最適化。', author: 'growth_lead', ogp: 'PLG Strategy Handbook' },
];

const LIFE_TOPICS = [
  { text: '朝5時起きを3年続けた結果。集中力とクリエイティビティの変化を定量データで公開。', author: 'morning_person', ogp: '5AM Club Results' },
  { text: 'デジタルミニマリズムの実践。SNS使用時間を90%削減して得たもの。', author: 'digital_min', ogp: 'Digital Minimalism Guide' },
  { text: '読書量を年間100冊に増やす方法。速読ではなく「戦略的な本の選び方」がカギ。', author: 'book_worm', ogp: '100 Books a Year' },
  { text: 'セカンドブレインの構築方法が進化。Notion + AI で知識管理が別次元に。', author: 'pkm_master', ogp: 'Second Brain 2.0' },
  { text: '瞑想×テクノロジー。ニューロフィードバックで集中力トレーニングの効率が3倍に。', author: 'mind_hack', ogp: 'Meditation Tech Guide' },
  { text: 'エンジニアのための投資入門。S&P500とビットコインのドルコスト平均法の実績比較。', author: 'eng_investor', ogp: 'Investment for Engineers' },
];



function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function gaussianRandom(mean: number, std: number, seed: number) {
  const u1 = seededRandom(seed);
  const u2 = seededRandom(seed + 0.5);
  const z = Math.sqrt(-2 * Math.log(u1 + 0.001)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

export function generateMockData(): { bookmarks: Bookmark[]; clusters: Cluster[] } {
  // Define cluster centers
  const clusterDefs = [
    { label: 'フロントエンド', cx: -30, cy: 15, cz: -10, topics: TECH_TOPICS },
    { label: 'AI・機械学習', cx: 25, cy: -10, cz: 20, topics: AI_TOPICS },
    { label: 'デザイン', cx: -15, cy: -25, cz: -30, topics: DESIGN_TOPICS },
    { label: 'スタートアップ', cx: 35, cy: 20, cz: -25, topics: STARTUP_TOPICS },
    { label: '暮らし・思考', cx: -5, cy: 30, cz: 35, topics: LIFE_TOPICS },
  ];

  const clusters: Cluster[] = clusterDefs.map((c, i) => ({
    id: `cluster-${i}`,
    label: c.label,
    center_x: c.cx,
    center_y: c.cy,
    center_z: c.cz,
    radius: 15,
  }));

  const bookmarks: Bookmark[] = [];
  let seedCounter = 42;

  // Generate ~100 bookmarks distributed among clusters
  for (let ci = 0; ci < clusterDefs.length; ci++) {
    const cluster = clusterDefs[ci];
    const count = ci < 2 ? 25 : 17; // More for tech/AI
    const topics = cluster.topics;

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      const variant = i >= topics.length ? ` (${Math.floor(i / topics.length) + 1})` : '';

      seedCounter++;
      const px = gaussianRandom(cluster.cx, 10, seedCounter);
      const py = gaussianRandom(cluster.cy, 10, seedCounter + 100);
      const pz = gaussianRandom(cluster.cz, 10, seedCounter + 200);

      // Create time spread over 6 months
      const daysAgo = Math.floor(seededRandom(seedCounter + 300) * 180);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      bookmarks.push({
        id: `bm-${ci}-${i}`,
        tweet_id: `${1800000000000 + ci * 1000 + i}`,
        tweet_url: `https://x.com/${topic.author}/status/${1800000000000 + ci * 1000 + i}`,
        text: topic.text + variant,
        author_name: topic.author.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        author_handle: `@${topic.author}`,
        ogp_title: topic.ogp,
        ogp_description: `${topic.ogp}に関する詳細な解説記事。最新のトレンドと実践的な知見を提供。`,
        ogp_image: undefined,
        pos_x: px,
        pos_y: py,
        pos_z: pz,
        is_read: seededRandom(seedCounter + 400) > 0.65, // ~35% read
        created_at: date.toISOString(),
        bookmarked_at: date.toISOString(),
        similarity_ids: [],
      });
    }
  }

  // Compute similarity connections (closest 3-5 within same cluster)
  for (const bm of bookmarks) {
    const distances = bookmarks
      .filter(other => other.id !== bm.id)
      .map(other => ({
        id: other.id,
        dist: Math.sqrt(
          (bm.pos_x - other.pos_x) ** 2 +
          (bm.pos_y - other.pos_y) ** 2 +
          (bm.pos_z - other.pos_z) ** 2
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    bm.similarity_ids = distances.slice(0, 4).map(d => d.id);
  }

  return { bookmarks, clusters };
}
