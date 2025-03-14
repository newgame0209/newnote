/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

// APIのベースURL
const API_URL = import.meta.env.VITE_API_URL || 'https://newnote-backend.onrender.com';

// CORSオプションを設定（シンプル化）
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' as RequestCredentials,
  mode: 'cors' as RequestMode
};

/**
 * 認証用APIクライアント
 */
const authApi = {
  /**
   * ユーザー登録
   * @param email メールアドレス
   * @param password パスワード
   * @param nickname ニックネーム
   * @returns 登録結果
   */
  register: async (email: string, password: string, nickname: string) => {
    try {
      // fetchAPIを使用して直接リクエスト
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, nickname })
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'ユーザー登録に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('登録エラー:', error);
      throw error;
    }
  },

  /**
   * ログイン処理
   * @param email メールアドレス
   * @param password パスワード
   * @returns ログイン結果
   */
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'ログインに失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('ログインエラー:', error);
      throw error;
    }
  },

  /**
   * トークンのリフレッシュ
   * @param refreshToken リフレッシュトークン
   */
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'トークンの更新に失敗しました');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('トークンリフレッシュエラー:', error);
      throw error;
    }
  },

  /**
   * ユーザー情報の取得
   * @param token アクセストークン
   */
  getUserInfo: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'ユーザー情報の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  },

  /**
   * Google認証URLの取得
   */
  getGoogleAuthUrl: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Google認証URLの取得に失敗しました');
      }

      const data = await response.json();
      return data.auth_url;
    } catch (error) {
      console.error('Google認証URL取得エラー:', error);
      throw error;
    }
  },

  /**
   * Google認証コールバック処理
   * @param code 認証コード
   */
  googleCallback: async (code: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Google認証に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('Google認証コールバックエラー:', error);
      throw error;
    }
  }
};

export default authApi;
