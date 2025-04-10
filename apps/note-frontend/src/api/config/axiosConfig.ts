import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getAuth } from 'firebase/auth';

// ノートアプリのAPIベースURL
const NOTE_API_BASE_URL = import.meta.env.VITE_NOTE_API_URL || 'http://localhost:5001/api';

// メモアプリのAPIベースURL
const MEMO_API_BASE_URL = import.meta.env.VITE_MEMO_API_URL || 'http://localhost:5002/api/memo';

/**
 * 認証トークン付きのAxiosインスタンスを作成する関数
 * @param baseURL APIのベースURL
 * @returns 設定済みのAxiosインスタンス
 */
export const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  // リクエストインターセプターの設定
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 現在の認証済みユーザーを取得
      const auth = getAuth();
      const user = auth.currentUser;

      // ユーザーが認証済みであればトークンを取得してヘッダーに追加
      if (user) {
        try {
          const token = await user.getIdToken(true);
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          console.error('トークンの取得に失敗しました:', error);
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// ノートアプリ用のAxiosインスタンス
export const noteApiClient = createAxiosInstance(NOTE_API_BASE_URL);

// メモアプリ用のAxiosインスタンス
export const memoApiClient = createAxiosInstance(MEMO_API_BASE_URL);

// トークンのみを取得する関数
export const getAuthToken = async (): Promise<string | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }
  
  try {
    return await user.getIdToken(true);
  } catch (error) {
    console.error('トークンの取得に失敗しました:', error);
    return null;
  }
}; 