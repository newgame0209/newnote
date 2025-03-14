/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

// APIのベースURL
const API_URL = import.meta.env.VITE_API_URL || 'https://newnote-backend.onrender.com';

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
        ...defaultOptions,
        body: JSON.stringify({ email, password, nickname })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー登録に失敗しました');
      }

      return await response.json();
    } catch (error) {
      throw new Error('ネットワークエラーが発生しました');
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
        ...defaultOptions,
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ログインに失敗しました');
      }

      return await response.json();
    } catch (error) {
      throw new Error('ネットワークエラーが発生しました');
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
        ...defaultOptions,
        headers: {
          ...defaultOptions.headers as Record<string, string>,
          Authorization: `Bearer ${refreshToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'トークンの更新に失敗しました');
      }

      return (await response.json()).access_token;
    } catch (error) {
      throw new Error('ネットワークエラーが発生しました');
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
        ...defaultOptions,
        headers: {
          ...defaultOptions.headers as Record<string, string>,
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      throw new Error('ネットワークエラーが発生しました');
    }
  },

  /**
   * Google認証URLの取得
   */
  getGoogleAuthUrl: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'GET',
        ...defaultOptions
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google認証URLの取得に失敗しました');
      }

      return (await response.json()).auth_url;
    } catch (error) {
      throw new Error('ネットワークエラーが発生しました');
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
        ...defaultOptions,
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google認証に失敗しました');
      }

      return await response.json();
    } catch (error) {
      throw new Error('ネットワークエラーが発生しました');
    }
  }
};

export default authApi;
