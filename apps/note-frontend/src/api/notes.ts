/**
 * @docs
 * ノート関連のAPI通信を管理するモジュール
 */
import { Note as NoteType, CreateNoteData } from '../types/note';

// APIのベースURL
export const API_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com/api';

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[Note API Debug] ${message}`, data || '');
};

// 認証ヘッダー取得
const getAuthOptions = (method: string, body?: object): RequestInit => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    logDebug('認証情報がありません');
    throw new Error('認証情報がありません。再ログインしてください。');
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
 * ノート用APIクライアント
 */
const noteApi = {
  /**
   * ノート一覧を取得
   */
  async getNotes(): Promise<NoteType[]> {
    try {
      logDebug('ノート一覧取得リクエスト');
      const response = await fetch(`${API_URL}/notes`, getAuthOptions('GET'));
      return handleResponse<NoteType[]>(response);
    } catch (error) {
      logDebug('ノート一覧取得エラー', error);
      throw error;
    }
  },

  /**
   * 指定したIDのノートを取得
   * @param id ノートID
   */
  async getNote(id: number | string): Promise<NoteType> {
    try {
      logDebug('ノート詳細取得リクエスト', { id });
      const response = await fetch(`${API_URL}/notes/${id}`, getAuthOptions('GET'));
      return handleResponse<NoteType>(response);
    } catch (error) {
      logDebug('ノート詳細取得エラー', error);
      throw error;
    }
  },

  /**
   * 新規ノートを作成
   * @param data ノートの内容
   */
  async createNote(data: CreateNoteData): Promise<NoteType> {
    try {
      logDebug('ノート作成リクエスト', data);
      const response = await fetch(`${API_URL}/notes`, getAuthOptions('POST', data));
      return handleResponse<NoteType>(response);
    } catch (error) {
      logDebug('ノート作成エラー', error);
      throw new Error(`ノートの作成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * ノートを更新
   * @param id ノートID
   * @param data 更新内容
   */
  async updateNote(id: number | string, data: Partial<CreateNoteData>): Promise<NoteType> {
    try {
      logDebug('ノート更新リクエスト', { id, ...data });
      const response = await fetch(`${API_URL}/notes/${id}`, getAuthOptions('PUT', data));
      return handleResponse<NoteType>(response);
    } catch (error) {
      logDebug('ノート更新エラー', error);
      throw new Error(`ノートの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * ノートを削除
   * @param id ノートID
   */
  async deleteNote(id: number | string): Promise<void> {
    try {
      logDebug('ノート削除リクエスト', { id });
      const response = await fetch(`${API_URL}/notes/${id}`, getAuthOptions('DELETE'));
      await handleResponse<void>(response);
      logDebug('ノート削除成功', { id });
    } catch (error) {
      logDebug('ノート削除エラー', error);
      throw new Error(`ノートの削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * ページの保存
   */
  async updatePage(noteId: string | number, pageNumber: number, content: string): Promise<any> {
    try {
      logDebug('ページの保存リクエスト', { noteId, pageNumber, content });
      const response = await fetch(`${API_URL}/notes/${noteId}/pages/${pageNumber}`, getAuthOptions('PUT', { content }));
      return handleResponse<any>(response);
    } catch (error) {
      logDebug('ページの保存エラー', error);
      throw new Error(`ページの保存中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * ページの取得
   */
  async getPage(noteId: string | number, pageNumber: number): Promise<any> {
    try {
      logDebug('ページの取得リクエスト', { noteId, pageNumber });
      const response = await fetch(`${API_URL}/notes/${noteId}/pages/${pageNumber}`, getAuthOptions('GET'));
      return handleResponse<any>(response);
    } catch (error) {
      logDebug('ページの取得エラー', error);
      throw new Error(`ページの取得中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * OCR処理を実行する
   * @param noteId ノートID
   * @param pageNumber ページ番号
   * @param imageData 画像データ（base64）
   * @returns OCR結果のテキスト
   */
  async executeOCR(noteId: number, pageNumber: number, imageData: string): Promise<string> {
    try {
      logDebug('OCR処理リクエスト', { noteId, pageNumber });
      const response = await fetch(`${API_URL}/ocr`, getAuthOptions('POST', {
        note_id: noteId,
        page_number: pageNumber,
        image_data: imageData
      }));
      const data = await handleResponse<any>(response);
      return data.text;
    } catch (error) {
      logDebug('OCR処理エラー', error);
      throw new Error(`OCR処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  },

  /**
   * テキストを音声に変換する
   * @param text 変換するテキスト
   * @param voiceType 音声タイプ（'male' または 'female'）
   * @param speakingRate 話速（数値）
   * @returns 音声データ（Blob）
   */
  async synthesizeSpeech(text: string, voiceType: 'male' | 'female' = 'female', speakingRate: number = 1.0): Promise<Blob> {
    try {
      logDebug('音声合成リクエスト', { text, voiceType, speakingRate });
      const response = await fetch(`${API_URL}/tts`, getAuthOptions('POST', {
        text,
        voice_type: voiceType,
        speaking_rate: speakingRate
      }));
      
      // blobレスポンスの処理
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '音声合成中にエラーが発生しました');
      }
      
      return await response.blob();
    } catch (error) {
      logDebug('音声合成エラー', error);
      throw new Error(`音声合成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
};

// 従来のエクスポート関数を維持（互換性のため）
export const createNote = noteApi.createNote;
export const fetchNote = noteApi.getNote;
export const updateNote = noteApi.updateNote;
export const deleteNote = noteApi.deleteNote;
export const fetchNotes = noteApi.getNotes;
export const updatePage = noteApi.updatePage;
export const getPage = noteApi.getPage;
export const executeOCR = noteApi.executeOCR;
export const synthesizeSpeech = noteApi.synthesizeSpeech;

export default noteApi;
