export interface Note {
  id: string;
  title: string;
  main_category: string;
  sub_category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title: string;
  main_category: string;
  sub_category: string;
}

/**
 * ノート内のしおり（ブックマーク）の型定義
 */
export interface Bookmark {
  id: number;
  note_id: number;
  page_id: number;
  page_number: number;
  position_x?: number;
  position_y?: number;
  title?: string;
  is_favorite: boolean;
  created_at: string;
}

/**
 * しおり作成時のデータ型
 */
export interface CreateBookmarkData {
  page_number: number;
  position_x?: number;
  position_y?: number;
  title?: string;
  is_favorite?: boolean;
}
