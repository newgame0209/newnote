import axios from 'axios';
import { Memo, CreateMemoRequest, UpdateMemoRequest } from '../types/memo';

const BASE_URL = 'http://localhost:5002/api/memo';

export const memoApi = {
  // メモを作成
  async createMemo(data: CreateMemoRequest): Promise<Memo> {
    try {
      const response = await axios.post(`${BASE_URL}/memos`, data);
      return response.data;
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
      throw new Error('メモの作成に失敗しました');
    }
  },

  // メモを更新
  async updateMemo(id: number, data: UpdateMemoRequest): Promise<Memo> {
    try {
      const response = await axios.put(`${BASE_URL}/memos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('メモの更新に失敗しました:', error);
      throw new Error('メモの更新に失敗しました');
    }
  },

  // メモを取得
  async getMemo(id: number): Promise<Memo> {
    try {
      const response = await axios.get(`${BASE_URL}/memos/${id}`);
      return response.data;
    } catch (error) {
      console.error('メモの取得に失敗しました:', error);
      throw new Error('メモの取得に失敗しました');
    }
  },

  // 全メモを取得
  async getMemos(): Promise<Memo[]> {
    try {
      const response = await axios.get(`${BASE_URL}/memos`);
      return response.data;
    } catch (error) {
      console.error('メモ一覧の取得に失敗しました:', error);
      throw new Error('メモ一覧の取得に失敗しました');
    }
  },

  // カテゴリーでメモを検索
  async getMemosByCategory(mainCategory: string, subCategory?: string): Promise<Memo[]> {
    try {
      const params = new URLSearchParams();
      params.append('main_category', mainCategory);
      if (subCategory) {
        params.append('sub_category', subCategory);
      }
      const response = await axios.get(`${BASE_URL}/memos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('カテゴリーによるメモの取得に失敗しました:', error);
      throw new Error('カテゴリーによるメモの取得に失敗しました');
    }
  }
};
