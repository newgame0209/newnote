/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

// 認証APIのベースURL（環境変数を正しく使用）
export const API_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api';

console.log('認証API設定:', {
  API_URL,
  token: localStorage.getItem('token') ? '存在します' : '存在しません'
});

// CORS対応のオプション
export const corsOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors' as RequestMode,
  credentials: 'include' as RequestCredentials
};

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
 * 認証用APIクライアント
 */
const authApi = {
  /**
   * ユーザー登録
   */
  register: async (email: string, password: string, nickname: string) => {
    try {
      // fetchAPIを使用して直接リクエスト
      const response = await fetch(`${API_URL}/auth/register`, getAuthOptions('POST', { email, password, nickname }));

      console.log('登録レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'ユーザー登録に失敗しました');
      }

      return await response.json();
    } catch (error: any) {
      console.error('登録エラー:', error);
      throw error;
    }
  },

  /**
   * ログイン
   */
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, getAuthOptions('POST', { email, password }));

      console.log('ログインレスポンス:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'ログインに失敗しました');
      }

      return await response.json();
    } catch (error: any) {
      console.error('ログインエラー:', error);
      throw error;
    }
  },

  /**
   * リフレッシュトークンの更新
   */
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, getAuthOptions('POST', { refresh_token: refreshToken }));

      console.log('トークン更新レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'トークンの更新に失敗しました');
      }

      return await response.json();
    } catch (error: any) {
      console.error('トークン更新エラー:', error);
      throw error;
    }
  },

  /**
   * ユーザー情報取得
   */
  getUserInfo: async (token: string) => {
    try {
      const headers = getAuthHeaders();
      headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include'
      });

      console.log('ユーザー情報取得レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        url: `${API_URL}/users/me`
      });

      if (!response.ok) {
        throw new Error(`ユーザー情報の取得に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  },

  /**
   * Google認証URL取得
   */
  getGoogleAuthUrl: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/google/url`, getAuthOptions('GET'));

      console.log('Google認証URL取得レスポンス:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error('Google認証URLの取得に失敗しました');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Google認証URL取得エラー:', error);
      throw error;
    }
  },

  /**
   * Google認証コールバック処理
   */
  googleCallback: async (code: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/google/callback`, getAuthOptions('POST', { code }));

      console.log('Google認証コールバックレスポンス:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error('Google認証に失敗しました');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Google認証コールバックエラー:', error);
      throw error;
    }
  }
};

export default authApi;
