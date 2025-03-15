import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AnimatedText } from "@/components/ui/animated-text";

/**
 * @docs
 * ログインページコンポーネント
 * 
 * ユーザーがメールアドレスとパスワードでログインするためのフォームを提供する
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, auth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      console.error('ログインエラー:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-[#232B3A] shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
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

      {/* ログインフォーム */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">ログイン</h2>
            <p className="mt-2 text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                こちら
              </Link>
            </p>
          </div>

          {auth.error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {auth.error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={auth.loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {auth.loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
