# デプロイ手順

## 1. バックエンドのデプロイ

### Note Backend
1. Renderダッシュボードで新規Webサービスを作成
2. リポジトリとブランチを選択
3. 以下の設定を行う：
   ```yaml
   # 基本設定
   Name: note-backend
   Region: Singapore
   Branch: main
   Root Directory: apps/note-backend
   Runtime: Python
   Build Command: pip install -r requirements.txt
   Start Command: python app.py
   ```
4. 環境変数の設定：
   ```
   APP_ENV=production
   APP_DEBUG=false
   DATABASE_URL=your_database_url
   GOOGLE_CLOUD_PROJECT=your_project_id
   GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials
   ```

### Memo Backend
1. 同様の手順でmemo-backendも設定
2. 環境変数は`memo-backend/.env.example`を参照

## 2. フロントエンドのデプロイ

### Note Frontend
1. バックエンドのデプロイ完了を確認
2. 新規Webサービスを作成
3. 以下の設定を行う：
   ```yaml
   Name: note-frontend
   Region: Singapore
   Branch: main
   Root Directory: apps/note-frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run preview
   ```
4. 環境変数の設定：
   ```
   VITE_API_URL=https://your-note-backend.onrender.com
   ```

### Memo Frontend
1. 同様の手順でmemo-frontendも設定
2. 環境変数は`memo-frontend/.env.example`を参照

## 3. デプロイ後の確認

### バックエンド確認
1. ヘルスチェックエンドポイントの確認
2. APIエンドポイントのテスト
3. ログの確認

### フロントエンド確認
1. アプリケーションの表示確認
2. 各機能の動作確認
3. エラー監視の確認

## 4. 監視設定
1. Renderダッシュボードでの監視設定
2. アラートの設定
3. ログ監視の設定
