export interface Note {
  id: string;
  title: string;
  main_category: string;
  sub_category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteData {
  title: string;
  main_category: string;
  sub_category: string;
}
