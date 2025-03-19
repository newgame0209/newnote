# Firebase認証機能実装レビュー

## 1. アプリケーションの機能確認

### 1.1 一覧ページ
- ノートタブとメモタブの切り替え機能
- ノート一覧表示（カテゴリ別/新着順ソート）
- メモ一覧表示（カテゴリ別/新着順ソート）
- 設定機能（音声の男女変更、スピード調整）
- ノート作成/メモ作成機能（メインカテゴリ、サブカテゴリ、タイトル設定）

### 1.2 ノート機能
- ノート編集画面（ペンツール、消しゴム、マーカー、undo）
- 保存機能
- ページ追加（最大10ページ、スワイプ操作）
- OCR + 音声変換機能
- しおり機能（追加、一覧表示、削除、しおり箇所への遷移）

### 1.3 メモ機能
- メモ編集画面（テキスト入力）
- 保存機能
- ページ追加機能
- 音声変換機能（選択部分の音声変換含む）

## 2. 認証機能実装に伴う必要な変更

### 2.1 データベース変更
#### 2.1.1 ノートアプリ側（apps/note-backend）
- Noteモデル変更
  ```sql
  ALTER TABLE notes ADD COLUMN user_id VARCHAR(128) NOT NULL DEFAULT 'default_user';
  CREATE INDEX idx_notes_user_id ON notes (user_id);
  ```
- Pageモデル変更
  ```sql
  ALTER TABLE pages ADD COLUMN user_id VARCHAR(128) NOT NULL DEFAULT 'default_user';
  CREATE INDEX idx_pages_user_id ON pages (user_id);
  ```
- Bookmarkモデル変更
  ```sql
  ALTER TABLE bookmarks ADD COLUMN user_id VARCHAR(128) NOT NULL DEFAULT 'default_user';
  CREATE INDEX idx_bookmarks_user_id ON bookmarks (user_id);
  ```

#### 2.1.2 メモアプリ側（apps/memo-backend）
- Memoモデル変更
  ```sql
  ALTER TABLE memos ADD COLUMN user_id VARCHAR(128) NOT NULL DEFAULT 'default_user';
  CREATE INDEX idx_memos_user_id ON memos (user_id);
  ```
- MemoPageモデル変更
  ```sql
  ALTER TABLE memo_pages ADD COLUMN user_id VARCHAR(128) NOT NULL DEFAULT 'default_user';
  CREATE INDEX idx_memo_pages_user_id ON memo_pages (user_id);
  ```

### 2.2 API変更（ユーザーID紐付けが必要なエンドポイント）
#### 2.2.1 ノートアプリのAPIエンドポイント
| エンドポイント | メソッド | 変更内容 |
|----------------|----------|----------|
| `/api/notes` | GET | ユーザーIDフィルタリング追加 |
| `/api/notes` | POST | ユーザーID設定追加 |
| `/api/notes/<id>` | GET | 所有者チェック追加 |
| `/api/notes/<id>` | PUT | 所有者チェック追加 |
| `/api/notes/<id>` | DELETE | 所有者チェック追加 |
| `/api/notes/<id>/pages/<page_number>` | GET | 所有者チェック追加 |
| `/api/notes/<id>/pages/<page_number>` | PUT | 所有者チェック追加 |
| `/api/notes/<id>/pages/<page_number>` | DELETE | 所有者チェック追加 |
| `/api/notes/<id>/bookmarks` | GET | ユーザーIDフィルタリング追加 |
| `/api/notes/<id>/bookmarks` | POST | ユーザーID設定追加 |
| `/api/notes/<id>/bookmarks/<bookmark_id>` | GET | 所有者チェック追加 |
| `/api/notes/<id>/bookmarks/<bookmark_id>` | PUT | 所有者チェック追加 |
| `/api/notes/<id>/bookmarks/<bookmark_id>` | DELETE | 所有者チェック追加 |
| `/api/notes/<id>/pages/<page_number>/ocr` | POST | 所有者チェック追加 |
| `/api/tts` | POST | 認証チェック追加 |

#### 2.2.2 メモアプリのAPIエンドポイント
| エンドポイント | メソッド | 変更内容 |
|----------------|----------|----------|
| `/api/memo/memos` | GET | ユーザーIDフィルタリング追加 |
| `/api/memo/memos` | POST | ユーザーID設定追加 |
| `/api/memo/memos/<id>` | GET | 所有者チェック追加 |
| `/api/memo/memos/<id>` | PUT | 所有者チェック追加 |
| `/api/memo/memos/<id>` | DELETE | 所有者チェック追加 |
| `/api/memo/memos/<id>/pages` | GET | 所有者チェック追加 |
| `/api/memo/memos/<id>/pages` | POST | ユーザーID設定追加 |
| `/api/memo/memos/<id>/pages/<page_number>` | GET | 所有者チェック追加 |
| `/api/memo/memos/<id>/pages/<page_number>` | PUT | 所有者チェック追加 |
| `/api/memo/memos/<id>/pages/<page_number>` | DELETE | 所有者チェック追加 |

### 2.3 フロントエンドの変更
#### 2.3.1 API呼び出し修正
以下のAPI呼び出しに認証トークンを追加する必要があります：
- `apps/note-frontend/src/api/notes.ts`：ノート関連操作
- `apps/note-frontend/src/api/bookmarks.ts`：しおり関連操作
- `apps/note-frontend/src/api/memoApi.ts`：メモ関連操作

特に注意が必要なのが、ハードコードされたURLを使用している以下のAPI呼び出し：
```typescript
// OCR API呼び出し
const response = await axiosInstance.post<{ text: string }>(`https://newnote-backend.onrender.com/api/notes/${noteId}/pages/${pageNumber}/ocr`, { image: imageData });

// TTS API呼び出し
const response = await axiosInstance.post('https://newnote-backend.onrender.com/api/tts', {
  text,
  voice: {
    language_code: 'ja-JP',
    ...voiceConfig[voiceType]
  },
  audio_config: {
    speaking_rate: speakingRate
  }
}, {
  responseType: 'blob'
});
```

これらのURLをバックエンド環境変数に置き換え、かつ認証トークンを含める必要があります。

#### 2.3.2 認証状態管理
新たに追加が必要なコンポーネント：
- `src/contexts/AuthContext.tsx`：認証状態管理
- `src/components/auth/LoginForm.tsx`：ログインフォーム
- `src/components/auth/RegisterForm.tsx`：登録フォーム
- `src/components/common/ProtectedRoute.tsx`：認証済みユーザーのみアクセス可能なルート

### 2.4 CORS設定変更
現在のCORS設定：

#### 2.4.1 ノートアプリ側
```python
# apps/note-backend/app.py
CORS(app, 
     resources={
         r"/api/*": {
             "origins": ["https://mynote-psi-three.vercel.app", "http://localhost:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "*"],
             "expose_headers": ["Content-Type"],
             "max_age": 600,
             "supports_credentials": True
         }
     })

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://mynote-psi-three.vercel.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
```

#### 2.4.2 メモアプリ側
```python
# apps/memo-backend/app.py
CORS(app, 
     origins=["https://mynote-psi-three.vercel.app", "http://localhost:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
     supports_credentials=True)
```

#### 2.4.3 必要な変更点
- 両方のバックエンドでFirebaseの認証トークンを処理できるよう`Authorization`ヘッダーの許可を確実に設定
- 特に注意が必要なのは、ノートアプリ側の`@app.after_request`関数で固定されている`Access-Control-Allow-Origin`ヘッダー。複数のオリジンからのアクセスを許可する場合は、リクエストのOriginヘッダーに基づいて動的に設定するよう変更が必要

### 2.5 ハードコードされたAPIエンドポイントの変更
フロントエンド側でハードコードされたAPIエンドポイントの変更が必要です：

#### 2.5.1 OCR APIエンドポイント
```typescript
// 現在のコード
const response = await axiosInstance.post<{ text: string }>(`https://newnote-backend.onrender.com/api/notes/${noteId}/pages/${pageNumber}/ocr`, { image: imageData });

// 変更後
const response = await axiosInstance.post<{ text: string }>(`/notes/${noteId}/pages/${pageNumber}/ocr`, { image: imageData });
```

#### 2.5.2 TTS APIエンドポイント
```typescript
// 現在のコード
const response = await axiosInstance.post('https://newnote-backend.onrender.com/api/tts', {
  // ...パラメータ
});

// 変更後
const response = await axiosInstance.post('/tts', {
  // ...パラメータ
});
```

## 3. 抜けていた項目・追加確認点

### 3.1 環境変数設定の追加
Firebase認証のための環境変数をすべて設定する必要があります：

#### 3.1.1 フロントエンド（Vercel）
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_MEASUREMENT_ID=xxx
```

#### 3.1.2 バックエンド（Render）
```
FIREBASE_SERVICE_ACCOUNT_KEY=xxx（JSON形式、エスケープ処理必要）
```

### 3.2 既存データの移行方法
既存のデータを認証システム導入後も利用可能にするための移行方法を検討する必要があります：

1. **デフォルトユーザーIDの設定**：既存データに対してデフォルトのユーザーIDを設定
2. **管理者アカウントへの紐付け**：既存データを特定の管理者アカウントに紐付け
3. **ユーザー登録時の紐付け**：新規ユーザー登録時に、存在するデータのうち特定の条件に合致するものを自動的に紐付け

### 3.3 認証エラーハンドリングの追加
バックエンド側で認証エラーが発生した場合の適切なエラーメッセージとステータスコードを設定する必要があります：

- 401 Unauthorized：認証情報がない、または無効な場合
- 403 Forbidden：認証されているが、リソースへのアクセス権がない場合

### 3.4 トークン失効処理
トークン失効時の処理をフロントエンド側で実装する必要があります：

- 期限切れトークンの検出
- 自動リフレッシュ処理
- リフレッシュ失敗時のログアウト処理とユーザーへの通知

### 3.5 セキュリティ強化のために考慮すべき追加事項
1. **レート制限**：APIエンドポイントへのアクセス頻度を制限
2. **セッション管理**：アクティブセッション数を制限
3. **ログと監査**：認証関連のアクションをログに記録
4. **APIキー管理**：フロントエンドの環境変数のセキュリティ確保 