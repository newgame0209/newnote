/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

// 認証APIのベースURL
const API_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api';

// 認証APIのレスポンス型定義
interface User {
  id: string;
  email: string;
  nickname: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

// 認証ヘッダー取得
const getAuthOptions = (method: string, body?: object) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(localStorage.getItem('token') ? {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    } : {})
  },
  body: body ? JSON.stringify(body) : undefined,
  credentials: 'include' as const
});

// レスポンスをハンドルする関数
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // サーバーからのエラーメッセージを使用
    if (data.message) {
      throw new Error(data.message);
    }
    // ステータスコードに基づくデフォルトメッセージ
    switch (response.status) {
      case 400:
        throw new Error('入力内容に誤りがあります');
      case 401:
        throw new Error('認証に失敗しました');
      case 409:
        throw new Error('このメールアドレスは既に登録されています');
      default:
        throw new Error('エラーが発生しました');
    }
  }

  // アクセストークンが返された場合は保存
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }

  return data;
};

/**
 * 認証用APIクライアント
 */
const authApi = {
  /**
   * ユーザー登録
   */
  async register(email: string, password: string, nickname: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, getAuthOptions('POST', {
      email,
      password,
      nickname
    }));
    return handleResponse(response);
  },

  /**
   * ログイン
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, getAuthOptions('POST', {
      email,
      password
    }));
    return handleResponse(response);
  },

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}/auth/logout`, getAuthOptions('POST'));
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    return handleResponse(response);
  },

  /**
   * 認証状態の確認
   */
  async checkAuth(): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/me`, getAuthOptions('GET'));
    return handleResponse(response);
  },

  /**
   * リフレッシュトークンを使用して新しいアクセストークンを取得
   * @param refreshToken リフレッシュトークン
   * @returns 新しいアクセストークンとリフレッシュトークン
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/refresh`, getAuthOptions('POST', {
      refresh_token: refreshToken
    }));
    return handleResponse(response);
  },

  /**
   * Google認証の開始
   */
  async googleLogin(): Promise<void> {
    window.location.href = `${API_URL}/auth/google`;
  },

  /**
   * Google認証のコールバック処理
   * @param code 認証コード
   * @returns ユーザー情報とトークン
   */
  async googleCallback(code: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/google/callback?code=${code}`, getAuthOptions('GET'));
    return handleResponse(response);
  }
};

export default authApi;
