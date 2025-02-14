import { Note, CreateNoteData } from '../types/note';
import axios from 'axios'; // axiosをインポートする

// 相対パスを使用
export const API_BASE_URL = '/api';

/**
 * ノート作成APIを呼び出す
 * @param data 作成するノートのデータ
 */
export const createNote = async (data: CreateNoteData): Promise<Note> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ノートの作成に失敗しました');
    }

    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/notes/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ノートの取得に失敗しました');
    }

    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ノートの更新に失敗しました');
    }

    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ノートの削除に失敗しました');
    }
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
    const response = await fetch(`${API_BASE_URL}/notes`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ノート一覧の取得に失敗しました');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('ノート一覧の取得中にエラーが発生しました');
  }
};

// ページの保存
export const updatePage = async (noteId: string | number, pageNumber: number, content: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/pages/${pageNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ページの保存に失敗しました');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
};

// ページの取得
export const getPage = async (noteId: string | number, pageNumber: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/pages/${pageNumber}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ページの取得に失敗しました');
    }

    return response.json();
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
    const response = await axios.post<{ text: string }>(
      `${API_BASE_URL}/notes/${noteId}/pages/${pageNumber}/ocr`,
      { image: imageData }
    );
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
 * @returns 音声データ（Blob）
 */
export const synthesizeSpeech = async (
  text: string,
  voiceType: 'male' | 'female'
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

    const response = await fetch(`${API_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: {
          language_code: 'ja-JP',
          ...voiceConfig[voiceType]
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '音声の生成に失敗しました');
    }

    return response.blob();
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new Error('音声の生成中にエラーが発生しました');
  }
};
