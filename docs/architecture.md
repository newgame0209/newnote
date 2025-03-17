# アプリケーションアーキテクチャ設計書

## 1. データベース設計

### 1.1 ノートアプリ

#### テーブル定義
```sql
-- notes テーブル
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    main_category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
);

-- pages テーブル
CREATE TABLE pages (
    id INTEGER PRIMARY KEY,
    note_id INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT,
    layout_settings JSON,
    FOREIGN KEY (note_id) REFERENCES notes(id)
);
```

#### モデル定義（Python）
```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Note(Base):
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    main_category = Column(String(50), nullable=False)
    sub_category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pages = relationship("Page", back_populates="note", cascade="all, delete-orphan")

class Page(Base):
    __tablename__ = 'pages'

    id = Column(Integer, primary_key=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text)
    layout_settings = Column(JSON)
    
    note = relationship("Note", back_populates="pages")
```

#### TypeScript型定義
```typescript
interface Note {
  id: number;
  title: string;
  mainCategory: string;
  subCategory: string;
  createdAt: Date;
  updatedAt: Date;
  pages?: Page[];
}

interface Page {
  id: number;
  noteId: number;
  pageNumber: number;
  content: string;
  layoutSettings: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  };
}
```

### 1.2 メモアプリ

#### テーブル定義
```sql
-- memos テーブル
CREATE TABLE memos (
    id INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL DEFAULT '無題',
    content TEXT,
    main_category VARCHAR(50),
    sub_category VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### モデル定義（Python）
```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from database import Base

class Memo(Base):
    __tablename__ = 'memos'

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False, default='無題')
    content = Column(Text)
    main_category = Column(String(50))
    sub_category = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### TypeScript型定義
```typescript
interface Memo {
  id: number;
  title: string;
  content: string;
  mainCategory?: string;
  subCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 2. ファイル構成

### 2.1 アプリケーション全体の構成
```
noteapp/
├── frontend/          # ノートアプリのフロントエンド
├── backend/           # ノートアプリのバックエンド
├── memo/             # メモアプリのフロントエンド
└── memo-backend/     # メモアプリのバックエンド
```

### 2.2 バックエンド構成

#### ノートアプリ
```
backend/
├── models/
│   ├── __init__.py
│   ├── database.py    # データベース設定、Base classの定義
│   └── note.py        # Note, Pageモデルの定義
├── routes/
│   ├── __init__.py
│   └── note.py        # ノート関連のAPIエンドポイント
└── config/
    └── database.py    # データベース接続設定
```

#### メモアプリ
```
memo-backend/
├── models/
│   ├── __init__.py
│   ├── database.py    # データベース設定、Base classの定義
│   └── memo.py        # Memoモデルの定義
├── routes/
│   ├── __init__.py
│   └── memo.py        # メモ関連のAPIエンドポイント
└── config/
    └── database.py    # データベース接続設定
```

### 2.3 フロントエンド構成

#### 共通の型定義とAPI通信
```
frontend/src/
├── types/
│   └── note.ts        # Note, Page interfaceの定義
└── api/
    └── note.ts        # ノートAPIとの通信処理
```

#### 一覧ページ（ノート/メモ共通）
```
frontend/src/
└── pages/
    └── Home/
        ├── index.tsx              # メインのページコンポーネント
        ├── components/
        │   ├── TabList.tsx        # ノート/メモ切り替えタブ
        │   ├── NoteList.tsx       # ノート一覧
        │   ├── MemoList.tsx       # メモ一覧
        │   ├── CategorySort.tsx   # カテゴリソート
        │   ├── DateSort.tsx       # 日付ソート
        │   └── ViewToggle.tsx     # グリッド/リスト表示切替
        ├── hooks/
        │   ├── useNotes.ts        # ノート一覧データ取得
        │   └── useMemos.ts        # メモ一覧データ取得
        └── styles/
            └── Home.module.css    # スタイル定義
```

#### ノート編集ページ
```
frontend/src/
└── pages/
    └── NoteEdit/
        ├── index.tsx              # メインのページコンポーネント
        ├── components/
        │   ├── Canvas/
        │   │   ├── index.tsx      # キャンバスコンポーネント
        │   │   ├── DrawingTools.tsx # 描画ツール
        │   │   └── CanvasControls.tsx # キャンバス操作
        │   ├── PageList.tsx       # ページ一覧
        │   └── NoteHeader.tsx     # ヘッダー（タイトル、保存等）
        ├── hooks/
        │   ├── useCanvas.ts       # キャンバス操作
        │   ├── useNote.ts         # ノートデータ取得・更新
        │   └── usePages.ts        # ページ操作
        └── styles/
            └── NoteEdit.module.css # スタイル定義
```

#### メモ編集ページ
```
memo/src/
└── pages/
    └── MemoEdit/
        ├── index.tsx              # メインのページコンポーネント
        ├── components/
        │   ├── Editor/
        │   │   ├── index.tsx      # エディタコンポーネント
        │   │   └── Toolbar.tsx    # 編集ツールバー
        │   └── MemoHeader.tsx     # ヘッダー（タイトル、保存等）
        ├── hooks/
        │   ├── useEditor.ts       # エディタ操作
        │   └── useMemo.ts         # メモデータ取得・更新
        └── styles/
            └── MemoEdit.module.css # スタイル定義
```

## 3. API設定

### 3.1 ノートアプリ

#### データベース設定
```python
# backend/config/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./note.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### APIエンドポイント設定
```typescript
// frontend/src/api/config.ts
export const API_ENDPOINT = 'http://localhost:5001/api';
```

### 3.2 メモアプリ

#### データベース設定
```python
# memo-backend/config/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./memo.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### APIエンドポイント設定
```typescript
// memo/src/api/config.ts
export const API_ENDPOINT = 'http://localhost:5002/api';
```

## 4. API通信処理の実装例

```typescript
// frontend/src/api/note.ts
export const noteApi = {
  // ノート一覧取得
  getNotes: async (): Promise<Note[]> => {
    const response = await fetch('/api/notes');
    return response.json();
  },

  // 個別ノート取得
  getNote: async (id: number): Promise<Note> => {
    const response = await fetch(`/api/notes/${id}`);
    return response.json();
  },

  // ノート更新
  updateNote: async (id: number, note: Partial<Note>): Promise<Note> => {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note)
    });
    return response.json();
  }
};
```

## 5. 主なAPIエンドポイント

### 一覧ページ
```typescript
GET /api/notes          // ノート一覧取得
GET /api/memos         // メモ一覧取得
```

### ノート編集ページ
```typescript
GET /api/notes/:id      // 個別ノート取得
PUT /api/notes/:id      // ノート更新
GET /api/notes/:id/pages // ページ一覧取得
PUT /api/notes/:id/pages/:pageId // ページ更新
```

### メモ編集ページ
```typescript
GET /api/memos/:id     // 個別メモ取得
PUT /api/memos/:id     // メモ更新
```
