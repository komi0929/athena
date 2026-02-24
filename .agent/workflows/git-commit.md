---
description: 変更をGitHub（komi0929/athena）にcommit & pushする
---

# Git Commit & Push ワークフロー

改善やコード変更が完了したら、以下の手順でGitHubに記録する。

// turbo-all

1. ステージング

```
git add -A
```

2. コミット（変更内容に応じたメッセージを付ける）

```
git commit -m "<type>: <description>"
```

typeは以下から選択:

- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `style`: UI/デザイン変更
- `docs`: ドキュメント変更
- `chore`: 設定・ビルド関連

3. プッシュ

```
git push origin main
```
