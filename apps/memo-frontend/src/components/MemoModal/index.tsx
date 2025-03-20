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
        { value: "strategy", label: "戦略企画" },
        { value: "brainstorming", label: "アイデア/ブレスト" },
        { value: "memo_info", label: "メモと情報収集" },
      ];
    case "study":
      return [
        { value: "math", label: "数学" },
        { value: "physics", label: "物理" },
        { value: "english", label: "英語" },
        { value: "social", label: "社会" },
        { value: "japanese", label: "国語" },
        { value: "exam", label: "試験対策" },
        { value: "marketing", label: "マーケティング" },
        { value: "programming", label: "プログラミング" },
        { value: "business", label: "起業とビジネス" },
      ];
    case "personal":
      return [
        { value: "diary", label: "日記" },
        { value: "todo", label: "ToDo" },
        { value: "idea", label: "アイデア" },
        { value: "other", label: "その他" },
        { value: "sidework", label: "副業" },
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
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold">
            新規メモ作成
          </Dialog.Title>
          
          <div className="mt-4 space-y-5">
            <div>
              <Label.Root className="text-sm font-medium block mb-1">
                タイトル
              </Label.Root>
              <input
                type="text"
                value={settings.title}
                onChange={(e) =>
                  setSettings({ ...settings, title: e.target.value })
                }
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-base dark:border-slate-700 dark:bg-slate-800"
                placeholder="メモのタイトルを入力"
              />
            </div>

            <div>
              <Label.Root className="text-sm font-medium block mb-1">
                メインカテゴリ
              </Label.Root>
              <div className="grid grid-cols-3 gap-3">
                {mainCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        mainCategory: category.value,
                        subCategory: "",
                      });
                    }}
                    className={cn(
                      "relative flex h-12 items-center justify-center px-3 py-2 rounded-md text-base font-medium",
                      "focus:bg-slate-100 dark:focus:bg-slate-700",
                      "select-none",
                      settings.mainCategory === category.value 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-50 border-2 border-blue-500" 
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {settings.mainCategory && (
              <div>
                <Label.Root className="text-sm font-medium block mb-1">
                  サブカテゴリ
                </Label.Root>
                <div className={cn(
                  "grid gap-3",
                  getSubCategories(settings.mainCategory).length > 6 
                    ? "grid-cols-2 md:grid-cols-3" 
                    : "grid-cols-2"
                )}>
                  {getSubCategories(settings.mainCategory).map(
                    (category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => 
                          setSettings({ ...settings, subCategory: category.value })
                        }
                        className={cn(
                          "relative flex h-12 items-center justify-center px-3 py-2 rounded-md text-base font-medium",
                          "focus:bg-slate-100 dark:focus:bg-slate-700",
                          "select-none",
                          settings.subCategory === category.value 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-50 border-2 border-blue-500" 
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        {category.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="rounded-md px-5 py-2.5 text-base font-medium text-slate-700 border border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-md bg-blue-500 px-5 py-2.5 text-base font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              作成
            </button>
          </div>

          <button
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={onClose}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
