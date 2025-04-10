# Firebase認証機能実装計画

## 1. 準備フェーズ
### 1.1 Firebaseプロジェクト設定
- [ ] Firebaseプロジェクトの作成
- [ ] 必要なサービスの有効化
  - [ ] Authentication
  - [ ] Firestore Database
- [ ] セキュリティルールの設定
- [ ] 環境変数の設定
  - [ ] フロントエンド（VITE_FIREBASE_CONFIG関連の変数）
  - [ ] バックエンド（FIREBASE_ADMIN_CONFIG関連の変数）

### 1.2 開発環境の準備
- [ ] Firebase SDKのインストール
  - [ ] フロントエンド（firebase, @firebase/auth）
  - [ ] バックエンド（firebase-admin）
- [ ] 必要なパッケージのインストール
  - [ ] フロントエンド：firebase, @firebase/auth, @firebase/firestore
  - [ ] バックエンド：firebase-admin

## 2. 認証機能の実装（フロントエンド）
### 2.1 認証コンテキストの作成
- [ ] src/contexts/AuthContext.tsxの作成
  - [ ] ユーザー認証状態の管理
  - [ ] ログイン状態の永続化
  - [ ] トークン管理機能の実装

### 2.2 認証UIの実装
- [ ] src/pages/Login.tsxの作成
- [ ] src/pages/Register.tsxの作成
- [ ] src/components/auth/LoginForm.tsxの作成
- [ ] src/components/auth/RegisterForm.tsxの作成
- [ ] src/components/common/ProtectedRoute.tsxの作成

### 2.3 認証機能の実装
- [ ] メール/パスワード認証
  - [ ] 登録機能（src/api/auth.ts）
  - [ ] ログイン機能（src/api/auth.ts）
  - [ ] ログアウト機能（src/api/auth.ts）
- [ ] Google認証
  - [ ] Googleログイン機能（src/api/auth.ts）
  - [ ] アカウント連携機能（src/api/auth.ts）

### 2.4 ルーティング保護
- [ ] App.tsxのルートに認証保護を追加
- [ ] 未認証時のリダイレクト処理
- [ ] 認証済み時のリダイレクト処理

## 3. バックエンド認証の実装
### 3.1 Firebase Admin SDK設定
- [ ] firebase_admin.pyファイルの作成
  - [ ] Admin SDKの初期化コード
  - [ ] 環境変数からの設定読み込み
- [ ] auth_middleware.pyファイルの作成
  - [ ] トークン検証関数
  - [ ] リクエストからのトークン抽出関数

### 3.2 認証検証機能
- [ ] routes/__init__.pyに認証ミドルウェア登録
- [ ] 各エンドポイントに認証チェック追加
- [ ] エラーレスポンスの追加

## 4. データベースモデル修正
### 4.1 モデル定義の更新
- [ ] models.pyの更新
  - [ ] Noteモデルにuser_idフィールド追加
  - [ ] Pageモデルにuser_idフィールド追加
  - [ ] Bookmarkモデルにuser_idフィールド追加
  - [ ] インデックス設定の追加

### 4.2 データベースマイグレーション
- [ ] マイグレーションスクリプト作成
  - [ ] 既存データにuser_idを追加するマイグレーション
  - [ ] インデックス作成のマイグレーション
- [ ] テストデータ作成/更新

## 5. バックエンドAPI修正
### 5.1 ノート関連APIの修正
- [ ] routes/notes.py
  - [ ] GET /notesエンドポイントにuser_idフィルタリング追加
  - [ ] POST /notesエンドポイントにuser_id設定追加
  - [ ] GET /notes/<id>エンドポイントに所有者チェック追加
  - [ ] PUT /notes/<id>エンドポイントに所有者チェック追加
  - [ ] DELETE /notes/<id>エンドポイントに所有者チェック追加

### 5.2 ページ関連APIの修正
- [ ] routes/notes.py（ページ関連部分）
  - [ ] GET /notes/<id>/pages/<page_number>エンドポイントに所有者チェック追加
  - [ ] PUT /notes/<id>/pages/<page_number>エンドポイントに所有者チェック追加
  - [ ] DELETE /notes/<id>/pages/<page_number>エンドポイントに所有者チェック追加

### 5.3 OCR・TTS関連APIの修正
- [ ] routes/ocr.py
  - [ ] POST /notes/<id>/pages/<page_number>/ocrエンドポイントに認証チェック追加
  - [ ] 所有者チェックの実装
- [ ] routes/tts.py
  - [ ] POST /ttsエンドポイントに認証チェック追加

### 5.4 ブックマーク関連APIの修正
- [ ] routes/bookmarks.py
  - [ ] GET /bookmarksエンドポイントにuser_idフィルタリング追加
  - [ ] POST /bookmarksエンドポイントにuser_id設定追加
  - [ ] GET /bookmarks/<id>エンドポイントに所有者チェック追加
  - [ ] PUT /bookmarks/<id>エンドポイントに所有者チェック追加
  - [ ] DELETE /bookmarks/<id>エンドポイントに所有者チェック追加

### 5.5 メモ機能関連APIの修正
- [ ] メモモデルの修正
  - [ ] apps/memo-backend/models/memo.py
    - [ ] Memoモデルにuser_idフィールド追加
  - [ ] apps/memo-backend/models/memopage.py
    - [ ] MemoPageモデルにuser_idフィールド追加（オプション）
  - [ ] データベースマイグレーションスクリプト作成

- [ ] メモエンドポイントの修正
  - [ ] apps/memo-backend/routes/memo.py
    - [ ] GET /memosエンドポイントにuser_idフィルタリング追加
    - [ ] POST /memosエンドポイントにuser_id設定追加
    - [ ] GET /memos/<id>エンドポイントに所有者チェック追加
    - [ ] PUT /memos/<id>エンドポイントに所有者チェック追加
    - [ ] DELETE /memos/<id>エンドポイントに所有者チェック追加
    - [ ] GET /memos/<id>/pagesエンドポイントに所有者チェック追加
    - [ ] POST /memos/<id>/pagesエンドポイントに所有者チェック追加
    - [ ] GET /memos/<id>/pages/<page_number>エンドポイントに所有者チェック追加
    - [ ] PUT /memos/<id>/pages/<page_number>エンドポイントに所有者チェック追加
    - [ ] DELETE /memos/<id>/pages/<page_number>エンドポイントに所有者チェック追加

- [ ] 認証ミドルウェア追加
  - [ ] apps/memo-backend/auth_middleware.py作成
  - [ ] apps/memo-backend/app.pyにミドルウェア登録

## 6. フロントエンドAPI呼び出し修正
### 6.1 API呼び出し修正
- [ ] src/api/axiosConfig.tsの作成
  - [ ] 認証トークンをリクエストヘッダーに追加する共通処理
- [ ] src/api/notes.tsの更新
  - [ ] 認証トークンを含める処理を追加
  - [ ] エラーハンドリングの強化（認証エラー対応）
- [ ] src/api/bookmarks.tsの更新
  - [ ] 認証トークンを含める処理を追加
  - [ ] エラーハンドリングの強化（認証エラー対応）

### 6.2 OCR・TTS関連API呼び出し修正
- [ ] executeOCR関数の更新（src/api/notes.ts）
  - [ ] 認証トークンを含める処理を追加
  - [ ] エラーハンドリングの強化
- [ ] synthesizeSpeech関数の更新（src/api/notes.ts）
  - [ ] 認証トークンを含める処理を追加
  - [ ] エラーハンドリングの強化

### 6.3 メモ関連API呼び出し修正
- [ ] src/api/memos.tsの更新
  - [ ] 認証トークンを含める処理を追加
  - [ ] エラーハンドリングの強化（認証エラー対応）
- [ ] メモページ関連API呼び出しの更新
  - [ ] 認証トークンを含める処理を追加
  - [ ] エラーハンドリングの強化（認証エラー対応）

## 7. テストとデバッグ
### 7.1 認証テスト
- [ ] 各認証フローのテスト
  - [ ] 登録 → ログイン → ログアウト
  - [ ] Googleログイン → ログアウト
  - [ ] トークン検証

### 7.2 データアクセステスト
- [ ] ノート関連操作の認証テスト
  - [ ] 認証済みユーザーによるノート作成
  - [ ] 認証済みユーザーによる自分のノート取得
  - [ ] 認証済みユーザーによる他ユーザーのノートアクセス試行
  - [ ] 未認証ユーザーによるノートアクセス試行
- [ ] ページ関連操作の認証テスト
  - [ ] 認証済みユーザーによるページ作成
  - [ ] 認証済みユーザーによる自分のページ編集
  - [ ] 認証済みユーザーによる他ユーザーのページ編集試行
- [ ] OCR・TTS関連機能の認証テスト
  - [ ] 認証済みユーザーによるOCR実行
  - [ ] 認証済みユーザーによるTTS実行
  - [ ] 未認証ユーザーによるOCR・TTS実行試行
- [ ] ブックマーク関連操作の認証テスト
  - [ ] 認証済みユーザーによるブックマーク作成
  - [ ] 認証済みユーザーによる自分のブックマーク編集/削除
  - [ ] 認証済みユーザーによる他ユーザーのブックマークアクセス試行

### 7.3 エラーハンドリングテスト
- [ ] 認証エラーの処理確認
- [ ] トークン期限切れの処理確認
- [ ] アクセス拒否の処理確認

### 7.4 メモ機能テスト
- [ ] メモ関連操作の認証テスト
  - [ ] 認証済みユーザーによるメモ作成
  - [ ] 認証済みユーザーによる自分のメモ取得
  - [ ] 認証済みユーザーによる他ユーザーのメモアクセス試行
  - [ ] 未認証ユーザーによるメモアクセス試行
- [ ] メモページ関連操作の認証テスト
  - [ ] 認証済みユーザーによるメモページ作成
  - [ ] 認証済みユーザーによる自分のメモページ編集
  - [ ] 認証済みユーザーによる他ユーザーのメモページ編集試行

## 8. デプロイと移行
### 8.1 環境変数の設定
- [ ] Render側の環境変数設定
  - [ ] FIREBASE_ADMIN_CONFIG
  - [ ] その他のFirebase関連環境変数

- [ ] Vercel側の環境変数設定
  - [ ] VITE_FIREBASE_CONFIG
  - [ ] VITE_FIREBASE_API_KEY
  - [ ] VITE_FIREBASE_AUTH_DOMAIN
  - [ ] VITE_FIREBASE_PROJECT_ID
  - [ ] VITE_FIREBASE_STORAGE_BUCKET
  - [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
  - [ ] VITE_FIREBASE_APP_ID
  - [ ] VITE_NOTE_API_URL

### 8.2 デプロイ
- [ ] バックエンドのデプロイ（Render）
  - [ ] 新しいバージョンのデプロイ
  - [ ] マイグレーションの実行
  - [ ] 動作確認
- [ ] フロントエンドのデプロイ（Vercel）
  - [ ] 新しいバージョンのデプロイ
  - [ ] 動作確認

### 8.3 ドキュメント更新
- [ ] API仕様書の更新
- [ ] 環境変数リストの更新
- [ ] デプロイ手順の更新 