/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

// 環境変数からAPIのURL取得、またはデフォルト値を使用
// メモのバックエンドURLが異なる場合があるため、適切に設定
const API_BASE_URL = import.meta.env.VITE_MEMO_API_URL || 'https://memo-backend-7va4.onrender.com/api';

console.log('メモAPI設定:', {
  API_BASE_URL,
  token: localStorage.getItem('token') ? '存在します' : '存在しません'
});

/**
 * 認証情報付きのリクエストオプションを生成
 */
const getAuthOptions = (method: string, body?: any): RequestInit => {
  const token = localStorage.getItem('token');
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    credentials: 'include'
  };
  
  // トークンがある場合は追加
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // bodyがある場合は追加
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

/**
 * メモAPIの機能を提供するオブジェクト
 */
const memoApi = {
  /**
   * メモ一覧を取得
   */
  getMemos: async (): Promise<Memo[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/memo/memos`, getAuthOptions('GET'));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモ一覧の取得に失敗しました');
      }
      
      const data = await response.json();
      return data.memos || [];
    } catch (error: any) {
      console.error('メモ一覧取得エラー:', error);
      throw error;
    }
  },

  /**
   * メモを作成
   */
  createMemo: async (data: CreateMemoData): Promise<Memo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/memo/memos`, getAuthOptions('POST', data));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモの作成に失敗しました');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('メモ作成エラー:', error);
      throw error;
    }
  },

  /**
   * メモを取得
   */
  getMemo: async (id: number): Promise<Memo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/memo/memos/${id}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモの取得に失敗しました');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`メモ(ID: ${id})の取得エラー:`, error);
      throw error;
    }
  },

  /**
   * メモを更新
   */
  updateMemo: async (id: number, data: UpdateMemoData): Promise<Memo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/memo/memos/${id}`, getAuthOptions('PUT', data));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモの更新に失敗しました');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`メモ(ID: ${id})の更新エラー:`, error);
      throw error;
    }
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/memo/memos/${id}`, getAuthOptions('DELETE'));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモの削除に失敗しました');
      }
    } catch (error: any) {
      console.error(`メモ(ID: ${id})の削除エラー:`, error);
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
      const response = await fetch(`${API_BASE_URL}/memo/memos/${id}/pages`, getAuthOptions('GET'));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモページの取得に失敗しました');
      }
      
      const data = await response.json();
      return data.pages || [];
    } catch (error: any) {
      console.error(`メモ(ID: ${id})のページ一覧取得エラー:`, error);
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
      const response = await fetch(`${API_BASE_URL}/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモページの取得に失敗しました');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})取得エラー:`, error);
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
      const response = await fetch(`${API_BASE_URL}/memo/memos/${id}/pages`, getAuthOptions('POST', { content }));
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモページの追加に失敗しました');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`メモ(ID: ${id})のページ追加エラー:`, error);
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
      const response = await fetch(
        `${API_BASE_URL}/memo/memos/${id}/pages/${pageNumber}`,
        getAuthOptions('PUT', { content })
      );
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモページの更新に失敗しました');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})更新エラー:`, error);
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
      const response = await fetch(
        `${API_BASE_URL}/memo/memos/${id}/pages/${pageNumber}`,
        getAuthOptions('DELETE')
      );
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモページの削除に失敗しました');
      }
    } catch (error: any) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})削除エラー:`, error);
      throw error;
    }
  }
};

export default memoApi;
