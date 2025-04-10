# NewNote アプリケーション

認証機能を実装したメモアプリケーション。

## プロジェクト概要

このプロジェクトはFirebase認証を利用したノートアプリケーションで、以下の機能を提供します：

- ユーザー登録・ログイン（メール/パスワード、Google認証）
- ユーザーごとのノート管理
- 複数ページを持つノートの作成と編集
- リッチテキストエディタ機能

## プロジェクト構成

このプロジェクトはモノレポ構造になっており、以下のコンポーネントで構成されています：

- `apps/note-frontend`: React + Viteで構築されたフロントエンドアプリケーション
- `apps/note-backend`: Flaskで構築されたバックエンドAPI
- `docs`: プロジェクトドキュメント

## 開発ステータス

- ✅ 認証機能の実装完了
- ✅ データベース連携完了
- ✅ テストと検証完了
- 🚀 デプロイ準備中

## 開発環境のセットアップ

### 前提条件

- Node.js（v18以上）
- Python（v3.9以上）
- Firebase CLIとアカウント

### フロントエンド

```bash
cd apps/note-frontend
npm install
cp .env.example .env
# .envファイルにFirebase設定を追加
npm run dev
```

### バックエンド

```bash
cd apps/note-backend
python -m venv venv
source venv/bin/activate  # Windowsの場合: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# .envファイルにFirebase Admin SDK設定を追加
python app.py
```

## テスト

フロントエンドとバックエンドの両方で認証機能のテストを実施済みです。
テスト結果は `docs/test_summary.md` に記載されています。

### テスト実行方法

```bash
# フロントエンドテスト
cd apps/note-frontend
npm run test:auth

# バックエンドテスト
cd apps/note-backend
python test_auth_simple.py
python test_data_access.py
```

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリにあります：

- `docs/task_progress.md`: プロジェクトの進捗状況
- `docs/api_spec.md`: API仕様書
- `docs/auth_flow.md`: 認証フローの説明
- `docs/test_summary.md`: テスト結果のまとめ

## ライセンス

MIT License 