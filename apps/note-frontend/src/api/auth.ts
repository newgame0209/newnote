import { User, RegisterData, LoginData, AuthResponse } from '@/types/auth';

// 本番環境と開発環境のURL設定
const API_URL_NOTE = import.meta.env.VITE_API_URL_NOTE || 
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://newnote-backend.onrender.com/api');

const API_URL_MEMO = import.meta.env.VITE_API_URL_MEMO || 
  (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://memo-backend-7va4.onrender.com/api');

/**
 * @docs
 * ノートバックエンドでユーザー登録を行う関数
 * 
 * @param data - 登録情報（ユーザー名、メール、パスワード）
 * @returns 登録成功時のレスポンス（ユーザー情報とトークン）
 */
export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL_NOTE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || '登録中にエラーが発生しました');
  }
  
  return responseData;
};

/**
 * @docs
 * メモバックエンドでユーザー登録を行う関数
 * ノートバックエンドで登録したのと同じ情報でメモバックエンドにも登録する
 * 
 * @param data - 登録情報（ユーザー名、メール、パスワード）
 * @returns 登録成功時のレスポンス
 */
export const registerUserMemo = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL_MEMO}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || 'メモバックエンドでの登録中にエラーが発生しました');
  }
  
  return responseData;
};

/**
 * @docs
 * ノートバックエンドでログインを行う関数
 * 
 * @param data - ログイン情報（メール、パスワード）
 * @returns ログイン成功時のレスポンス（ユーザー情報とトークン）
 */
export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL_NOTE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || 'ログイン中にエラーが発生しました');
  }
  
  return responseData;
};

/**
 * @docs
 * メモバックエンドでログインを行う関数
 * 
 * @param data - ログイン情報（メール、パスワード）
 * @returns ログイン成功時のレスポンス
 */
export const loginUserMemo = async (data: LoginData): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL_MEMO}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || 'メモバックエンドでのログイン中にエラーが発生しました');
  }
  
  return responseData;
};

/**
 * @docs
 * ノートバックエンドから現在のユーザープロフィールを取得する関数
 * 
 * @param token - JWT認証トークン
 * @returns ユーザー情報
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_URL_NOTE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || 'ユーザー情報の取得中にエラーが発生しました');
  }
  
  return responseData.user;
};

/**
 * @docs
 * 認証ヘッダーを生成する関数
 * 
 * @param token - JWT認証トークン
 * @returns 認証ヘッダーオブジェクト
 */
export const getAuthHeaders = (token: string): HeadersInit => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * @docs
 * Googleの認証コードを使ってノートバックエンドでのログインを行う関数
 * 
 * @param code - Googleから取得した認証コード
 * @returns ログイン成功時のレスポンス（ユーザー情報とトークン）
 */
export const loginWithGoogleNote = async (code: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL_NOTE}/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || 'Google認証でのログイン中にエラーが発生しました');
  }
  
  return responseData;
};

/**
 * @docs
 * Googleの認証コードを使ってメモバックエンドでのログインを行う関数
 * 
 * @param code - Googleから取得した認証コード
 * @returns ログイン成功時のレスポンス
 */
export const loginWithGoogleMemo = async (code: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL_MEMO}/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.message || 'メモバックエンドでのGoogle認証ログイン中にエラーが発生しました');
  }
  
  return responseData;
};
