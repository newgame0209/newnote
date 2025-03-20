export const CATEGORY_MAP = {
  work: '仕事',
  study: '学習',
  personal: 'プライベート',
  meeting: '会議',
  report: 'レポート',
  strategy: '戦略企画',
  brainstorming: 'アイデア/ブレスト',
  memo_info: 'メモと情報収集',
  math: '数学',
  physics: '物理',
  english: '英語',
  social: '社会',
  japanese: '国語',
  exam: '試験対策',
  marketing: 'マーケティング',
  programming: 'プログラミング',
  business: '起業とビジネス',
  diary: '日記',
  hobby: '趣味',
  travel: '旅行',
  shopping: '家計簿/買い物リスト',
  sidework: '副業',
  idea: 'アイデア',
  todo: 'タスク',
  note: 'ノート',
  task: 'タスク',
  summary: 'まとめ',
  question: '質問',
  reference: '参考資料',
  other: 'その他'
} as const;

export type CategoryKey = keyof typeof CATEGORY_MAP;
export type CategoryValue = typeof CATEGORY_MAP[CategoryKey];

export const getDisplayCategory = (category: string): string => {
  return CATEGORY_MAP[category as CategoryKey] || category;
};
