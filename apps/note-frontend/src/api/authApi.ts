/**
 * @docs
 * 認証関連のAPI通信を管理するモジュール
 */

// 認証APIのベースURL
export const API_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api';

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[Auth API Debug] ${message}`, data || '');
};

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
const getAuthOptions = (method: string, body?: object): RequestInit => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    logDebug('認証ヘッダーを追加しました', { token: token.substring(0, 10) + '...' });
  } else {
    logDebug('トークンが存在しません');
  }
  
  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
};

// レスポンスをハンドルする関数
const handleResponse = async (response: Response) => {
  logDebug(`APIレスポンス: ${response.status} ${response.statusText}`, {
    url: response.url
  });

  try {
    const data = await response.json();
    logDebug('レスポンスボディ', data);

    if (!response.ok) {
      // 認証エラーの場合、ローカルストレージをクリア
      if (response.status === 401) {
        logDebug('認証エラー: トークンをクリア');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
      }

      if (response.status === 409) {
        throw new Error('このメールアドレスは既に登録されています');
      }

      // APIからのエラーメッセージがあれば使用、なければデフォルトメッセージ
      const errorMessage = data.message || 'エラーが発生しました';
      throw new Error(errorMessage);
    }

    // トークンがレスポンスに含まれていれば保存
    if (data.access_token) {
      logDebug('アクセストークンを保存', { tokenPrefix: data.access_token.substring(0, 10) + '...' });
      localStorage.setItem('token', data.access_token);
    }
    
    if (data.refresh_token) {
      logDebug('リフレッシュトークンを保存');
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logDebug('JSONパースエラー', error);
      throw new Error('サーバーからの応答を解析できませんでした');
    }
    throw error;
  }
};

/**
 * 認証用APIクライアント
 */
const authApi = {
  /**
   * ユーザー登録
   */
  async register(email: string, password: string, nickname: string): Promise<AuthResponse> {
    logDebug('ユーザー登録リクエスト', { email, nickname });
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
    logDebug('ログインリクエスト', { email });
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
    logDebug('ログアウトリクエスト');
    const response = await fetch(`${API_URL}/auth/logout`, getAuthOptions('POST'));
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    return handleResponse(response);
  },

  /**
   * 認証状態の確認
   */
  async checkAuth(): Promise<AuthResponse> {
    logDebug('認証状態確認リクエスト');
    const token = localStorage.getItem('token');
    if (!token) {
      logDebug('トークンが存在しないため、認証状態の確認をスキップ');
      throw new Error('認証情報がありません');
    }
    
    const response = await fetch(`${API_URL}/auth/me`, getAuthOptions('GET'));
    return handleResponse(response);
  },

  /**
   * リフレッシュトークンを使用して新しいアクセストークンを取得
   * @param refreshToken リフレッシュトークン
   * @returns 新しいアクセストークンとリフレッシュトークン
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    logDebug('トークンリフレッシュリクエスト');
    const response = await fetch(`${API_URL}/auth/refresh`, getAuthOptions('POST', {
      refresh_token: refreshToken
    }));
    return handleResponse(response);
  },

  /**
   * Google認証の開始
   */
  async googleLogin(): Promise<void> {
    logDebug('Google認証開始リクエスト');
    window.location.href = `${API_URL}/auth/google`;
  },

  /**
   * Google認証のコールバック処理
   * @param code 認証コード
   * @returns ユーザー情報とトークン
   */
  async googleCallback(code: string): Promise<AuthResponse> {
    logDebug('Googleコールバック処理リクエスト', { codePrefix: code.substring(0, 10) + '...' });
    const response = await fetch(`${API_URL}/auth/google/callback`, getAuthOptions('POST', {
      code
    }));
    return handleResponse(response);
  }
};

export default authApi;
