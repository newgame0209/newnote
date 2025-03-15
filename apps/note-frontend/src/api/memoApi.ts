/**
 * @docs
 * メモ関連のAPI通信を管理するモジュール
 */

// メモAPIのベースURL
export const API_URL = import.meta.env.VITE_MEMO_API_URL || 'https://newnote-backend.onrender.com/api/memo';

// メモページの型定義
interface MemoPage {
  id: number;
  memo_id: number;
  page_number: number;
  content: string;
  created_at: string;
  updated_at: string;
}

// 認証ヘッダー取得
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('認証情報がありません');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// 認証リクエストオプション取得
export const getAuthOptions = (method: string, body?: any): RequestInit => {
  return {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined
  };
};

/**
 * メモ用APIクライアント
 */
const memoApi = {
  /**
   * メモ一覧取得
   */
  async getMemos() {
    try {
      const response = await fetch(`${API_URL}/memos`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'メモの取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('メモ一覧取得エラー:', error);
      throw error;
    }
  },

  /**
   * メモ取得
   */
  async getMemo(id: string) {
    try {
      const response = await fetch(`${API_URL}/memos/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}の取得に失敗しました`);
      }

      return await response.json();
    } catch (error) {
      console.error('メモ取得エラー:', error);
      throw error;
    }
  },

  /**
   * メモ作成
   */
  async createMemo(title: string, content: string, mainCategory?: string, subCategory?: string) {
    try {
      const response = await fetch(`${API_URL}/memos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          main_category: mainCategory,
          sub_category: subCategory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'メモの作成に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('メモ作成エラー:', error);
      throw new Error('メモの作成に失敗しました');
    }
  },

  /**
   * メモ更新
   */
  async updateMemo(id: string, title: string, content: string, mainCategory?: string, subCategory?: string) {
    try {
      const response = await fetch(`${API_URL}/memos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          content,
          main_category: mainCategory,
          sub_category: subCategory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}の更新に失敗しました`);
      }

      return await response.json();
    } catch (error) {
      console.error('メモ更新エラー:', error);
      throw new Error(`メモの更新に失敗しました`);
    }
  },

  /**
   * メモ削除
   */
  async deleteMemo(id: string) {
    try {
      const response = await fetch(`${API_URL}/memos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}の削除に失敗しました`);
      }

      return true;
    } catch (error) {
      console.error('メモ削除エラー:', error);
      throw error;
    }
  },

  /**
   * メモの全てのページを取得
   */
  async getMemoPages(id: number): Promise<MemoPage[]> {
    try {
      const response = await fetch(`${API_URL}/memos/${id}/pages`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}のページ取得に失敗しました`);
      }

      return await response.json();
    } catch (error) {
      console.error('メモページ取得エラー:', error);
      throw error;
    }
  },

  /**
   * メモの特定ページを取得
   */
  async getMemoPage(id: number, pageNumber: number): Promise<MemoPage> {
    try {
      const response = await fetch(`${API_URL}/memos/${id}/pages/${pageNumber}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}のページ${pageNumber}の取得に失敗しました`);
      }

      return await response.json();
    } catch (error) {
      console.error('メモページ取得エラー:', error);
      throw error;
    }
  },

  /**
   * メモに新しいページを追加
   */
  async addMemoPage(id: number, content: string = ''): Promise<MemoPage> {
    try {
      const response = await fetch(`${API_URL}/memos/${id}/pages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}への新しいページ追加に失敗しました`);
      }

      return await response.json();
    } catch (error) {
      console.error('メモページ追加エラー:', error);
      throw error;
    }
  },

  /**
   * メモの特定ページを更新
   */
  async updateMemoPage(id: number, pageNumber: number, content: string): Promise<MemoPage> {
    try {
      const response = await fetch(`${API_URL}/memos/${id}/pages/${pageNumber}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}のページ${pageNumber}の更新に失敗しました`);
      }

      return await response.json();
    } catch (error) {
      console.error('メモページ更新エラー:', error);
      throw error;
    }
  },

  /**
   * メモの特定ページを削除
   */
  async deleteMemoPage(id: number, pageNumber: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/memos/${id}/pages/${pageNumber}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `メモID: ${id}のページ${pageNumber}の削除に失敗しました`);
      }
    } catch (error) {
      console.error('メモページ削除エラー:', error);
      throw error;
    }
  }
};

export default memoApi;
