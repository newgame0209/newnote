/**
 * @docs
 * Google認証のコールバックを処理するコンポーネント
 * URLのクエリパラメータからコードを取得し、バックエンドに送信してJWTを取得
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Google認証のコールバックを処理するコンポーネント
 */
export const GoogleCallback = () => {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // URLからcodeクエリパラメータを取得
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        
        if (!code) {
          throw new Error('認証コードが見つかりません');
        }

        // Googleコードを使用してログイン
        await loginWithGoogle(code);
        
        // ログイン成功後、ホームページにリダイレクト
        navigate('/');
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('認証処理中に予期しないエラーが発生しました');
        }
        
        // エラー時は5秒後にログインページへリダイレクト
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      }
    };

    handleGoogleCallback();
  }, [location, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        {error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">認証エラー</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">5秒後にログインページに移動します...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-blue-600 mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Google認証中...</h2>
            <p className="text-gray-600">認証処理を完了しています。しばらくお待ちください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
