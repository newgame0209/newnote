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
  async register(email: string, password: string, nickname: string) {
    try {
      console.log('登録開始:', { email, nickname });
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          nickname
        })
      });

      console.log('登録レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザー登録に失敗しました');
      }

      const data = await response.json();
      console.log('登録成功:', data);
      return data;
    } catch (error: any) {
      console.error('登録エラー:', error);
      throw new Error(error.message || 'ユーザー登録に失敗しました');
    }
  },

  /**
   * ログイン
   */
  async login(email: string, password: string) {
    try {
      console.log('ログイン開始:', { email });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      console.log('ログインレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ログインに失敗しました');
      }

      const data = await response.json();
      console.log('ログイン成功:', data);
      return data;
    } catch (error: any) {
      console.error('ログインエラー:', error);
      throw new Error(error.message || 'ログインに失敗しました');
    }
  },

  /**
   * ユーザー情報取得
   */
  async getUserInfo(token: string) {
    try {
      console.log('ユーザー情報取得開始 - トークン:', token ? '存在します' : '存在しません');
      
      const response = await fetch(`${API_URL}/auth/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('ユーザー情報取得レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザー情報の取得に失敗しました');
      }

      const data = await response.json();
      console.log('ユーザー情報取得成功:', data);
      return data;
    } catch (error: any) {
      console.error('ユーザー情報取得エラー:', error);
      throw new Error(error.message || 'ユーザー情報の取得に失敗しました');
    }
  },

  /**
   * リフレッシュトークンの更新
   */
  async refreshToken(refreshToken: string) {
    try {
      console.log('トークン更新開始');
      
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      console.log('トークン更新レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'トークンの更新に失敗しました');
      }

      const data = await response.json();
      console.log('トークン更新成功:', data);
      return data;
    } catch (error: any) {
      console.error('トークン更新エラー:', error);
      throw new Error(error.message || 'トークンの更新に失敗しました');
    }
  }
};

export default authApi;
