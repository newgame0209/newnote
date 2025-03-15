/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

// 環境変数からAPIのURL取得、またはデフォルト値を使用
// メモのバックエンドURLが異なる場合があるため、適切に設定
const API_BASE_URL = import.meta.env.VITE_MEMO_API_URL || 'https://memo-backend-7va4.onrender.com';

/**
 * 認証情報付きのリクエストオプションを生成
 */
const getAuthOptions = (method: string, body?: any): RequestInit => {
  const token = localStorage.getItem('token');
  
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    credentials: 'include' as RequestCredentials, // 型を明示的に指定
    mode: 'cors' as RequestMode,
    ...(body ? { body: JSON.stringify(body) } : {})
  };
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
      console.log('メモ一覧取得開始 - URL:', `${API_BASE_URL}/memos`);
      
      const response = await fetch(`${API_BASE_URL}/memos`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモ一覧取得エラー:', response.status, response.statusText);
        throw new Error(`メモ一覧の取得に失敗しました (${response.status})`);
      }
      
      const data = await response.json();
      console.log('メモ一覧取得成功:', data);
      return data;
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
      console.log('メモ作成開始 - URL:', `${API_BASE_URL}/api/memo/memos`);
      
      const body = {
        title: data.title,
        content: data.content || '',
        main_category: data.mainCategory,
        sub_category: data.subCategory
      };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos`, getAuthOptions('POST', body));
      
      if (!response.ok) {
        console.error('メモ作成エラー:', response.status, response.statusText);
        throw new Error(`メモの作成に失敗しました (${response.status})`);
      }
      
      const memo = await response.json();
      console.log('メモ作成成功:', memo);
      return memo;
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
      console.log('メモ取得開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}`);
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモ取得エラー:', response.status, response.statusText);
        throw new Error(`メモの取得に失敗しました (${response.status})`);
      }
      
      const memo = await response.json();
      console.log('メモ取得成功:', memo);
      return memo;
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
      console.log('メモ更新開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}`);
      
      const body = {
        title: data.title,
        content: data.content,
        main_category: data.mainCategory,
        sub_category: data.subCategory
      };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('PUT', body));
      
      if (!response.ok) {
        console.error('メモ更新エラー:', response.status, response.statusText);
        throw new Error(`メモの更新に失敗しました (${response.status})`);
      }
      
      const memo = await response.json();
      console.log('メモ更新成功:', memo);
      return memo;
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
      console.log('メモ削除開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}`);
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}`, getAuthOptions('DELETE'));
      
      if (!response.ok) {
        console.error('メモ削除エラー:', response.status, response.statusText);
        throw new Error(`メモの削除に失敗しました (${response.status})`);
      }
      
      console.log('メモ削除成功');
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
      console.log('メモページ一覧取得開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}/pages`);
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモページ一覧取得エラー:', response.status, response.statusText);
        throw new Error(`メモのページ一覧の取得に失敗しました (${response.status})`);
      }
      
      const pages = await response.json();
      console.log('メモページ一覧取得成功:', pages);
      return pages;
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
      console.log('メモページ取得開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`);
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('GET'));
      
      if (!response.ok) {
        console.error('メモページ取得エラー:', response.status, response.statusText);
        throw new Error(`メモのページの取得に失敗しました (${response.status})`);
      }
      
      const page = await response.json();
      console.log('メモページ取得成功:', page);
      return page;
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
      console.log('メモページ追加開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}/pages`);
      
      const body = { content };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages`, getAuthOptions('POST', body));
      
      if (!response.ok) {
        console.error('メモページ追加エラー:', response.status, response.statusText);
        throw new Error(`メモへの新規ページ追加に失敗しました (${response.status})`);
      }
      
      const page = await response.json();
      console.log('メモページ追加成功:', page);
      return page;
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
      console.log('メモページ更新開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`);
      
      const body = { content };
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('PUT', body));
      
      if (!response.ok) {
        console.error('メモページ更新エラー:', response.status, response.statusText);
        throw new Error(`メモのページの更新に失敗しました (${response.status})`);
      }
      
      const page = await response.json();
      console.log('メモページ更新成功:', page);
      return page;
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
      console.log('メモページ削除開始 - URL:', `${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`);
      
      const response = await fetch(`${API_BASE_URL}/api/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('DELETE'));
      
      if (!response.ok) {
        console.error('メモページ削除エラー:', response.status, response.statusText);
        throw new Error(`メモのページの削除に失敗しました (${response.status})`);
      }
      
      console.log('メモページ削除成功');
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})削除中のエラー:`, error);
      throw error;
    }
  }
};

export default memoApi;
