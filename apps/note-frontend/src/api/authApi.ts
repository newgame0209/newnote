/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

import axios from 'axios';

// APIのベースURL
const API_URL = import.meta.env.VITE_API_URL || 'https://newnote-backend.onrender.com';

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
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        nickname
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'ユーザー登録に失敗しました');
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  },

  /**
   * ログイン処理
   * @param email メールアドレス
   * @param password パスワード
   * @returns アクセストークン、リフレッシュトークン、ユーザー情報
   */
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'ログインに失敗しました');
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  },

  /**
   * トークンのリフレッシュ
   * @param refreshToken リフレッシュトークン
   * @returns 新しいアクセストークン
   */
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          },
          withCredentials: true
        }
      );
      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'トークンの更新に失敗しました');
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  },

  /**
   * ユーザー情報の取得
   * @param token アクセストークン
   * @returns ユーザー情報
   */
  getUserInfo: async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'ユーザー情報の取得に失敗しました');
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  },

  /**
   * Google認証URLの取得
   * @returns Google認証URL
   */
  getGoogleAuthUrl: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/google`, {
        withCredentials: true
      });
      return response.data.auth_url;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Google認証URLの取得に失敗しました');
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  },

  /**
   * Google認証コールバック処理
   * @param code Google認証コード
   * @returns アクセストークン、リフレッシュトークン、ユーザー情報
   */
  googleCallback: async (code: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/google/callback`, { code }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Google認証に失敗しました');
      }
      throw new Error('ネットワークエラーが発生しました');
    }
  }
};

export default authApi;
