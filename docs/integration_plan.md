# フロントエンド・バックエンド統合計画

## 概要
このドキュメントは、フロントエンドとバックエンドの統合作業の計画と、各工程で必要な情報をまとめたものです。

## 優先順位とフェーズ

### フェーズ1: ノートデータの永続化
**優先度: A（最重要）**

#### 既存の実装状況
1. バックエンド
   ```sql
   -- Noteテーブル
   CREATE TABLE notes (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       title TEXT NOT NULL,
       main_category TEXT NOT NULL,
       sub_category TEXT NOT NULL,
       paper_size TEXT NOT NULL DEFAULT 'A4',
       orientation TEXT NOT NULL DEFAULT 'portrait',
       color TEXT NOT NULL DEFAULT 'white',
       last_edited_page INTEGER NOT NULL DEFAULT 1,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Pageテーブル
   CREATE TABLE pages (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       note_id INTEGER NOT NULL,
       page_number INTEGER NOT NULL,
       content TEXT NOT NULL,
       layout_settings TEXT,
       FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
   );
   ```

2. APIエンドポイント
   ```
   POST /api/notes
   - リクエスト: { title, main_category, sub_category, paper_size, orientation, color }
   - レスポンス: { note_id, created_at }

   GET /api/notes/{id}
   - レスポンス: { id, title, main_category, sub_category, paper_size, orientation, color, last_edited_page, created_at, updated_at }

   PUT /api/notes/{id}
   - リクエスト: { title?, main_category?, sub_category?, paper_size?, orientation?, color?, last_edited_page? }
   - レスポンス: { updated_at }

   DELETE /api/notes/{id}
   - レスポンス: { success: true }
   ```

#### 実装手順
1. APIクライアントの実装（`src/api/notes.ts`）
2. NoteContextの拡張（`src/contexts/NoteContext.tsx`）
3. Home.tsxの機能拡張（`src/components/Home.tsx`）

#### 注意点
- 既存のNoteContextインターフェースは変更しない
- エラー時はフォールバックとしてメモリ上の状態を維持
- バリデーションはフロントエンド側でも実装
- 自動保存の際はデータ量を考慮（debounce実装）

### フェーズ2: キャンバスデータの永続化
**優先度: A（最重要）**

#### 既存の実装状況
1. APIエンドポイント
   ```
   POST /api/notes/{id}/pages
   - リクエスト: { page_number, content, layout_settings }
   - レスポンス: { page_id }

   GET /api/notes/{id}/pages/{page_number}
   - レスポンス: { content, layout_settings }

   PUT /api/notes/{id}/pages/{page_number}
   - リクエスト: { content, layout_settings }
   - レスポンス: { updated_at }
   ```

2. キャンバスデータ形式
   ```typescript
   interface CanvasData {
     objects: Array<{
       type: string;
       path?: string;
       text?: string;
       // その他Fabric.jsの属性
     }>;
     background: string;
   }
   ```

#### 実装手順
1. APIクライアントの拡張（`src/api/pages.ts`）
2. NoteEditor.tsxの拡張（`src/components/NoteEditor.tsx`）

#### 注意点
- キャンバスデータは圧縮して保存
- 自動保存は定期的に実行（5秒間隔）
- ページ切り替え時に保存
- オフライン対応としてローカルストレージにもバックアップ

### フェーズ3: OCR機能の統合
**優先度: B**

#### 既存の実装状況
1. APIエンドポイント
   ```
   POST /api/notes/{id}/pages/{page_number}/ocr
   - リクエスト: { image: base64 }
   - レスポンス: { text: string }
   ```

#### 実装手順
1. OCRクライアントの実装（`src/api/ocr.ts`）
2. NoteEditor.tsxへの機能追加

#### 注意点
- 画像データは適切なサイズに圧縮
- OCR処理中はプログレス表示
- エラー時は再試行可能に
- 大きな画像の場合は警告表示

### フェーズ4: TTS機能の統合
**優先度: B**

#### 既存の実装状況
1. APIエンドポイント
   ```
   POST /api/notes/{id}/pages/{page_number}/tts
   - リクエスト: {
       text: string,
       voice: {
         language_code: string,
         name: string,
         ssml_gender: string
       }
     }
   - レスポンス: { audio_url: string }
   ```

#### 実装手順
1. TTSクライアントの実装（`src/api/tts.ts`）
2. 音声再生機能の実装

#### 注意点
- 音声データのキャッシュ
- 再生状態の管理
- ネットワークエラーのハンドリング
- 長文の場合は分割処理

### フェーズ5: エラーハンドリングとUI改善
**優先度: C**

#### 実装手順
1. エラー表示コンポーネント
2. ローディング表示の改善

#### 注意点
- エラーメッセージは全て日本語
- ユーザーフレンドリーなメッセージ
- リトライ機能の実装
- オフライン状態の考慮

## 共通の注意点

### 1. エラーハンドリング
- ネットワークエラー
- バリデーションエラー
- タイムアウト
- 権限エラー

### 2. パフォーマンス
- 不要な再レンダリングの防止
- データの適切なキャッシュ
- 大きなデータの分割送信

### 3. セキュリティ
- 入力値のバリデーション
- CSRF対策
- XSS対策

### 4. テスト
- 単体テスト
- 統合テスト
- エッジケースの確認

## データ構造の最適化

### 現状の課題
- 未実装機能（用紙設定など）のデータが含まれている
- フロントエンドとバックエンドでデータ構造が異なる

### 対応計画
1. Noteインターフェースの簡素化
   - 必要最小限のフィールドのみを残す
   ```typescript
   interface Note {
     note_id: number;
     title: string;
     main_category: string;
     sub_category: string;
     created_at: string;
     updated_at: string;
   }
   ```

2. 新規作成モーダルの修正
   - 用紙設定関連（サイズ、色、向き）の入力項目を削除
   - タイトルとカテゴリーのみの入力フォームに簡素化

## NoteContextの拡張

### 機能追加
1. API通信の統合
   - バックエンドAPIとの連携処理を追加
   - ローディング状態の管理を追加
   - エラーハンドリングの実装

2. CRUD操作の実装
   - addNote: ノートの新規作成
   - deleteNote: ノートの削除
   - updateNote: ノートの更新
   - fetchNote: 特定のノートの取得

### エラーハンドリング
- API通信エラーの適切な処理
- ユーザーへのエラーメッセージ表示（日本語）

## 実装手順

1. データ構造の修正
   - Note型の定義を更新
   - 関連コンポーネントの型定義を修正

2. 新規作成モーダルの修正
   - 不要な入力項目の削除
   - データ送信処理の修正

3. NoteContextの実装
   - API通信の統合
   - 状態管理の拡張
   - エラーハンドリングの追加

4. 動作確認
   - CRUD操作の確認
   - エラーケースの確認
   - ユーザー体験の確認

## 将来の拡張性

### 用紙設定機能
- 実装時期が決まった段階で以下を追加
  - 用紙サイズ（A4, A3, A7）
  - 用紙の向き（縦、横）
  - 用紙の色（白、黄色）
- データベーススキーマの変更
- UIコンポーネントの追加

### 注意点
- 段階的な実装を心がける
- 既存機能への影響を最小限に抑える
- ユーザー体験を重視した設計を行う
