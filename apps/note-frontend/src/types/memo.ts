export interface Memo {
  id: number;
  title: string;
  content: string;
  mainCategory?: string;
  subCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoData {
  title: string;
  content?: string;
  mainCategory?: string;
  subCategory?: string;
}

export interface UpdateMemoData {
  title?: string;
  content?: string;
  mainCategory?: string;
  subCategory?: string;
}
