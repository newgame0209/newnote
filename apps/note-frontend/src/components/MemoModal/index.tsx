import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { cn } from "@/utils/utils";

interface Memo {
  id: number;
  title: string;
  content: string;
  mainCategory?: string;
  subCategory?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemoCreate: (memo: {
    title: string;
    mainCategory?: string;
    subCategory?: string;
    content: string;
  }) => Promise<Memo>;
}

interface MemoSettings {
  mainCategory: string;
  subCategory: string;
  title: string;
}

const mainCategories = [
  { label: '仕事', value: 'work' },
  { label: '学習', value: 'study' },
  { label: 'プライベート', value: 'private' }
];

const subCategories = {
  work: [
    { label: '会議', value: 'meeting' },
    { label: 'レポート', value: 'report' },
    { label: '戦略企画', value: 'strategy' },
    { label: 'アイデア/ブレスト', value: 'idea' },
    { label: '業務連絡とメモ', value: 'memo' }
  ],
  study: [
    { label: '数学', value: 'math' },
    { label: '物理', value: 'physics' },
    { label: '化学', value: 'chemistry' },
    { label: '英語', value: 'english' },
    { label: '歴史', value: 'history' },
    { label: '文学', value: 'literature' },
    { label: '試験対策', value: 'exam' }
  ],
  private: [
    { label: '日記', value: 'diary' },
    { label: '趣味', value: 'hobby' },
    { label: '旅行', value: 'travel' },
    { label: '家計簿/買い物リスト', value: 'finance' }
  ]
};

const selectItemClass = (isSelected: boolean) =>
  cn(
    "relative flex items-center px-8 py-2 rounded-md text-sm font-medium text-white",
    "focus:bg-slate-100 dark:focus:bg-slate-700",
    "radix-disabled:opacity-50",
    "select-none",
    isSelected ? "bg-blue-50 dark:bg-blue-900" : ""
  );

const MemoModal = ({ open, onOpenChange, onMemoCreate }: MemoModalProps) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<MemoSettings>({
    mainCategory: "",
    subCategory: "",
    title: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newMemo = await onMemoCreate({
        title: settings.title,
        content: "",
        mainCategory: settings.mainCategory,
        subCategory: settings.subCategory,
      });
      onOpenChange(false);
      setSettings({
        mainCategory: "",
        subCategory: "",
        title: "",
      });
      // 新しく作成されたメモのIDを使用してリダイレクト
      if (newMemo) {
        navigate(`/memo/edit/${newMemo.id}`);
      }
    } catch (error) {
      console.error('メモの作成に失敗しました:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-6 shadow-lg focus:outline-none"
        >
          <Dialog.Title asChild>
            <h2 className="mb-4 text-lg font-bold">新規メモ作成</h2>
          </Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-gray-600">
            新しいメモを作成します。以下のフォームに必要な情報を入力してください。
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <Label.Root className="block text-sm font-medium text-gray-700" htmlFor="main-category">
                メインカテゴリ
              </Label.Root>
              <Select.Root
                value={settings.mainCategory}
                onValueChange={(value) => setSettings({ ...settings, mainCategory: value, subCategory: "" })}
              >
                <Select.Trigger
                  id="main-category"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <Select.Value placeholder="カテゴリを選択" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    <Select.Viewport className="p-1">
                      {mainCategories.map((category) => (
                        <Select.Item
                          key={category.value}
                          value={category.value}
                          className={cn(
                            "relative flex cursor-default select-none items-center rounded-sm px-8 py-2 text-sm outline-none",
                            "hover:bg-blue-50 focus:bg-blue-50"
                          )}
                        >
                          <Select.ItemText>{category.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {settings.mainCategory && (
              <div className="space-y-4">
                <Label.Root className="block text-sm font-medium text-gray-700" htmlFor="sub-category">
                  サブカテゴリ
                </Label.Root>
                <Select.Root
                  value={settings.subCategory}
                  onValueChange={(value) => setSettings({ ...settings, subCategory: value })}
                >
                  <Select.Trigger
                    id="sub-category"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <Select.Value placeholder="サブカテゴリを選択" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                      <Select.Viewport className="p-1">
                        {subCategories[settings.mainCategory].map((category) => (
                          <Select.Item
                            key={category.value}
                            value={category.value}
                            className={cn(
                              "relative flex cursor-default select-none items-center rounded-sm px-8 py-2 text-sm outline-none",
                              "hover:bg-blue-50 focus:bg-blue-50"
                            )}
                          >
                            <Select.ItemText>{category.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}

            <div className="space-y-4">
              <Label.Root className="block text-sm font-medium text-gray-700" htmlFor="title">
                タイトル
              </Label.Root>
              <input
                id="title"
                type="text"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                作成
              </button>
            </div>
          </form>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
            <span className="sr-only">閉じる</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MemoModal;
