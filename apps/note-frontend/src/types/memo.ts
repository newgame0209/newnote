/**
 * @docs
 * メモのページデータ
 */
export interface MemoPage {
  id?: number;          // ページID
  memo_id?: number;     // メモID
  page_number: number;  // ページ番号
  content: string;      // ページの内容
  created_at?: string;  // 作成日時
  updated_at?: string;  // 更新日時
}

/**
 * @docs
 * メモ本体の型定義
 */
export interface Memo {
  id: number;
  title: string;
  content: string;      // 互換性のために残す（1ページ目の内容と同期）
  pages?: MemoPage[];   // 複数ページのデータ
  mainCategory?: string;
  subCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @docs
 * メモ作成時のデータ
 */
export interface CreateMemoData {
  title: string;
  content?: string;
  pages?: MemoPage[];   // 複数ページのデータ
  mainCategory?: string;
  subCategory?: string;
}

/**
 * @docs
 * メモ更新時のデータ
 */
export interface UpdateMemoData {
  title?: string;
  content?: string;
  pages?: MemoPage[];   // 更新するページデータ
  mainCategory?: string;
  subCategory?: string;
}
