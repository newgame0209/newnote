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
  credentials: 'include',
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
        throw new Error('メモ一覧の取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error('メモ一覧の取得に失敗しました:', error);
      throw new Error('メモ一覧の取得に失敗しました');
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
        throw new Error('メモの作成に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
      throw new Error('メモの作成に失敗しました');
    }
  },

  /**
   * メモを取得
   */
  getMemo: async (id: number): Promise<Memo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        throw new Error('メモの取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})の取得に失敗しました:`, error);
      throw new Error('メモの取得に失敗しました');
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
        throw new Error('メモの更新に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})の更新に失敗しました:`, error);
      throw new Error('メモの更新に失敗しました');
    }
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('DELETE'));
      
      if (!response.ok) {
        throw new Error('メモの削除に失敗しました');
      }
    } catch (error) {
      console.error(`メモ(ID: ${id})の削除に失敗しました:`, error);
      throw new Error('メモの削除に失敗しました');
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
        throw new Error('メモのページ一覧の取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ一覧の取得に失敗しました:`, error);
      throw new Error('メモのページ一覧の取得に失敗しました');
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
        throw new Error('メモのページの取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})の取得に失敗しました:`, error);
      throw new Error('メモのページの取得に失敗しました');
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
        throw new Error('メモへの新規ページ追加に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})への新規ページ追加に失敗しました:`, error);
      throw new Error('メモへの新規ページ追加に失敗しました');
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
        throw new Error('メモのページの更新に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})の更新に失敗しました:`, error);
      throw new Error('メモのページの更新に失敗しました');
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
        throw new Error('メモのページの削除に失敗しました');
      }
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})の削除に失敗しました:`, error);
      throw new Error('メモのページの削除に失敗しました');
    }
  }
};

export default memoApi;
