/**
 * @docs
 * Google認証のためのユーティリティ関数
 */

// Google OAuthのクライアントID
const GOOGLE_CLIENT_ID = '996683698857-ntesivverlnv2vrvqse18vra7lcq35nt.apps.googleusercontent.com';

// リダイレクトURL（環境に応じて変更）
const REDIRECT_URI = import.meta.env.DEV 
  ? 'http://localhost:5173/auth/google/callback'
  : 'https://newnote-app.vercel.app/auth/google/callback';

// 必要なスコープ
const SCOPES = ['profile', 'email'];

/**
 * @docs
 * Google認証のためのURLを生成する
 * 
 * @returns Google認証URLの文字列
 */
export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * @docs
 * Google認証を開始する
 * 新しいウィンドウでGoogle認証ページを開く
 */
export const initiateGoogleAuth = (): void => {
  window.location.href = getGoogleAuthUrl();
};
