import { Bookmark, CreateBookmarkData } from '../types/note';
import axios from 'axios';

// Vite環境変数にアクセスするための型宣言（スコープ外で読み込めるように）
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

const API_BASE_URL = import.meta.env.VITE_NOTE_API_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

/**
 * ノートのしおり一覧を取得する
 * @param noteId ノートID
 */
export const fetchBookmarks = async (noteId: string | number): Promise<Bookmark[]> => {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}/bookmarks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw new Error('しおりの取得中にエラーが発生しました');
  }
};

/**
 * 新しいしおりを作成する
 * @param noteId ノートID
 * @param data しおりのデータ
 */
export const createBookmark = async (
  noteId: string | number, 
  data: CreateBookmarkData
): Promise<Bookmark> => {
  try {
    const response = await axiosInstance.post(`/notes/${noteId}/bookmarks`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating bookmark:', error);
    throw new Error('しおりの作成中にエラーが発生しました');
  }
};

/**
 * 特定のしおりを取得する
 * @param noteId ノートID
 * @param bookmarkId しおりID
 */
export const fetchBookmark = async (
  noteId: string | number,
  bookmarkId: number
): Promise<Bookmark> => {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}/bookmarks/${bookmarkId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    throw new Error('しおりの取得中にエラーが発生しました');
  }
};

/**
 * しおりを更新する
 * @param noteId ノートID
 * @param bookmarkId しおりID
 * @param data 更新するデータ
 */
export const updateBookmark = async (
  noteId: string | number,
  bookmarkId: number,
  data: Partial<CreateBookmarkData>
): Promise<Bookmark> => {
  try {
    const response = await axiosInstance.put(`/notes/${noteId}/bookmarks/${bookmarkId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw new Error('しおりの更新中にエラーが発生しました');
  }
};

/**
 * しおりを削除する
 * @param noteId ノートID
 * @param bookmarkId しおりID
 */
export const deleteBookmark = async (
  noteId: string | number,
  bookmarkId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`/notes/${noteId}/bookmarks/${bookmarkId}`);
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw new Error('しおりの削除中にエラーが発生しました');
  }
};
