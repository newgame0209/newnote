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
  const { login, loading, error, clearError, googleLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleGoogleLogin = async () => {
    await googleLogin();
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
                新規登録
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="ml-auto pl-3 text-red-500 hover:text-red-800"
                >
                  &times;
                </button>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>

            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                <path fill="#4285F4" d="M27.5,15c0,-1.104 -0.092,-2.169 -0.278,-3.185l-12.222,0l0,6.021l6.944,0c-0.3,1.622 -1.212,2.998 -2.571,3.927l0,3.264l4.167,0c2.439,-2.246 3.96,-5.544 3.96,-10.027z" />
                <path fill="#34A853" d="M15,27.5c3.499,0 6.418,-1.159 8.555,-3.142l-4.167,-3.264c-1.148,0.772 -2.625,1.223 -4.388,1.223c-3.375,0 -6.223,-2.276 -7.252,-5.337l-4.299,0l0,3.366c2.123,4.217 6.52,7.154 11.551,7.154z" />
                <path fill="#FBBC05" d="M7.748,16.98c-0.256,-0.778 -0.405,-1.61 -0.405,-2.48c0,-0.87 0.149,-1.702 0.405,-2.48l0,-3.366l-4.3,0c-0.868,1.726 -1.363,3.68 -1.363,5.846c0,2.166 0.495,4.12 1.363,5.846l4.3,-3.366z" />
                <path fill="#EA4335" d="M15,7.382c1.904,0 3.605,0.655 4.951,1.933l3.698,-3.698c-2.234,-2.077 -5.152,-3.367 -8.649,-3.367c-5.031,0 -9.428,2.937 -11.551,7.154l4.299,3.366c1.029,-3.061 3.877,-5.388 7.252,-5.388z" />
              </svg>
              Googleでログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
