/**
 * @docs
 * メモ関連のAPI通信を管理するモジュール
 */

// メモAPIのベースURL
export const API_URL = import.meta.env.VITE_MEMO_API_URL || 'https://memo-backend-7va4.onrender.com/api';

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// 認証リクエストオプション取得
export const getAuthOptions = (method: string, body?: any): RequestInit => {
  const headers = getAuthHeaders();
  
  const options: RequestInit = {
    method,
    headers,
    mode: 'cors',
    credentials: 'include'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
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
      console.log('メモ一覧取得開始');
      const response = await fetch(`${API_URL}/memo/memos`, getAuthOptions('GET'));

      console.log('メモ一覧取得レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'メモ一覧の取得に失敗しました');
      }

      const data = await response.json();
      console.log('メモ一覧取得成功:', data);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('メモ一覧取得エラー:', error);
      throw new Error(error.message || 'メモ一覧の取得に失敗しました');
    }
  },

  /**
   * メモ取得
   */
  async getMemo(id: string) {
    try {
      const response = await fetch(`${API_URL}/memo/memos/${id}`, getAuthOptions('GET'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'メモの取得に失敗しました');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('メモ取得エラー:', error);
      throw new Error(error.message || 'メモの取得に失敗しました');
    }
  },

  /**
   * メモ作成
   */
  async createMemo(title: string, content: string, mainCategory?: string, subCategory?: string) {
    try {
      const response = await fetch(`${API_URL}/memo/memos`, getAuthOptions('POST', {
        title,
        content,
        main_category: mainCategory,
        sub_category: subCategory
      }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'メモの作成に失敗しました');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('メモ作成エラー:', error);
      throw new Error(error.message || 'メモの作成に失敗しました');
    }
  },

  /**
   * メモ更新
   */
  async updateMemo(id: string, title: string, content: string, mainCategory?: string, subCategory?: string) {
    try {
      const response = await fetch(`${API_URL}/memo/memos/${id}`, getAuthOptions('PUT', {
        title,
        content,
        main_category: mainCategory,
        sub_category: subCategory
      }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'メモの更新に失敗しました');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('メモ更新エラー:', error);
      throw new Error(error.message || 'メモの更新に失敗しました');
    }
  },

  /**
   * メモ削除
   */
  async deleteMemo(id: string) {
    try {
      const response = await fetch(`${API_URL}/memo/memos/${id}`, getAuthOptions('DELETE'));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'メモの削除に失敗しました');
      }

      return true;
    } catch (error: any) {
      console.error('メモ削除エラー:', error);
      throw new Error(error.message || 'メモの削除に失敗しました');
    }
  },

  /**
   * メモの全てのページを取得
   */
  async getMemoPages(id: number): Promise<MemoPage[]> {
    try {
      const response = await fetch(`${API_URL}/memo/memos/${id}/pages`, getAuthOptions('GET'));
      
      console.log('メモページ一覧取得レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        throw new Error(response.statusText || 'メモページの取得に失敗しました');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.pages || []);
    } catch (error: any) {
      console.error(`メモ(ID: ${id})のページ一覧取得エラー:`, error);
      throw error;
    }
  },

  /**
   * メモの特定ページを取得
   */
  async getMemoPage(id: number, pageNumber: number): Promise<MemoPage> {
    try {
      const response = await fetch(`${API_URL}/memo/memos/${id}/pages/${pageNumber}`, getAuthOptions('GET'));
      
      console.log('メモページ取得レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });
      
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
   * メモに新しいページを追加
   */
  async addMemoPage(id: number, content: string = ''): Promise<MemoPage> {
    try {
      const response = await fetch(`${API_URL}/memo/memos/${id}/pages`, getAuthOptions('POST', { content }));
      
      console.log('メモページ追加レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });
      
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
   * メモの特定ページを更新
   */
  async updateMemoPage(id: number, pageNumber: number, content: string): Promise<MemoPage> {
    try {
      const response = await fetch(
        `${API_URL}/memo/memos/${id}/pages/${pageNumber}`,
        getAuthOptions('PUT', { content })
      );
      
      console.log('メモページ更新レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });
      
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
   * メモの特定ページを削除
   */
  async deleteMemoPage(id: number, pageNumber: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_URL}/memo/memos/${id}/pages/${pageNumber}`,
        getAuthOptions('DELETE')
      );
      
      console.log('メモページ削除レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });
      
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
