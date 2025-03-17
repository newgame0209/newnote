# 実装計画書

## 現状の整理

### 実装済み機能
1. ノート機能
   - 一覧表示
   - 編集ページ
   - DB設定（note.db）
   - API実装（PORT: 5001）

2. メモ機能
   - 編集ページのみ
   - DB設定（memo.db）
   - API実装（PORT: 5002）

## 実装タスク詳細

### 1. メモ作成モーダル実装

#### 基本方針
- ノート作成モーダルのデザインを踏襲
- 色味のみ変更（メモ用のテーマカラー）
- 同じ設定項目（タイトル、メイン/サブカテゴリ）を使用

#### 実装内容
```typescript
// memo/src/components/MemoModal/index.tsx
interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memo: CreateMemoDto) => void;
}

const MemoModal: React.FC<MemoModalProps> = ({ isOpen, onClose, onSubmit }) => {
  // ノートモーダルと同じ構造で実装
};
```

### 2. タブ切り替えとデータ取得の実装

#### 基本方針
- タブ切り替え時の即時表示のためのキャッシュ実装
- 両方のデータを事前にフェッチ
- メモ一覧表示の追加

#### 実装内容
```typescript
// frontend/src/hooks/useTabData.ts
const useTabData = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [activeTab, setActiveTab] = useState<'note' | 'memo'>('note');

  // 初期ロード時に両方のデータをフェッチ
  useEffect(() => {
    const fetchData = async () => {
      const [notesData, memosData] = await Promise.all([
        noteApi.getNotes(),
        memoApi.getMemos()
      ]);
      setNotes(notesData);
      setMemos(memosData);
    };
    fetchData();
  }, []);

  return { notes, memos, activeTab, setActiveTab };
};
```

### 3. ソート機能の実装

#### 基本方針
- ノートとメモで同じソートUIを使用
- ソートロジックは共通のユーティリティとして実装
- 型の違いを吸収する共通インターフェースを定義

#### 実装内容
```typescript
// frontend/src/types/common.ts
interface Sortable {
  mainCategory: string;
  subCategory: string;
  createdAt: Date;
  updatedAt: Date;
}

// frontend/src/utils/sort.ts
export const sortItems = <T extends Sortable>(
  items: T[],
  sortType: 'category' | 'date'
): T[] => {
  return [...items].sort((a, b) => {
    if (sortType === 'category') {
      return a.mainCategory.localeCompare(b.mainCategory);
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};
```

### 4. メモ編集ページの自動保存

#### 基本方針
- 入力後1秒間の待機時間を設けて自動保存
- 保存中のインジケータ表示
- エラー時のリトライ機能

#### 実装内容
```typescript
// memo/src/hooks/useAutoSave.ts
const useAutoSave = (memoId: number, content: string) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        await memoApi.updateMemo(memoId, { content });
        setSaving(false);
      } catch (err) {
        setError(err as Error);
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, memoId]);

  return { saving, error };
};
```

## 事前確認事項と注意点

### 1. 既存コードの確認

#### ノートモーダル
- 受け取っているpropsの確認
- 適用されているスタイリング
- 状態管理の実装方法
- カテゴリの選択肢とバリデーションルール

#### ソート機能
- カテゴリと日付のソートロジック
- 状態管理の方法
- UIコンポーネントの構造

### 2. ルーティング構造
```
/              → 一覧ページ
/note/edit/:id → ノート編集
/memo/edit/:id → メモ編集（新規追加予定）
```

### 3. データフローの確認
- タブ切り替え時のデータ取得タイミング
- キャッシュの保持期間
- メモリ使用量の考慮

### 4. 実装時の注意点

#### ファイル配置
```
frontend/src/  → ノート関連
memo/src/     → メモ関連
```
- 間違えてファイルを配置しないよう注意
- 共通コンポーネントの配置場所を明確に

#### 型定義の分離
- `Note`型と`Memo`型を明確に分離
- 共通インターフェース（`Sortable`）の適切な設計
- 型の混在を防ぐ

#### APIエンドポイント
- ノートAPI: `http://localhost:5001/api`
- メモAPI: `http://localhost:5002/api`
- APIクライアントの分離を維持

## テスト項目

### 1. モーダル機能
- 作成処理の動作確認
- バリデーションの確認
- 編集ページへの遷移

### 2. タブ切り替え
- データ表示の即時性
- キャッシュの動作
- 表示の切り替わり

### 3. ソート機能
- カテゴリソートの動作
- 日付ソートの動作
- 両タブでの一貫性

### 4. 自動保存
- 保存タイミング
- エラー時の動作
- ユーザーへのフィードバック

## 実装スケジュール

1. メモ作成モーダル（2時間）
   - コンポーネント作成
   - スタイリング
   - API連携

2. タブ切り替えとデータ取得（3時間）
   - データ管理フック
   - メモ一覧コンポーネント
   - キャッシュ実装

3. ソート機能（2時間）
   - インターフェース定義
   - ソートロジック実装
   - UI統合

4. 自動保存機能（2時間）
   - 自動保存フック
   - エラーハンドリング
   - UI実装

合計見積もり時間：9時間

## 開発環境の確認

### 必要なツール・バージョン
- Node.js
- TypeScript
- React
- SQLite

### データベース
- note.db: ノート用DB（PORT: 5001）
- memo.db: メモ用DB（PORT: 5002）
- 各DBのスキーマ構造の確認

### 開発サーバー
- フロントエンド: `http://localhost:3000`
- ノートAPI: `http://localhost:5001/api`
- メモAPI: `http://localhost:5002/api`

## リスク管理

### 想定されるリスク
1. **データの整合性**
   - ノートとメモのデータが混在するリスク
   - 解決策：型定義の厳密な管理、APIクライアントの分離

2. **パフォーマンス**
   - タブ切り替え時のデータ取得による遅延
   - 解決策：事前フェッチとキャッシュ戦略の実装

3. **UX**
   - タブ切り替え時のちらつき
   - 解決策：適切なローディング状態の表示

4. **自動保存**
   - ネットワークエラー時のデータ損失
   - 解決策：ローカルストレージでのバックアップ

## 将来の拡張性

### 考慮すべき将来の機能追加
1. **検索機能**
   - ノートとメモの横断検索
   - カテゴリベースの検索

2. **フィルタリング**
   - より詳細なカテゴリフィルター
   - 日付範囲でのフィルター

3. **データ連携**
   - ノートとメモの相互リンク
   - 関連コンテンツの表示

## デプロイ時の注意点

1. **環境変数**
   - API エンドポイントの設定
   - ポート番号の管理

2. **データベース**
   - マイグレーションの手順
   - バックアップ方法

3. **パフォーマンス**
   - バンドルサイズの最適化
   - キャッシュ戦略の確認
