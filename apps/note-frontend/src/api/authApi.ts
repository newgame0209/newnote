/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

// 認証APIのベースURL
export const API_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api';

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
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

/**
 * 認証用APIクライアント
 */
const authApi = {
  /**
   * ユーザー登録
   */
  async register(email: string, password: string, nickname: string) {
    try {
      console.log('登録開始:', { email, nickname });
      
      const response = await fetch(`${API_URL}/auth/register`, getAuthOptions('POST', { email, password, nickname }));

      console.log('登録レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error('このメールアドレスは既に登録されています');
        }
        throw new Error(errorData.error || 'ユーザー登録に失敗しました');
      }

      const data = await response.json();
      console.log('登録成功:', data);
      return data;
    } catch (error: any) {
      console.error('登録エラー:', error);
      throw error;
    }
  },

  /**
   * ログイン
   */
  async login(email: string, password: string) {
    try {
      console.log('ログイン開始:', { email });
      
      const response = await fetch(`${API_URL}/auth/login`, getAuthOptions('POST', { email, password }));

      console.log('ログインレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ログインに失敗しました');
      }

      const data = await response.json();
      console.log('ログイン成功:', data);
      return data;
    } catch (error: any) {
      console.error('ログインエラー:', error);
      throw error;
    }
  },

  /**
   * ユーザー情報取得
   */
  async getUserInfo(token: string) {
    try {
      console.log('ユーザー情報取得開始 - トークン:', token ? '存在します' : '存在しません');
      
      if (!token) {
        throw new Error('認証トークンが存在しません');
      }
      
      // 認証エンドポイントを修正
      const response = await fetch(`${API_URL}/auth/user`, getAuthOptions('GET'));

      console.log('ユーザー情報取得レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました');
      }

      const data = await response.json();
      console.log('ユーザー情報取得成功:', data);
      return data;
    } catch (error: any) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  },

  /**
   * リフレッシュトークンを使用して新しいアクセストークンを取得
   * @param refreshToken リフレッシュトークン
   * @returns 新しいアクセストークンとリフレッシュトークン
   */
  async refreshToken(refreshToken: string) {
    try {
      console.log('トークン更新開始');
      
      const response = await fetch(`${API_URL}/auth/refresh`, getAuthOptions('POST'));

      console.log('トークン更新レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'トークンの更新に失敗しました');
      }

      const data = await response.json();
      console.log('トークン更新成功:', data);
      return data;
    } catch (error: any) {
      console.error('トークン更新エラー:', error);
      throw error;
    }
  },

  /**
   * Google認証のコールバック処理
   * @param code 認証コード
   * @returns ユーザー情報とトークン
   */
  async googleCallback(code: string) {
    try {
      console.log('Google認証コールバック開始:', { code });
      
      const response = await fetch(`${API_URL}/auth/google/callback`, getAuthOptions('POST', { code }));

      console.log('Google認証コールバックレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Google認証に失敗しました');
      }

      const data = await response.json();
      console.log('Google認証成功:', data);
      return data;
    } catch (error: any) {
      console.error('Google認証エラー:', error);
      throw error;
    }
  }
};

export default authApi;
