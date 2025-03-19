# 環境構築手順

## 1. 前提条件
- Renderアカウント
- Google Cloudアカウント
- GitHubアカウント

## 2. Google Cloud設定
1. Google Cloudコンソールにアクセス
2. プロジェクトの作成
3. 必要なAPIの有効化
   - Cloud Text-to-Speech API
   - Cloud Vision API
4. サービスアカウントの作成
   ```bash
   # サービスアカウントキーをJSON形式でダウンロード
   # ファイル名例: project-credentials.json
   ```

## 3. Render設定
1. Renderアカウントの作成
2. GitHubとの連携設定
3. 新規Webサービスの作成
   - バックエンドサービス（note-backend, memo-backend）
   - フロントエンドサービス（note-frontend, memo-frontend）

## 4. データベース設定
1. SQLiteデータベースの初期化
   ```bash
   # バックエンドディレクトリで実行
   python init_db.py
   ```

## 5. 環境変数の準備
1. 各アプリケーションの`.env.example`を参考に環境変数を準備
2. Google Cloud認証情報の設定
3. データベースURLの設定
4. CORS設定の準備

## 6. セキュリティ設定
1. 適切なCORS設定
2. 環境変数の暗号化
3. APIキーの安全な管理

## 7. 動作確認
1. ローカル環境での確認
2. テスト環境での確認
3. 本番環境での確認
