export interface Memo {
  id: number;
  title: string;
  content: string;
  main_category: string | null;
  sub_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoRequest {
  title: string;
  content: string;
  main_category?: string;
  sub_category?: string;
}

export interface UpdateMemoRequest {
  title?: string;
  content?: string;
  main_category?: string;
  sub_category?: string;
}
