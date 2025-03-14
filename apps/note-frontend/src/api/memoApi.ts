/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

// APIのベースURL
export const API_BASE_URL = import.meta.env.VITE_MEMO_API_URL || 'https://memo-backend-7va4.onrender.com';

// CORSオプションを設定
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  credentials: 'include' as RequestCredentials,
  mode: 'cors' as RequestMode
};

/**
 * 認証トークン付きのリクエストオプションを取得
 */
const getAuthOptions = (method: string, body?: any): RequestInit => {
  const token = localStorage.getItem('token');
  
  return {
    method,
    ...defaultOptions,
    headers: {
      ...defaultOptions.headers as Record<string, string>,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
};

/**
 * メモAPIクライアント
 */
const memoApi = {
  /**
   * メモ一覧を取得
   */
  getMemos: async (): Promise<Memo[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/list`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモ一覧取得エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモ一覧の取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error('メモ一覧取得中のエラー:', error);
      throw error;
    }
  },

  /**
   * メモを作成
   */
  createMemo: async (data: CreateMemoData): Promise<Memo> => {
    try {
      const body = {
        title: data.title,
        content: data.content || '',
        main_category: data.mainCategory,
        sub_category: data.subCategory
      };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos`, getAuthOptions('POST', body));
      
      if (!response.ok) {
        console.error('メモ作成エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモの作成に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error('メモ作成中のエラー:', error);
      throw error;
    }
  },

  /**
   * メモを取得
   */
  getMemo: async (id: number): Promise<Memo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモ取得エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモの取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})の取得中のエラー:`, error);
      throw error;
    }
  },

  /**
   * メモを更新
   */
  updateMemo: async (id: number, data: UpdateMemoData): Promise<Memo> => {
    try {
      const body = {
        title: data.title,
        content: data.content,
        main_category: data.mainCategory,
        sub_category: data.subCategory
      };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('PUT', body));
      
      if (!response.ok) {
        console.error('メモ更新エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモの更新に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})の更新中のエラー:`, error);
      throw error;
    }
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('DELETE'));
      
      if (!response.ok) {
        console.error('メモ削除エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモの削除に失敗しました');
      }
    } catch (error) {
      console.error(`メモ(ID: ${id})の削除中のエラー:`, error);
      throw error;
    }
  },

  /**
   * @docs
   * メモの全てのページを取得
   * @param id メモID
   */
  getMemoPages: async (id: number): Promise<MemoPage[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモページ一覧取得エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモのページ一覧の取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ一覧取得中のエラー:`, error);
      throw error;
    }
  },

  /**
   * @docs
   * メモの特定ページを取得
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   */
  getMemoPage: async (id: number, pageNumber: number): Promise<MemoPage> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモページ取得エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモのページの取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})取得中のエラー:`, error);
      throw error;
    }
  },

  /**
   * @docs
   * メモに新しいページを追加
   * @param id メモID
   * @param content ページの内容
   */
  addMemoPage: async (id: number, content: string = ''): Promise<MemoPage> => {
    try {
      const body = { content };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages`, getAuthOptions('POST', body));
      
      if (!response.ok) {
        console.error('メモページ追加エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモへの新規ページ追加に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})への新規ページ追加中のエラー:`, error);
      throw error;
    }
  },

  /**
   * @docs
   * メモの特定ページを更新
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   * @param content 更新内容
   */
  updateMemoPage: async (id: number, pageNumber: number, content: string): Promise<MemoPage> => {
    try {
      const body = { content };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('PUT', body));
      
      if (!response.ok) {
        console.error('メモページ更新エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモのページの更新に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})更新中のエラー:`, error);
      throw error;
    }
  },

  /**
   * @docs
   * メモの特定ページを削除
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   */
  deleteMemoPage: async (id: number, pageNumber: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('DELETE'));
      
      if (!response.ok) {
        console.error('メモページ削除エラー:', response.status, response.statusText);
        throw new Error(response.statusText || 'メモのページの削除に失敗しました');
      }
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})削除中のエラー:`, error);
      throw error;
    }
  }
};

export default memoApi;
