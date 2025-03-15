import { Note, CreateNoteData } from '../types/note';
import axios from 'axios'; // axiosをインポートする

// 相対パスを使用
export const API_BASE_URL = import.meta.env.VITE_NOTE_API_URL || 'https://newnote-backend.onrender.com';

/**
 * 認証トークン付きのAxiosインスタンスを作成
 */
const getAuthAxios = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('認証情報がありません。再ログインしてください。');
  }
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

/**
 * ノートを作成する
 * @param data 作成するノートのデータ
 */
export const createNote = async (data: CreateNoteData): Promise<Note> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.post('/api/notes', data);
    return response.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error('ノートの作成中にエラーが発生しました');
  }
};

/**
 * 指定されたIDのノートを取得する
 * @param id ノートID
 */
export const fetchNote = async (id: string): Promise<Note> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.get(`/api/notes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching note with id ${id}:`, error);
    throw new Error(`ノートの取得中にエラーが発生しました (ID: ${id})`);
  }
};

/**
 * 指定されたIDのノートを更新する
 * @param id ノートID
 * @param data 更新するデータ
 */
export const updateNote = async (id: string, data: Partial<CreateNoteData>): Promise<Note> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.put(`/api/notes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating note with id ${id}:`, error);
    throw new Error(`ノートの更新中にエラーが発生しました (ID: ${id})`);
  }
};

/**
 * 指定されたIDのノートを削除する
 * @param id ノートID
 */
export const deleteNote = async (id: string): Promise<void> => {
  try {
    const axiosInstance = getAuthAxios();
    await axiosInstance.delete(`/api/notes/${id}`);
  } catch (error) {
    console.error(`Error deleting note with id ${id}:`, error);
    throw new Error(`ノートの削除中にエラーが発生しました (ID: ${id})`);
  }
};

/**
 * ノート一覧を取得する
 */
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.get('/api/notes');
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('ノート一覧の取得中にエラーが発生しました');
  }
};

/**
 * ページの保存
 */
export const updatePage = async (noteId: string | number, pageNumber: number, content: string): Promise<any> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.put(`/api/notes/${noteId}/pages/${pageNumber}`, { content });
    return response.data;
  } catch (error) {
    console.error(`Error updating page ${pageNumber} of note ${noteId}:`, error);
    throw new Error(`ページの保存中にエラーが発生しました (ノート: ${noteId}, ページ: ${pageNumber})`);
  }
};

/**
 * ページの取得
 */
export const getPage = async (noteId: string | number, pageNumber: number): Promise<any> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.get(`/api/notes/${noteId}/pages/${pageNumber}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${pageNumber} of note ${noteId}:`, error);
    throw new Error(`ページの取得中にエラーが発生しました (ノート: ${noteId}, ページ: ${pageNumber})`);
  }
};

/**
 * OCR処理を実行する
 * @param noteId ノートID
 * @param pageNumber ページ番号
 * @param imageData 画像データ（base64）
 * @returns OCR結果のテキスト
 */
export const executeOCR = async (noteId: number, pageNumber: number, imageData: string): Promise<string> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.post(`/api/ocr`, {
      note_id: noteId,
      page_number: pageNumber,
      image_data: imageData
    });
    return response.data.text;
  } catch (error) {
    console.error('OCR execution error:', error);
    throw new Error('OCR処理中にエラーが発生しました');
  }
};

/**
 * テキストを音声に変換する
 * @param text 変換するテキスト
 * @param voiceType 音声タイプ（'male' または 'female'）
 * @param speakingRate 話速（数値）
 * @returns 音声データ（Blob）
 */
export const synthesizeSpeech = async (
  text: string,
  voiceType: 'male' | 'female' = 'female',
  speakingRate: number = 1.0
): Promise<Blob> => {
  try {
    const axiosInstance = getAuthAxios();
    const response = await axiosInstance.post(
      `/api/tts`,
      {
        text,
        voice_type: voiceType,
        speaking_rate: speakingRate
      },
      {
        responseType: 'blob'
      }
    );
    return response.data;
  } catch (error) {
    console.error('Speech synthesis error:', error);
    throw new Error('音声合成中にエラーが発生しました');
  }
};
