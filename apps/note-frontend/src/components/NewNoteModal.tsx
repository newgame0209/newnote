import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/utils";
import { Note } from "@/types/note";

interface NewNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreate: (note: {
    title: string;
    main_category: string;
    sub_category: string;
  }) => Promise<Note | null>;
}

interface NoteSettings {
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
        { value: "hobby", label: "趣味" },
        { value: "travel", label: "旅行" },
        { value: "shopping", label: "家計簿/買い物リスト" },
        { value: "sidework", label: "副業" },
      ];
    default:
      return [];
  }
};

const selectItemClass = (isSelected: boolean) =>
  cn(
    "relative flex h-8 select-none items-center rounded-sm pl-8 pr-4 text-sm",
    "data-[highlighted]:bg-primary-100 data-[highlighted]:text-primary-900",
    isSelected ? "bg-primary-100 text-primary-900" : "bg-white",
    "outline-none cursor-pointer"
  );

export function NewNoteModal({
  open,
  onOpenChange,
  onNoteCreate,
}: NewNoteModalProps) {
  const [settings, setSettings] = React.useState<NoteSettings>({
    mainCategory: "",
    subCategory: "",
    title: "",
  });

  const [errors, setErrors] = React.useState<{
    title?: string;
    mainCategory?: string;
    subCategory?: string;
  }>({});

  const [keyboardVisible, setKeyboardVisible] = React.useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isKeyboardVisible = window.visualViewport?.height !== window.innerHeight;
      setKeyboardVisible(isKeyboardVisible);
    };

    window.visualViewport?.addEventListener('resize', handleVisibilityChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisibilityChange);
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!settings.title.trim()) {
      newErrors.title = "タイトルを入力してください";
      isValid = false;
    }

    if (!settings.mainCategory) {
      newErrors.mainCategory = "メインカテゴリを選択してください";
      isValid = false;
    }

    if (!settings.subCategory) {
      newErrors.subCategory = "サブカテゴリを選択してください";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const newNote = await onNoteCreate({
        title: settings.title,
        main_category: settings.mainCategory,
        sub_category: settings.subCategory,
      });

      onOpenChange(false);
      setSettings({
        mainCategory: "",
        subCategory: "",
        title: "",
      });
      setErrors({});
      
      // 新しく作成されたノートのIDを使用してリダイレクト
      if (newNote) {
        navigate(`/edit/${newNote.id}`);
      }
    } catch (error) {
      console.error('ノートの作成に失敗しました:', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className={cn(
          "fixed left-1/2 w-[95vw] max-w-[600px] -translate-x-1/2 rounded-lg bg-white shadow-lg overflow-y-auto max-h-[90vh]",
          keyboardVisible 
            ? "top-2 p-4" 
            : "top-1/2 -translate-y-1/2 p-6" 
        )}>
          <Dialog.Title className="text-xl font-semibold mb-4">
            新規ノート作成
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-4">
            新しいノートを作成します。タイトルとカテゴリを入力してください。
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={settings.title}
                onChange={(e) => {
                  setSettings({ ...settings, title: e.target.value });
                  if (errors.title) {
                    setErrors({ ...errors, title: undefined });
                  }
                }}
                className={cn(
                  "block w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                  errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                メインカテゴリ <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 grid grid-cols-3 gap-3">
                {mainCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, mainCategory: category.value, subCategory: "" });
                      if (errors.mainCategory) {
                        setErrors({ ...errors, mainCategory: undefined });
                      }
                    }}
                    className={cn(
                      "relative flex h-12 select-none items-center justify-center rounded-md px-3 py-2 text-base",
                      "data-[highlighted]:bg-primary-100 data-[highlighted]:text-primary-900",
                      settings.mainCategory === category.value 
                        ? "bg-primary-100 text-primary-900 font-medium border-2 border-primary-500" 
                        : "bg-white border border-gray-300 hover:bg-gray-50",
                      "outline-none cursor-pointer"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.mainCategory && (
                <p className="mt-1 text-sm text-red-500">{errors.mainCategory}</p>
              )}
            </div>

            {settings.mainCategory && (
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  サブカテゴリ <span className="text-red-500">*</span>
                </label>
                <div className={cn(
                  "mt-1 grid gap-2",
                  getSubCategories(settings.mainCategory).length > 6 
                    ? "grid-cols-2 md:grid-cols-3" 
                    : "grid-cols-2"
                )}>
                  {getSubCategories(settings.mainCategory).map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, subCategory: category.value });
                        if (errors.subCategory) {
                          setErrors({ ...errors, subCategory: undefined });
                        }
                      }}
                      className={cn(
                        "relative flex h-12 select-none items-center justify-center rounded-md px-3 py-2 text-base",
                        "data-[highlighted]:bg-primary-100 data-[highlighted]:text-primary-900",
                        settings.subCategory === category.value 
                          ? "bg-primary-100 text-primary-900 font-medium border-2 border-primary-500" 
                          : "bg-white border border-gray-300 hover:bg-gray-50",
                        "outline-none cursor-pointer"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                {errors.subCategory && (
                  <p className="mt-1 text-sm text-red-500">{errors.subCategory}</p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md px-5 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-100 border border-gray-300"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-5 py-2.5 text-base font-medium text-white hover:bg-primary-700"
              >
                作成
              </button>
            </div>
          </form>

          <button
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
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
