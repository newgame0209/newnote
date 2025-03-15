/**
 * @docs
 * メモ関連のAPI通信を管理するモジュール
 */
import { Memo as MemoType, MemoPage, CreateMemoData, UpdateMemoData } from '../types/memo';

// APIのベースURL
export const API_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api';

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[Memo API Debug] ${message}`, data || '');
};

// APIのレスポンスから返されるメモの型（バックエンドの形式）
export interface ApiMemo {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  main_category?: string;
  sub_category?: string;
  pages?: ApiMemoPage[];
}

// APIのレスポンスから返されるメモページの型
export interface ApiMemoPage {
  id?: number;
  memo_id?: number;
  page_number: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

// 新規メモ作成の型定義
export interface CreateMemoParams {
  title: string;
  content: string;
  mainCategory?: string;
  subCategory?: string;
  pages?: ApiMemoPage[];
}

// APIのレスポンスからフロントエンドの型に変換する関数
const convertApiMemoToMemo = (apiMemo: ApiMemo): MemoType => {
  return {
    id: apiMemo.id,
    title: apiMemo.title,
    content: apiMemo.content,
    mainCategory: apiMemo.main_category,
    subCategory: apiMemo.sub_category,
    createdAt: new Date(apiMemo.created_at),
    updatedAt: new Date(apiMemo.updated_at),
    pages: apiMemo.pages?.map(convertApiMemoPageToMemoPage)
  };
};

// APIのページデータをフロントエンドの型に変換する関数
const convertApiMemoPageToMemoPage = (apiPage: ApiMemoPage): MemoPage => {
  return {
    id: apiPage.id,
    memo_id: apiPage.memo_id,
    page_number: apiPage.page_number,
    content: apiPage.content,
    created_at: apiPage.created_at,
    updated_at: apiPage.updated_at
  };
};

// フロントエンドの型からAPIに送信する形式に変換
const convertCreateMemoDataToParams = (data: CreateMemoData): CreateMemoParams => {
  return {
    title: data.title,
    content: data.content || '',
    mainCategory: data.mainCategory,
    subCategory: data.subCategory,
    pages: data.pages
  };
};

// 認証ヘッダー取得
const getAuthOptions = (method: string, body?: object): RequestInit => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    logDebug('認証情報がありません');
    throw new Error('認証情報がありません');
  }
  
  logDebug('認証ヘッダーを設定', { tokenPrefix: token.substring(0, 10) + '...' });
  
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  };
};

// レスポンスをハンドルする関数
const handleResponse = async <T>(response: Response): Promise<T> => {
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
        throw new Error('認証情報が無効です。再ログインしてください。');
      }

      // APIからのエラーメッセージがあれば使用、なければデフォルトメッセージ
      const errorMessage = data.message || 'エラーが発生しました';
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logDebug('JSONパースエラー', error);
      throw new Error('サーバーからの応答を解析できませんでした');
    }
    throw error;
  }
};

/**
 * メモAPI
 */
const memoApi = {
  /**
   * メモの一覧を取得
   */
  async getMemos(): Promise<MemoType[]> {
    try {
      logDebug('メモ一覧取得リクエスト');
      const response = await fetch(`${API_URL}/memos`, getAuthOptions('GET'));
      const apiMemos = await handleResponse<ApiMemo[]>(response);
      return apiMemos.map(convertApiMemoToMemo);
    } catch (error) {
      logDebug('メモ一覧取得エラー', error);
      throw new Error(`メモ一覧の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * 指定したIDのメモを取得
   * @param id メモID
   */
  async getMemo(id: number): Promise<MemoType> {
    try {
      logDebug('メモ詳細取得リクエスト', { id });
      const response = await fetch(`${API_URL}/memos/${id}`, getAuthOptions('GET'));
      const apiMemo = await handleResponse<ApiMemo>(response);
      return convertApiMemoToMemo(apiMemo);
    } catch (error) {
      logDebug('メモ詳細取得エラー', error);
      throw new Error(`メモの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * 新規メモを作成
   * @param data メモの内容
   */
  async createMemo(data: CreateMemoData): Promise<MemoType> {
    try {
      logDebug('メモ作成リクエスト', data);
      const params = convertCreateMemoDataToParams(data);
      const response = await fetch(`${API_URL}/memos`, getAuthOptions('POST', params));
      const apiMemo = await handleResponse<ApiMemo>(response);
      return convertApiMemoToMemo(apiMemo);
    } catch (error) {
      logDebug('メモ作成エラー', error);
      throw new Error(`メモの作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * メモを更新
   * @param id メモID
   * @param data 更新内容
   */
  async updateMemo(id: number, data: UpdateMemoData): Promise<MemoType> {
    try {
      logDebug('メモ更新リクエスト', { id, data });
      const response = await fetch(`${API_URL}/memos/${id}`, getAuthOptions('PUT', data));
      const apiMemo = await handleResponse<ApiMemo>(response);
      return convertApiMemoToMemo(apiMemo);
    } catch (error) {
      logDebug('メモ更新エラー', error);
      throw new Error(`メモの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * メモを削除
   * @param id メモID
   */
  async deleteMemo(id: number): Promise<void> {
    try {
      logDebug('メモ削除リクエスト', { id });
      const response = await fetch(`${API_URL}/memos/${id}`, getAuthOptions('DELETE'));
      await handleResponse<void>(response);
      logDebug('メモ削除成功', { id });
    } catch (error) {
      logDebug('メモ削除エラー', error);
      throw new Error(`メモの削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * メモの全ページを取得
   * @param memoId メモID
   */
  async getMemoPages(memoId: number): Promise<MemoPage[]> {
    try {
      logDebug('メモページ一覧取得リクエスト', { memoId });
      const response = await fetch(`${API_URL}/memos/${memoId}/pages`, getAuthOptions('GET'));
      const apiPages = await handleResponse<ApiMemoPage[]>(response);
      return apiPages.map(convertApiMemoPageToMemoPage);
    } catch (error) {
      logDebug('メモページ一覧取得エラー', error);
      throw new Error(`メモのページ一覧の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * 特定のメモページを取得
   * @param memoId メモID
   * @param pageNumber ページ番号
   */
  async getMemoPage(memoId: number, pageNumber: number): Promise<MemoPage> {
    try {
      logDebug('メモページ取得リクエスト', { memoId, pageNumber });
      const response = await fetch(`${API_URL}/memos/${memoId}/pages/${pageNumber}`, getAuthOptions('GET'));
      const apiPage = await handleResponse<ApiMemoPage>(response);
      return convertApiMemoPageToMemoPage(apiPage);
    } catch (error) {
      logDebug('メモページ取得エラー', error);
      throw new Error(`メモページの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * メモに新しいページを追加
   * @param memoId メモID
   * @param content ページの内容
   */
  async addMemoPage(memoId: number, content: string = ''): Promise<MemoPage> {
    try {
      logDebug('メモページ追加リクエスト', { memoId, contentLength: content.length });
      const response = await fetch(`${API_URL}/memos/${memoId}/pages`, getAuthOptions('POST', { content }));
      const apiPage = await handleResponse<ApiMemoPage>(response);
      return convertApiMemoPageToMemoPage(apiPage);
    } catch (error) {
      logDebug('メモページ追加エラー', error);
      throw new Error(`メモページの追加に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * メモページを更新
   * @param memoId メモID
   * @param pageNumber ページ番号
   * @param content 更新内容
   */
  async updateMemoPage(memoId: number, pageNumber: number, content: string): Promise<MemoPage> {
    try {
      logDebug('メモページ更新リクエスト', { memoId, pageNumber, contentLength: content.length });
      const response = await fetch(`${API_URL}/memos/${memoId}/pages/${pageNumber}`, getAuthOptions('PUT', { content }));
      const apiPage = await handleResponse<ApiMemoPage>(response);
      return convertApiMemoPageToMemoPage(apiPage);
    } catch (error) {
      logDebug('メモページ更新エラー', error);
      throw new Error(`メモページの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * メモページを削除
   * @param memoId メモID
   * @param pageNumber ページ番号
   */
  async deleteMemoPage(memoId: number, pageNumber: number): Promise<void> {
    try {
      logDebug('メモページ削除リクエスト', { memoId, pageNumber });
      const response = await fetch(`${API_URL}/memos/${memoId}/pages/${pageNumber}`, getAuthOptions('DELETE'));
      await handleResponse<void>(response);
      logDebug('メモページ削除成功', { memoId, pageNumber });
    } catch (error) {
      logDebug('メモページ削除エラー', error);
      throw new Error(`メモページの削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
};

export default memoApi;
