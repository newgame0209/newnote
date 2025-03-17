/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

interface Memo {
  id: number;
  title: string;
  content: string;
  mainCategory?: string;
  subCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMemoDto {
  title: string;
  content?: string;
  mainCategory?: string;
  subCategory?: string;
}

const memoApi = {
  /**
   * メモ一覧を取得
   */
  getMemos: async (): Promise<Memo[]> => {
    const response = await axios.get(`${API_BASE_URL}/memos`);
    return response.data;
  },

  /**
   * メモを作成
   */
  createMemo: async (data: CreateMemoDto): Promise<Memo> => {
    const response = await axios.post(`${API_BASE_URL}/memos`, data);
    return response.data;
  },

  /**
   * メモを取得
   */
  getMemo: async (id: number): Promise<Memo> => {
    const response = await axios.get(`${API_BASE_URL}/memos/${id}`);
    return response.data;
  },

  /**
   * メモを更新
   */
  updateMemo: async (id: number, data: Partial<CreateMemoDto>): Promise<Memo> => {
    const response = await axios.put(`${API_BASE_URL}/memos/${id}`, data);
    return response.data;
  },

  /**
   * メモを削除
   */
  deleteMemo: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/memos/${id}`);
  },
};

export default memoApi;
