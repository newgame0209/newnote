# プロジェクト情報

## デプロイ情報

### フロントエンド

- **デプロイURL**: https://mynote-psi-three.vercel.app/
- **デプロイ先**: Vercel

#### 環境変数設定
- `VITE_NOTE_API_URL`: https://newnote-backend.onrender.com/api
- `VITE_MEMO_API_URL`: https://memo-backend-7va4.onrender.com/api
- `VITE_APP_NAME`: しゃべるノート
- `VITE_APP_VERSION`: 1.0.0
- `VITE_FIREBASE_AUTH_DOMAIN`: newnote-auth.firebaseapp.com
- `VITE_FIREBASE_PROJECT_ID`: newnote-auth

### バックエンド

#### ノートバックエンド
- **デプロイURL**: https://newnote-backend.onrender.com
- **デプロイ先**: Render

#### メモバックエンド
- **デプロイURL**: https://memo-backend-7va4.onrender.com
- **デプロイ先**: Render

#### 環境変数設定（共通）
- `APP_DEBUG`: false
- `APP_ENV`: production
- `DATABASE_URL`: sqlite:///notes.db (note-backend) / sqlite:///memo.db (memo-backend)
- `GOOGLE_APPLICATION_CREDENTIALS`: [非表示 - 機密情報]
- `GOOGLE_CLOUD_PROJECT`: amiable-hour-446600
- `CORS_ORIGINS`: https://mynote-psi-three.vercel.app,http://localhost:3000

## データベース構造

### ノートバックエンド

#### テーブル構造
- `notes`: ノートのメタデータを管理
  - `id`: 主キー
  - `title`: ノートのタイトル
  - `created_at`: 作成日時
  - `updated_at`: 更新日時
  - `user_id`: ユーザーID（Firebase認証のUID）

- `pages`: ノートのページを管理
  - `id`: 主キー
  - `note_id`: 外部キー（notesテーブルのid）
  - `page_number`: ページ番号
  - `content`: ページの内容（リッチテキスト）
  - `created_at`: 作成日時
  - `updated_at`: 更新日時

- `bookmarks`: ブックマーク管理
  - `id`: 主キー
  - `note_id`: 外部キー（notesテーブルのid）
  - `name`: ブックマーク名
  - `created_at`: 作成日時
  - `user_id`: ユーザーID（Firebase認証のUID）

### メモバックエンド

#### テーブル構造
- `memos`: メモのメタデータを管理
  - `id`: 主キー
  - `title`: メモのタイトル
  - `created_at`: 作成日時
  - `updated_at`: 更新日時
  - `user_id`: ユーザーID（Firebase認証のUID）

- `memopages`: メモのページを管理
  - `id`: 主キー
  - `memo_id`: 外部キー（memosテーブルのid）
  - `page_number`: ページ番号
  - `content`: ページの内容（リッチテキスト）
  - `created_at`: 作成日時
  - `updated_at`: 更新日時

## 技術スタック

### フロントエンド
- **フレームワーク**: React + Vite
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: Firebase Authentication
- **状態管理**: React Context API

### バックエンド
- **フレームワーク**: Flask
- **言語**: Python
- **データベース**: SQLite
- **認証**: Firebase Admin SDK
- **API形式**: RESTful API

## API情報

### ノートバックエンドAPI

#### ノート関連
- `GET /api/notes`: ノート一覧取得
- `POST /api/notes`: 新規ノート作成
- `GET /api/notes/:id`: 指定ノート取得
- `PUT /api/notes/:id`: ノート更新
- `DELETE /api/notes/:id`: ノート削除

#### ページ関連
- `GET /api/notes/:id/pages/:page_number`: ページ取得
- `PUT /api/notes/:id/pages/:page_number`: ページ更新
- `POST /api/notes/:id/pages/:page_number/ocr`: OCR処理

#### 認証関連
- `GET /api/auth/check`: 認証状態確認
- `GET /api/auth/me`: ユーザー情報取得

### メモバックエンドAPI

#### メモ関連
- `GET /api/memo`: メモ一覧取得
- `POST /api/memo`: 新規メモ作成
- `GET /api/memo/:id`: 指定メモ取得
- `PUT /api/memo/:id`: メモ更新
- `DELETE /api/memo/:id`: メモ削除

#### ページ関連
- `GET /api/memo/:id/pages/:page_number`: ページ取得
- `PUT /api/memo/:id/pages/:page_number`: ページ更新

## セキュリティ情報

- 認証にはFirebase Authenticationを使用
- バックエンドAPIはFirebase認証トークンによる認証が必要
- データへのアクセスはユーザーIDに基づく所有権チェックあり
- APIエンドポイントはCORSによる保護あり 