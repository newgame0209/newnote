import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AnimatedText } from "@/components/ui/animated-text";

/**
 * アカウント登録ページコンポーネント
 */
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  /**
   * 登録フォーム送信時の処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // パスワード確認
    if (password !== confirmPassword) {
      return setError('パスワードが一致しません');
    }
    
    // パスワードの長さチェック
    if (password.length < 6) {
      return setError('パスワードは6文字以上である必要があります');
    }

    try {
      setError(null);
      setLoading(true);
      
      // Firebaseアカウント作成
      await register(email, password, displayName);
      
      // 登録成功、ホームページへリダイレクト
      navigate('/');
    } catch (error: any) {
      console.error('登録エラー:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (error.code === 'auth/invalid-email') {
        setError('無効なメールアドレスです');
      } else if (error.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます。より強力なパスワードを使用してください');
      } else {
        setError('アカウント作成に失敗しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-[#232B3A] shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 flex justify-center items-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <AnimatedText
              text="しゃべるノート"
              textClassName="text-2xl sm:text-3xl font-bold text-white"
              underlineGradient="from-white via-gray-300 to-white"
              underlineHeight="h-0.5"
              underlineOffset="-bottom-1"
              duration={0.3}
              delay={0.1}
            />
          </h1>
        </div>
      </header>

      {/* 登録フォーム */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              アカウント登録
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              または{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                既存のアカウントでログイン
              </Link>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="display-name" className="sr-only">ニックネーム</label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="ニックネーム"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">メールアドレス</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">パスワード</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード（6文字以上）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">パスワード（確認）</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード（確認）"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登録中...' : 'アカウント登録'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 