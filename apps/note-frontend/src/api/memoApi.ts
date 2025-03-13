/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import axios from 'axios';
import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

const API_BASE_URL = import.meta.env.VITE_MEMO_API_URL || 'http://localhost:5002/api';

/**
 * 認証トークン付きのAxiosインスタンスを作成
 */
const getAuthAxios = () => {
  const token = localStorage.getItem('token');
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    withCredentials: true
  });
};

const memoApi = {
  /**
   * メモ一覧を取得
   */
  getMemos: async (): Promise<Memo[]> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.get('/memo/memos/list');
      return response.data;
    } catch (error) {
      console.error('メモ一覧の取得に失敗しました:', error);
      throw new Error('メモ一覧の取得に失敗しました');
    }
  },

  /**
   * メモを作成
   */
  createMemo: async (data: CreateMemoData): Promise<Memo> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.post('/memo/memos', data);
      return response.data;
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
      throw new Error('メモの作成に失敗しました');
    }
  },

  /**
   * メモを取得
   */
  getMemo: async (id: number): Promise<Memo> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.get(`/memo/memos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`メモ(ID: ${id})の取得に失敗しました:`, error);
      throw new Error('メモの取得に失敗しました');
    }
  },

  /**
   * メモを更新
   */
  updateMemo: async (id: number, data: UpdateMemoData): Promise<Memo> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.put(`/memo/memos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`メモ(ID: ${id})の更新に失敗しました:`, error);
      throw new Error('メモの更新に失敗しました');
    }
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    try {
      const axiosInstance = getAuthAxios();
      await axiosInstance.delete(`/memo/memos/${id}`);
    } catch (error) {
      console.error(`メモ(ID: ${id})の削除に失敗しました:`, error);
      throw new Error('メモの削除に失敗しました');
    }
  },

  /**
   * @docs
   * メモの全てのページを取得
   * @param id メモID
   */
  getMemoPages: async (id: number): Promise<MemoPage[]> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.get(`/memo/memos/${id}/pages`);
      return response.data;
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ一覧の取得に失敗しました:`, error);
      throw new Error('メモのページ一覧の取得に失敗しました');
    }
  },

  /**
   * @docs
   * メモの特定ページを取得
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   */
  getMemoPage: async (id: number, pageNumber: number): Promise<MemoPage> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.get(`/memo/memos/${id}/pages/${pageNumber}`);
      return response.data;
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})の取得に失敗しました:`, error);
      throw new Error('メモのページの取得に失敗しました');
    }
  },

  /**
   * @docs
   * メモに新しいページを追加
   * @param id メモID
   * @param content ページの内容
   */
  addMemoPage: async (id: number, content: string = ''): Promise<MemoPage> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.post(`/memo/memos/${id}/pages`, { content });
      return response.data;
    } catch (error) {
      console.error(`メモ(ID: ${id})への新規ページ追加に失敗しました:`, error);
      throw new Error('メモへの新規ページ追加に失敗しました');
    }
  },

  /**
   * @docs
   * メモの特定ページを更新
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   * @param content 更新内容
   */
  updateMemoPage: async (id: number, pageNumber: number, content: string): Promise<MemoPage> => {
    try {
      const axiosInstance = getAuthAxios();
      const response = await axiosInstance.put(`/memo/memos/${id}/pages/${pageNumber}`, { content });
      return response.data;
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})の更新に失敗しました:`, error);
      throw new Error('メモのページの更新に失敗しました');
    }
  },

  /**
   * @docs
   * メモの特定ページを削除
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   */
  deleteMemoPage: async (id: number, pageNumber: number): Promise<void> => {
    try {
      const axiosInstance = getAuthAxios();
      await axiosInstance.delete(`/memo/memos/${id}/pages/${pageNumber}`);
    } catch (error) {
      console.error(`メモ(ID: ${id})のページ(${pageNumber})の削除に失敗しました:`, error);
      throw new Error('メモのページの削除に失敗しました');
    }
  }
};

export default memoApi;
