import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebaseの設定
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

// コンテキストの型定義
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (email: string, password: string, displayName?: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  getIdToken: () => Promise<string | null>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

// コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 新規ユーザー登録
  const register = async (email: string, password: string, displayName?: string): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // ユーザー名を設定（指定があれば）
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    
    return result.user;
  };

  // ユーザープロファイルの更新
  const updateUserProfile = async (displayName: string): Promise<void> => {
    if (!currentUser) throw new Error('ユーザーがログインしていません');
    await updateProfile(currentUser, { displayName });
    // プロファイル更新後に最新のユーザー情報を取得するため再ロード
    setCurrentUser({ ...currentUser, displayName });
  };

  // ログイン
  const login = async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // ログアウト
  const logout = () => {
    return signOut(auth);
  };

  // Googleログイン
  const loginWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  // IDトークンの取得
  const getIdToken = async (): Promise<string | null> => {
    if (!currentUser) return null;
    return currentUser.getIdToken(true);
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    loginWithGoogle,
    getIdToken,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// フック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 