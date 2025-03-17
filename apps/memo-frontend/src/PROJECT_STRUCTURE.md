
# プロジェクト構造

## 主要なファイル構成

```
src/
├── pages/
│   ├── Index.tsx      # メインのノートエディタページ
│   └── NotFound.tsx   # 404ページ
├── components/
│   └── ui/            # UIコンポーネント（shadcn/ui）
├── hooks/
│   └── use-mobile.tsx # モバイル判定用カスタムフック
├── lib/
│   └── utils.ts       # ユーティリティ関数
└── App.tsx            # アプリケーションのルート
```

## 各ファイルの説明

### Pages

- `Index.tsx`
  - メインのノートエディタページ
  - タイトルと本文の編集機能
  - ダークモード切り替え
  - モバイル対応
  - 新規ノート作成機能

- `NotFound.tsx`
  - 404エラーページ

### Hooks

- `use-mobile.tsx`
  - デバイスがモバイルかどうかを判定するカスタムフック
  - 画面幅に基づいてレスポンシブ対応を制御

### Components

- `ui/`
  - shadcn/uiライブラリのコンポーネント群
  - ボタン、フォーム要素などの基本的なUIコンポーネント

### その他

- `App.tsx`
  - アプリケーションのルート
  - ルーティング設定
  - テーマプロバイダー
  - その他のグローバル設定

- `utils.ts`
  - 共通のユーティリティ関数
  - クラス名の結合などのヘルパー関数

## 技術スタック

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react (アイコン)
- next-themes (ダークモード)

