export const CATEGORY_MAP = {
  work: '仕事',
  study: '学習',
  personal: 'プライベート',
  meeting: '会議',
  report: 'レポート',
  strategy: '戦略企画',
  brainstorming: 'アイデア/ブレスト',
  memo: '業務連絡とメモ',
  math: '数学',
  physics: '物理',
  science: '科学',
  chemistry: '化学',
  english: '英語学習',
  history: '歴史',
  literature: '文学',
  exam: '試験対策',
  diary: '日記',
  hobby: '趣味',
  travel: '旅行',
  shopping: '家計簿/買い物リスト',
  private: 'プライベート',
  finance: '家計/金融',
  business: 'ビジネス',
  education: '教育',
  research: '研究',
  project: 'プロジェクト',
  idea: 'アイデア',
  todo: 'タスク',
  note: 'ノート'
} as const;

export type CategoryKey = keyof typeof CATEGORY_MAP;
export type CategoryValue = typeof CATEGORY_MAP[CategoryKey];

export const getDisplayCategory = (category: string): string => {
  return CATEGORY_MAP[category as CategoryKey] || category;
};
