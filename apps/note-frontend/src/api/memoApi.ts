/**
 * @docs
 * メモ機能のAPIクライアント
 * ノートとは別のバックエンド（PORT: 5002）を使用
 */

import { memoApiClient } from './config/axiosConfig';
import { Memo, MemoPage, CreateMemoData, UpdateMemoData } from '@/types/memo';

const memoApi = {
  /**
   * メモ一覧を取得
   */
  getMemos: async (): Promise<Memo[]> => {
    const response = await memoApiClient.get('/memo/memos/list');
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
      const response = await memoApiClient.post('/memo/memos', requestData);
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
    const response = await memoApiClient.get(`/memo/memos/${id}`);
    return response.data;
  },

  /**
   * メモを更新
   */
  updateMemo: async (id: number, data: UpdateMemoData): Promise<Memo> => {
    const response = await memoApiClient.put(`/memo/memos/${id}`, {
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
    await memoApiClient.delete(`/memo/memos/${id}`);
  },
  
  /**
   * @docs
   * メモの全てのページを取得
   * @param id メモID
   */
  getMemoPages: async (id: number): Promise<MemoPage[]> => {
    console.log(`Getting all pages for memo ${id}`);
    try {
      const response = await memoApiClient.get(`/memo/memos/${id}/pages`);
      console.log(`Retrieved ${response.data.length} pages for memo ${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get memo pages:`, error);
      throw error;
    }
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
      const response = await memoApiClient.get(`/memo/memos/${id}/pages/${backendPageNumber}`);
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
      const response = await memoApiClient.post(`/memo/memos/${id}/pages`, { content });
      console.log(`New page added successfully:`, response.data);
      
      // APIレスポンスの形式を確認し、必要なプロパティを確実に返す
      if (response.data && typeof response.data === 'object') {
        // レスポンスデータをログ出力して確認
        console.log('API response data structure:', response.data);
        console.log('API response properties:', Object.keys(response.data).join(', '));
        
        // キャメルケースかスネークケースか判断
        const hasSnakeCase = 'page_number' in response.data;
        const hasCamelCase = 'pageNumber' in response.data;
        
        console.log(`プロパティ名形式: スネークケース=${hasSnakeCase}, キャメルケース=${hasCamelCase}`);
        
        // ページ番号をプロパティ名形式に応じて取得
        let pageNumber: number | undefined;
        let content = '';
        let created_at: string | undefined;
        let updated_at: string | undefined;
        
        if (hasSnakeCase) {
          pageNumber = response.data.page_number;
          content = response.data.content || '';
          created_at = response.data.created_at;
          updated_at = response.data.updated_at;
        } else if (hasCamelCase) {
          pageNumber = response.data.pageNumber;
          content = response.data.content || '';
          created_at = response.data.createdAt;
          updated_at = response.data.updatedAt;
        }
        
        if (!pageNumber) {
          console.error('APIレスポンスにページ番号情報が含まれていません:', response.data);
          throw new Error('Invalid API response: page number is required');
        }
        
        console.log(`抽出したページ情報: pageNumber=${pageNumber}, content=${content.substring(0, 30)}..., created_at=${created_at}, updated_at=${updated_at}`);
        
        // レスポンスデータをMemoPage型に変換
        const memoPage: MemoPage = {
          memo_id: id,
          page_number: pageNumber,
          content: content,
          created_at: created_at,
          updated_at: updated_at
        };
        
        return memoPage;
      } else {
        throw new Error('Invalid API response format');
      }
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
      const response = await memoApiClient.put(`/memo/memos/${id}/pages/${backendPageNumber}`, { content });
      console.log(`Page updated successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`PUT /memo/memos/${id}/pages/${backendPageNumber}`, error);
      
      // ページが見つからない場合は自動的に作成を試みる
      if (error.response && error.response.status === 404) {
        console.log(`Page not found, attempting to create it automatically...`);
        try {
          // ページが存在しない場合は新規作成を試みる
          const newPageResponse = await memoApiClient.post(`/memo/memos/${id}/pages`, { content });
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
      await memoApiClient.delete(`/memo/memos/${id}/pages/${backendPageNumber}`);
      console.log(`Page deleted successfully`);
    } catch (error: any) {
      console.error(`Failed to delete page:`, error);
      throw error;
    }
  },
};

export default memoApi;
