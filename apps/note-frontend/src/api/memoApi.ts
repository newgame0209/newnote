/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import axios from 'axios';
import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

const API_BASE_URL = import.meta.env.VITE_MEMO_API_URL || 'http://localhost:5002/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

const memoApi = {
  /**
   * メモ一覧を取得
   */
  getMemos: async (): Promise<Memo[]> => {
    const response = await axiosInstance.get('/memo/memos/list');
    return response.data;
  },

  /**
   * メモを作成
   */
  createMemo: async (data: CreateMemoData): Promise<Memo> => {
    // ページ情報があれば含めて送信、なければシンプルなオブジェクトで送信
    const requestData = {
      title: data.title,
      content: data.content || '',
      main_category: data.mainCategory,
      sub_category: data.subCategory,
      pages: data.pages
    };
    
    const response = await axiosInstance.post('/memo/memos', requestData);
    return response.data;
  },

  /**
   * メモを取得
   */
  getMemo: async (id: number): Promise<Memo> => {
    const response = await axiosInstance.get(`/memo/memos/${id}`);
    return response.data;
  },

  /**
   * メモを更新
   */
  updateMemo: async (id: number, data: UpdateMemoData): Promise<Memo> => {
    const response = await axiosInstance.put(`/memo/memos/${id}`, {
      title: data.title,
      content: data.content,
      main_category: data.mainCategory,
      sub_category: data.subCategory,
      pages: data.pages
    });
    return response.data;
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/memo/memos/${id}`);
  },
  
  /**
   * @docs
   * メモの特定ページを取得
   * @param id メモID
   * @param pageNumber ページ番号 (0ベース)
   */
  getMemoPage: async (id: number, pageNumber: number): Promise<MemoPage> => {
    // フロントエンドで0ベース、バックエンドで1ベースなので変換
    const backendPageNumber = pageNumber + 1;
    const response = await axiosInstance.get(`/memo/memos/${id}/pages/${backendPageNumber}`);
    return response.data;
  },

  /**
   * @docs
   * メモに新しいページを追加
   * @param id メモID
   * @param content ページの内容
   */
  addMemoPage: async (id: number, content: string = ''): Promise<MemoPage> => {
    const response = await axiosInstance.post(`/memo/memos/${id}/pages`, { content });
    return response.data;
  },

  /**
   * @docs
   * メモの特定ページを更新
   * @param id メモID
   * @param pageNumber ページ番号 (0ベース)
   * @param content 更新内容
   */
  updateMemoPage: async (id: number, pageNumber: number, content: string): Promise<MemoPage> => {
    // フロントエンドで0ベース、バックエンドで1ベースなので変換
    const backendPageNumber = pageNumber + 1;
    const response = await axiosInstance.put(`/memo/memos/${id}/pages/${backendPageNumber}`, { content });
    return response.data;
  },

  /**
   * @docs
   * メモの特定ページを削除
   * @param id メモID
   * @param pageNumber ページ番号 (0ベース)
   */
  deleteMemoPage: async (id: number, pageNumber: number): Promise<void> => {
    // フロントエンドで0ベース、バックエンドで1ベースなので変換
    const backendPageNumber = pageNumber + 1;
    await axiosInstance.delete(`/memo/memos/${id}/pages/${backendPageNumber}`);
  },
};

export default memoApi;
