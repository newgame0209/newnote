import { Note, CreateNoteData } from '../types/note';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_NOTE_API_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

/**
 * ノート作成APIを呼び出す
 * @param data 作成するノートのデータ
 */
export const createNote = async (data: CreateNoteData): Promise<Note> => {
  try {
    const response = await axiosInstance.post('/notes', data);
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
    const response = await axiosInstance.get(`/notes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw new Error('ノートの取得中にエラーが発生しました');
  }
};

/**
 * 指定されたIDのノートを更新する
 * @param id ノートID
 * @param data 更新するデータ
 */
export const updateNote = async (id: string, data: Partial<CreateNoteData>): Promise<Note> => {
  try {
    const response = await axiosInstance.put(`/notes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('ノートの更新中にエラーが発生しました');
  }
};

/**
 * 指定されたIDのノートを削除する
 * @param id ノートID
 */
export const deleteNote = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/notes/${id}`);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('ノートの削除中にエラーが発生しました');
  }
};

/**
 * ノート一覧を取得する
 */
export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const response = await axiosInstance.get('/notes');
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
    const response = await axiosInstance.put(`/notes/${noteId}/pages/${pageNumber}`, { content });
    return response.data;
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
};

/**
 * ページの取得
 */
export const getPage = async (noteId: string | number, pageNumber: number): Promise<any> => {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}/pages/${pageNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching page:', error);
    throw error;
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
    const response = await axiosInstance.post<{ text: string }>(`https://newnote-backend.onrender.com/api/notes/${noteId}/pages/${pageNumber}/ocr`, { image: imageData });
    return response.data.text;
  } catch (error) {
    console.error('OCR処理エラー:', error);
    throw new Error('OCR処理に失敗しました。もう一度お試しください。');
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
  voiceType: 'male' | 'female',
  speakingRate: number = 1.0
): Promise<Blob> => {
  try {
    const voiceConfig = {
      male: {
        name: 'ja-JP-Neural2-C',
        ssml_gender: 'MALE'
      },
      female: {
        name: 'ja-JP-Neural2-B',
        ssml_gender: 'FEMALE'
      }
    };

    const response = await axiosInstance.post('https://newnote-backend.onrender.com/api/tts', {
      text,
      voice: {
        language_code: 'ja-JP',
        ...voiceConfig[voiceType]
      },
      audio_config: {
        speaking_rate: speakingRate
      }
    }, {
      responseType: 'blob'
    });

    return response.data;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new Error('音声の生成中にエラーが発生しました');
  }
};
