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
    
    console.log(`Creating memo with request data:`, requestData);
    try {
      const response = await axiosInstance.post('/memo/memos', requestData);
      console.log(`Memo created successfully, response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to create memo:`, error);
      throw error;
    }
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
   * @param pageNumber ページ番号 (1ベース)
   */
  getMemoPage: async (id: number, pageNumber: number): Promise<MemoPage> => {
    // バックエンドと同じページ番号体系（1ベース）を使用
    const backendPageNumber = pageNumber;
    console.log(`Getting memo page: frontend=${pageNumber}, backend=${backendPageNumber}, memo_id=${id}`);
    try {
      const response = await axiosInstance.get(`/memo/memos/${id}/pages/${backendPageNumber}`);
      console.log(`Page retrieved successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get memo page:`, error);
      throw error;
    }
  },

  /**
   * @docs
   * メモに新しいページを追加
   * @param id メモID
   * @param content ページの内容
   */
  addMemoPage: async (id: number, content: string = ''): Promise<MemoPage> => {
    console.log(`Adding new page to memo ${id} with content length: ${content.length}`);
    try {
      const response = await axiosInstance.post(`/memo/memos/${id}/pages`, { content });
      console.log(`New page added successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to add new page:`, error);
      throw error;
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
    // バックエンドと同じページ番号体系（1ベース）を使用
    const backendPageNumber = pageNumber;
    console.log(`Updating page: frontend=${pageNumber}, backend=${backendPageNumber}, memo_id=${id}, content length=${content.length}`);
    try {
      const response = await axiosInstance.put(`/memo/memos/${id}/pages/${backendPageNumber}`, { content });
      console.log(`Page updated successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`PUT /memo/memos/${id}/pages/${backendPageNumber}`, error);
      
      // ページが見つからない場合は自動的に作成を試みる
      if (error.response && error.response.status === 404) {
        console.log(`Page not found, attempting to create it automatically...`);
        try {
          // ページが存在しない場合は新規作成を試みる
          const newPageResponse = await axiosInstance.post(`/memo/memos/${id}/pages`, { content });
          console.log(`Auto-created missing page:`, newPageResponse.data);
          return newPageResponse.data;
        } catch (createError: any) {
          console.error(`Failed to auto-create page:`, createError);
          throw createError;
        }
      }
      
      throw error;
    }
  },

  /**
   * @docs
   * メモの特定ページを削除
   * @param id メモID
   * @param pageNumber ページ番号 (1ベース)
   */
  deleteMemoPage: async (id: number, pageNumber: number): Promise<void> => {
    // バックエンドと同じページ番号体系（1ベース）を使用
    const backendPageNumber = pageNumber;
    console.log(`Deleting page: frontend=${pageNumber}, backend=${backendPageNumber}, memo_id=${id}`);
    try {
      await axiosInstance.delete(`/memo/memos/${id}/pages/${backendPageNumber}`);
      console.log(`Page deleted successfully`);
    } catch (error: any) {
      console.error(`Failed to delete page:`, error);
      throw error;
    }
  },
};

export default memoApi;
