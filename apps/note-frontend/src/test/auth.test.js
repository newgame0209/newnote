// auth.test.js - 認証機能をテストするためのユーティリティ関数

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import axios from 'axios';

// Firebase設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ベースURL
const API_BASE_URL = import.meta.env.VITE_NOTE_API_URL || 'http://localhost:5001/api';

/**
 * ユーザー登録をテストする関数
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @param {string} displayName - 表示名
 * @returns {Promise<object>} テスト結果
 */
export async function register(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * ログインをテストする関数
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @returns {Promise<object>} テスト結果
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * Googleログインをテストする関数
 * @returns {Promise<object>} テスト結果
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * 認証トークンを取得する関数
 * @returns {Promise<object>} テスト結果（トークンを含む）
 */
export async function getToken() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('ログインしていません');
    }
    
    const token = await currentUser.getIdToken(true);
    return {
      success: true,
      token
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * トークンを検証する関数
 * @param {string} token - 検証するトークン
 * @returns {Promise<object>} テスト結果
 */
export async function verifyToken(token) {
  try {
    // APIエンドポイントでトークンを検証
    const response = await axios.get(`${API_BASE_URL}/auth/check`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      userData: response.data
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * 保護されたエンドポイントにアクセスする関数
 * @param {string} token - 認証トークン
 * @returns {Promise<object>} テスト結果
 */
export async function accessProtectedEndpoint(token) {
  try {
    // 保護されたエンドポイントにアクセス（例：ノート一覧取得）
    const response = await axios.get(`${API_BASE_URL}/notes`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}
