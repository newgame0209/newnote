# しゃべるノート：認証機能実装計画

## 1. 現状分析

### データベース構造

#### note-backend
現在のテーブル構造:
- `notes`: ノートのメタデータを管理
  - id: プライマリーキー
  - title: ノートのタイトル
  - main_category: メインカテゴリ
  - sub_category: サブカテゴリ
  - created_at: 作成日時
  - updated_at: 更新日時
- `pages`: ノート内の各ページのデータを管理
  - id: プライマリーキー
  - note_id: 所属するノートのID（外部キー）
  - page_number: ページ番号
  - content: ページの内容（キャンバスデータ）
  - layout_settings: レイアウト設定
- `bookmarks`: ノート内のしおりを管理
  - id: プライマリーキー
  - note_id: 所属するノートのID（外部キー）
  - page_id: 所属するページのID（外部キー）
  - page_number: ページ番号
  - position_x: キャンバス上のX座標位置
  - position_y: キャンバス上のY座標位置
  - title: しおりのタイトル
  - is_favorite: お気に入り設定
  - created_at: 作成日時

#### memo-backend
現在のテーブル構造:
- `memos`: メモのメタデータを管理
  - id: プライマリーキー
  - title: メモのタイトル
  - content: メモの内容
  - main_category: メインカテゴリ
  - sub_category: サブカテゴリ
  - created_at: 作成日時
  - updated_at: 更新日時
- `memo_pages`: メモ内の各ページを管理
  - id: プライマリーキー
  - memo_id: 所属するメモのID（外部キー）
  - page_number: ページ番号
  - content: ページの内容
  - created_at: 作成日時
  - updated_at: 更新日時

### API エンドポイント

#### note-backend
- `/api/notes` (GET): ノート一覧の取得
- `/api/notes` (POST): 新規ノート作成
- `/api/notes/<note_id>` (GET): 特定ノートの取得
- `/api/notes/<note_id>` (PUT): ノート情報の更新
- `/api/notes/<note_id>` (DELETE): ノートの削除
- `/api/notes/<note_id>/pages` (POST): ノートに新規ページ追加
- `/api/notes/<note_id>/pages/<page_id>` (GET): 特定ページの取得
- `/api/notes/<note_id>/pages/<page_id>` (PUT): ページ内容の更新
- `/api/notes/<note_id>/pages/<page_id>` (DELETE): ページの削除
- `/api/bookmarks`: ブックマーク操作
- `/api/tts`: テキスト読み上げ機能
- `/api/ocr`: 手書き文字認識機能

#### memo-backend
- `/api/memos` (GET): メモ一覧の取得
- `/api/memos` (POST): 新規メモ作成
- `/api/memos/list` (GET): メモ一覧の取得（別形式）
- `/api/memos/<memo_id>` (GET): 特定メモの取得
- `/api/memos/<memo_id>` (PUT): メモ情報の更新
- `/api/memos/<memo_id>` (DELETE): メモの削除
- `/api/memos/<memo_id>/pages` (GET/POST): メモページの取得/作成
- `/api/memos/<memo_id>/pages/<page_number>` (GET/PUT/DELETE): 特定メモページの操作

### CORS設定
- Origins: `https://mynote-psi-three.vercel.app`, `http://localhost:3000`
- 認証情報サポート: True
- メソッド: GET, POST, PUT, DELETE, OPTIONS
- ヘッダー: Content-Type, Authorization, X-Requested-With

### フロントエンド
- 現在のルート構成:
  - `/`: ホーム画面
  - `/edit/:noteId`: ノートエディタ
  - `/memo/edit/:memoId`: メモエディタ
- 認証関連のルートはまだ実装されていない

### デプロイ情報

#### フロントエンド
- デプロイURL: https://mynote-psi-three.vercel.app/
- デプロイ先: Vercel
- 環境変数:
  - `VITE_NOTE_API_URL`: https://newnote-backend.onrender.com/api
  - `VITE_MEMO_API_URL`: https://memo-backend-7va4.onrender.com/api
  - `VITE_APP_NAME`: しゃべるノート
  - `VITE_APP_VERSION`: 1.0.0

#### ノートバックエンド
- デプロイURL: https://newnote-backend.onrender.com
- デプロイ先: Render
- 環境変数:
  - `APP_DEBUG`: false
  - `APP_ENV`: production
  - `DATABASE_URL`: sqlite:///notes.db
  - `GOOGLE_APPLICATION_CREDENTIALS`: [Google Cloud認証情報]
  - `GOOGLE_CLIENT_ID`: 996683698857-ntesivverlnv2vrvqse18vra7lcq35nt.apps.googleusercontent.com
  - `GOOGLE_CLIENT_SECRET`: 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
  - `GOOGLE_CLOUD_PROJECT`: amiable-hour-446600

#### メモバックエンド
- デプロイURL: https://memo-backend-7va4.onrender.com
- デプロイ先: Render
- 環境変数:
  - `DATABASE_URL`: sqlite:///memo.db
  - `DEBUG`: false
  - `FLASK_ENV`: production
  - `GOOGLE_APPLICATION_CREDENTIALS`: [Google Cloud認証情報]
  - `GOOGLE_CLIENT_ID`: 996683698857-ntesivverlnv2vrvqse18vra7lcq35nt.apps.googleusercontent.com
  - `GOOGLE_CLIENT_SECRET`: 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
  - `GOOGLE_CLOUD_PROJECT`: amiable-hour-446600

## 2. 新機能要件

1. ユーザーはメール登録またはGoogle連携で登録可能
2. ユーザーは自分が作成したノート・メモのみ閲覧・編集可能
3. 登録後はノート一覧・メモ一覧ページに遷移
4. 未登録ユーザーはサービス利用不可

## 3. 実装計画

### 3.1 Supabaseの導入

[Supabase](https://supabase.io/)は、Firebase代替のオープンソースプラットフォームで、認証機能を提供します。認証機能の実装を簡素化するために採用します。

#### Supabaseプロジェクトのセットアップ

1. Supabaseアカウント作成とプロジェクト作成
2. 認証設定
   - メール/パスワード認証の有効化
   - Google認証の有効化（既存のクライアントIDとシークレットを使用）
   - リダイレクトURLの設定: `https://mynote-psi-three.vercel.app/auth/callback`
3. CORSの設定
   - `https://mynote-psi-three.vercel.app`
   - `http://localhost:3000`（開発用）

### 3.2 データベース設計

既存のデータベース構造を維持しつつ、ユーザー認証情報を関連付けるための変更を行います。

#### note-backendの変更

1. notesテーブルにuser_idカラムを追加
```sql
ALTER TABLE notes ADD COLUMN user_id VARCHAR(36);
CREATE INDEX idx_notes_user_id ON notes(user_id);
```

2. pagesテーブルはnotesテーブルとの関連で間接的にユーザーと紐づく
3. bookmarksテーブルもnotesテーブルとの関連で間接的にユーザーと紐づく

#### memo-backendの変更

1. memosテーブルにuser_idカラムを追加
```sql
ALTER TABLE memos ADD COLUMN user_id VARCHAR(36);
CREATE INDEX idx_memos_user_id ON memos(user_id);
```

2. memo_pagesテーブルはmemosテーブルとの関連で間接的にユーザーと紐づく

#### マイグレーションスクリプト

note-backend用のマイグレーションスクリプト:
```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('notes', sa.Column('user_id', sa.String(36), nullable=True))
    op.create_index('idx_notes_user_id', 'notes', ['user_id'])

def downgrade():
    op.drop_index('idx_notes_user_id', table_name='notes')
    op.drop_column('notes', 'user_id')
```

memo-backend用のマイグレーションスクリプト:
```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('memos', sa.Column('user_id', sa.String(36), nullable=True))
    op.create_index('idx_memos_user_id', 'memos', ['user_id'])

def downgrade():
    op.drop_index('idx_memos_user_id', table_name='memos')
    op.drop_column('memos', 'user_id')
```

### 3.3 バックエンドAPI拡張

#### セッション管理の実装

JWTではなく、シンプルなセッション管理を実装します。Flask-Sessionを使用してセッションを管理します。

```python
# app.py
from flask import Flask, session
from flask_session import Session

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # 環境変数から取得することを推奨
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
```

#### 認証ミドルウェア

```python
# middleware.py
from flask import request, session, g, jsonify
from functools import wraps

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "認証が必要です"}), 401
            
        g.user_id = session['user_id']
        return f(*args, **kwargs)
    return decorated_function
```

#### 認証エンドポイント

```python
# routes/auth.py
from flask import Blueprint, request, jsonify, session
from supabase_py import create_client

auth_bp = Blueprint('auth', __name__)
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
supabase = create_client(supabase_url, supabase_key)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Supabaseで認証
    result = supabase.auth.sign_in_with_email(email=email, password=password)
    
    if result.get('error'):
        return jsonify({"error": "認証に失敗しました"}), 401
    
    user = result.get('user')
    # セッションにユーザーIDを保存
    session['user_id'] = user.get('id')
    
    return jsonify({"success": True, "user": user})

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Supabaseでユーザー登録
    result = supabase.auth.sign_up(email=email, password=password)
    
    if result.get('error'):
        return jsonify({"error": "登録に失敗しました"}), 400
    
    return jsonify({"success": True, "message": "確認メールを送信しました"})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # セッションからユーザーIDを削除
    session.pop('user_id', None)
    return jsonify({"success": True})
```

#### APIエンドポイントの更新

note-backendとmemo-backendの両方で、認証ミドルウェアを使用してエンドポイントを保護します。

```python
# routes/notes.py
@app.route('/api/notes', methods=['GET'])
@auth_required
def get_notes():
    user_id = g.user_id
    notes = Note.query.filter_by(user_id=user_id).all()
    # 以下既存の処理

@app.route('/api/notes', methods=['POST'])
@auth_required
def create_note():
    data = request.get_json()
    note = Note(
        title=data['title'],
        main_category=data['main_category'],
        sub_category=data['sub_category'],
        user_id=g.user_id
    )
    # 以下既存の処理
```

### 3.4 フロントエンド実装

#### Supabaseクライアントの設定

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 認証コンテキスト

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

// 認証コンテキスト定義
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッションの確認
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    checkSession();

    // 認証状態変更のリスナー
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // 認証関連の関数
  const signIn = async (email, password) => {
    // 実装内容
  };

  const signUp = async (email, password) => {
    // 実装内容
  };

  const signOut = async () => {
    // 実装内容
  };

  const signInWithGoogle = async () => {
    // 実装内容
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

#### ログインページ

```tsx
// src/pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { signIn, signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-container">
      <h1>ログイン</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">ログイン</button>
      </form>
      <button onClick={signInWithGoogle} className="google-button">
        Googleでログイン
      </button>
      <p>
        アカウントをお持ちでない方は<Link to="/register">こちら</Link>
      </p>
    </div>
  );
};

export default Login;
```

#### 登録ページ

```tsx
// src/pages/Register.tsx
const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    }
  };

  // 実装内容
};
```

#### 認証コールバックハンドラー

```tsx
// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error('認証エラー:', error);
        navigate('/login');
      } else {
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <div>認証中...</div>;
};

export default AuthCallback;
```

#### 保護されたルート

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};
```

#### APIリクエストの更新

```typescript
// src/lib/api.ts
import axios from 'axios';
import { supabase } from './supabase';

// 認証トークンを取得する関数
const getAuthHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// APIリクエスト関数
export const getNotes = async () => {
  const authHeader = await getAuthHeader();
  const response = await axios.get(`${noteApiUrl}/notes`, authHeader);
  return response.data;
};

// 他のAPI関数...
```

### 3.5 環境変数の設定

#### フロントエンド（Vercel）

```
VITE_SUPABASE_URL=https://dartwusohlofuwppwukp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnR3dXNvaGxvZnV3cHB3dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxODg1MzksImV4cCI6MjA1Nzc2NDUzOX0.sjGOR3nvDXHJxb8aTo6A1-mknaCm3MBGEwQNnZ-Atk0
```

#### バックエンド（Render）

```
SUPABASE_URL=https://dartwusohlofuwppwukp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnR3dXNvaGxvZnV3cHB3dWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxODg1MzksImV4cCI6MjA1Nzc2NDUzOX0.sjGOR3nvDXHJxb8aTo6A1-mknaCm3MBGEwQNnZ-Atk0
FLASK_SECRET_KEY=your-secret-key  # 安全な値に変更してください
```

## 4. 実装手順

1. Supabaseプロジェクトのセットアップ
   - アカウント作成とプロジェクト作成
   - 認証設定（メール/パスワード、Google認証）
   - CORSの設定

2. バックエンド実装
   - 必要なパッケージのインストール
   - セッション管理の実装
   - 認証ミドルウェアの実装
   - APIエンドポイントの更新

3. フロントエンド実装
   - 必要なパッケージのインストール
   - 認証コンテキストの実装
   - ログイン・登録ページの作成
   - 認証コールバックの実装
   - ルーティングの更新

4. テスト
   - ユーザー登録・ログインフローのテスト
   - Google認証フローのテスト
   - 保護されたAPIエンドポイントのテスト

5. デプロイ
   - 環境変数の設定
   - フロントエンドのデプロイ
   - バックエンドのデプロイ

## 5. 注意点と対策

### セキュリティ
- Supabaseの適切なRLSポリシー設定
- JWTトークンの適切な検証
- 環境変数の安全な管理

### パフォーマンス
- 認証状態のキャッシュ
- APIリクエストの最適化

### 互換性
- 既存のAPIエンドポイントの互換性維持
- フロントエンドでの認証状態チェックの適切な実装

### デプロイ計画
- データベースマイグレーションスクリプトの作成
- 段階的なデプロイ（バックエンド→フロントエンド）

## 6. 今後の拡張性

1. ユーザープロファイル管理機能
2. パスワードリセット機能
3. 2要素認証
4. ソーシャルログイン（Twitter、Facebookなど）の追加
