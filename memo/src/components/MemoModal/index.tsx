import React, { useState } from "react";
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

interface CreateMemoDto {
  title: string;
  content?: string;
  mainCategory?: string;
  subCategory?: string;
}

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memo: CreateMemoDto) => void;
}

interface MemoSettings {
  mainCategory: string;
  subCategory: string;
  title: string;
}

const mainCategories = [
  { value: "work", label: "仕事" },
  { value: "study", label: "学習" },
  { value: "personal", label: "プライベート" },
];

const getSubCategories = (mainCategory: string) => {
  switch (mainCategory) {
    case "work":
      return [
        { value: "meeting", label: "会議" },
        { value: "report", label: "レポート" },
        { value: "task", label: "タスク" },
        { value: "idea", label: "アイデア" },
      ];
    case "study":
      return [
        { value: "note", label: "ノート" },
        { value: "summary", label: "まとめ" },
        { value: "question", label: "質問" },
        { value: "reference", label: "参考資料" },
      ];
    case "personal":
      return [
        { value: "diary", label: "日記" },
        { value: "todo", label: "ToDo" },
        { value: "idea", label: "アイデア" },
        { value: "other", label: "その他" },
      ];
    default:
      return [];
  }
};

const selectItemClass = (isSelected: boolean) =>
  cn(
    "relative flex items-center px-8 py-2 rounded-md text-sm font-medium",
    "focus:bg-slate-100 dark:focus:bg-slate-700",
    "radix-disabled:opacity-50",
    "select-none",
    isSelected ? "bg-blue-50 dark:bg-blue-900" : ""
  );

export function MemoModal({ isOpen, onClose, onSubmit }: MemoModalProps) {
  const [settings, setSettings] = useState<MemoSettings>({
    mainCategory: "",
    subCategory: "",
    title: "",
  });

  const handleSubmit = async () => {
    if (!settings.title.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    const memo: CreateMemoDto = {
      title: settings.title,
      mainCategory: settings.mainCategory || undefined,
      subCategory: settings.subCategory || undefined,
    };

    await onSubmit(memo);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900">
          <Dialog.Title className="text-lg font-semibold">
            新規メモ作成
          </Dialog.Title>
          
          <div className="mt-4 space-y-4">
            <div>
              <Label.Root className="text-sm font-medium">
                タイトル
              </Label.Root>
              <input
                type="text"
                value={settings.title}
                onChange={(e) =>
                  setSettings({ ...settings, title: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                placeholder="メモのタイトルを入力"
              />
            </div>

            <div>
              <Label.Root className="text-sm font-medium">
                メインカテゴリ
              </Label.Root>
              <Select.Root
                value={settings.mainCategory}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    mainCategory: value,
                    subCategory: "",
                  })
                }
              >
                <Select.Trigger className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <Select.Value placeholder="カテゴリを選択" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                    <Select.Viewport>
                      {mainCategories.map((category) => (
                        <Select.Item
                          key={category.value}
                          value={category.value}
                          className={selectItemClass(
                            settings.mainCategory === category.value
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
              <div>
                <Label.Root className="text-sm font-medium">
                  サブカテゴリ
                </Label.Root>
                <Select.Root
                  value={settings.subCategory}
                  onValueChange={(value) =>
                    setSettings({ ...settings, subCategory: value })
                  }
                >
                  <Select.Trigger className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <Select.Value placeholder="サブカテゴリを選択" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                      <Select.Viewport>
                        {getSubCategories(settings.mainCategory).map(
                          (category) => (
                            <Select.Item
                              key={category.value}
                              value={category.value}
                              className={selectItemClass(
                                settings.subCategory === category.value
                              )}
                            >
                              <Select.ItemText>{category.label}</Select.ItemText>
                            </Select.Item>
                          )
                        )}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              作成
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
