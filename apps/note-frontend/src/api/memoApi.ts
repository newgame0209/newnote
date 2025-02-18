/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import axios from 'axios';

const API_BASE_URL = process.env.MEMO_API_URL || 'http://localhost:5002/api';

interface Memo {
  id: number;
  title: string;
  content: string;
  mainCategory?: string;
  subCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMemoInput {
  title: string;
  content?: string;
  mainCategory?: string;
  subCategory?: string;
}

interface UpdateMemoInput {
  title?: string;
  content?: string;
  mainCategory?: string;
  subCategory?: string;
}

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
  createMemo: async (data: CreateMemoInput): Promise<Memo> => {
    const response = await axiosInstance.post('/memo/memos', {
      title: data.title,
      content: data.content || '',
      main_category: data.mainCategory,
      sub_category: data.subCategory
    });
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
  updateMemo: async (id: number, data: UpdateMemoInput): Promise<Memo> => {
    const response = await axiosInstance.put(`/memo/memos/${id}`, {
      title: data.title,
      content: data.content,
      main_category: data.mainCategory,
      sub_category: data.subCategory
    });
    return response.data;
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/memo/memos/${id}`);
  },
};

export default memoApi;
