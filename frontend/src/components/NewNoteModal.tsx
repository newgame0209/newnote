import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/utils";

interface NewNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreate: (note: {
    title: string;
    mainCategory: string;
    subCategory: string;
    type: string;
    size: string;
    orientation: string;
  }) => void;
}

type PaperSize = "A4" | "A3" | "A7";
type PaperOrientation = "portrait" | "landscape";
type PaperColor = "white" | "yellow";

interface NoteSettings {
  size: PaperSize;
  orientation: PaperOrientation;
  color: PaperColor;
  mainCategory: string;
  subCategory: string;
  title: string;
}

const mainCategories = [
  { value: "work", label: "仕事" },
  { value: "study", label: "学習" },
  { value: "personal", label: "プライベート" },
];

const paperSizes = [
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A7", label: "A7" },
];

const getSubCategories = (mainCategory: string) => {
  switch (mainCategory) {
    case "work":
      return [
        { value: "meeting", label: "会議" },
        { value: "report", label: "レポート" },
        { value: "strategy", label: "戦略企画" },
        { value: "brainstorming", label: "アイデア/ブレスト" },
        { value: "memo", label: "業務連絡とメモ" },
      ];
    case "study":
      return [
        { value: "math", label: "数学" },
        { value: "physics", label: "物理" },
        { value: "science", label: "科学" },
        { value: "english", label: "英語" },
        { value: "history", label: "歴史" },
        { value: "literature", label: "文学" },
        { value: "exam", label: "試験対策" },
      ];
    case "personal":
      return [
        { value: "diary", label: "日記" },
        { value: "hobby", label: "趣味" },
        { value: "travel", label: "旅行" },
        { value: "shopping", label: "家計簿/買い物リスト" },
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
    size: "A4",
    orientation: "portrait",
    color: "white",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onNoteCreate({
      title: settings.title,
      mainCategory: settings.mainCategory,
      subCategory: settings.subCategory,
      type: "text",
      size: settings.size,
      orientation: settings.orientation,
    });

    onOpenChange(false);
    navigate("/edit/new");

    setSettings({
      size: "A4",
      orientation: "portrait",
      color: "white",
      mainCategory: "",
      subCategory: "",
      title: "",
    });
    setErrors({});
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content 
          className={cn(
            "fixed left-1/2 w-[90vw] max-w-[500px] -translate-x-1/2 rounded-lg bg-white p-6 shadow-lg",
            keyboardVisible 
              ? "top-4" 
              : "top-1/2 -translate-y-1/2" 
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
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
                  "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
                  errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
              >
                メインカテゴリ <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {mainCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      setSettings({ ...settings, mainCategory: category.value });
                      if (errors.mainCategory) {
                        setErrors({ ...errors, mainCategory: undefined });
                      }
                    }}
                    className={selectItemClass(settings.mainCategory === category.value)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.mainCategory && (
                <p className="mt-1 text-sm text-red-500">{errors.mainCategory}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
              >
                サブカテゴリ <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 grid grid-cols-3 gap-2">
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
                    className={selectItemClass(settings.subCategory === category.value)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.subCategory && (
                <p className="mt-1 text-sm text-red-500">{errors.subCategory}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
              >
                用紙サイズ <span className="text-red-500">*</span>
              </label>
              <RadioGroup.Root
                value={settings.size}
                onValueChange={(value: PaperSize) => setSettings({ ...settings, size: value })}
                className="mt-1 grid grid-cols-3 gap-2"
              >
                {paperSizes.map((size) => (
                  <RadioGroup.Item
                    key={size.value}
                    value={size.value}
                    className={selectItemClass(settings.size === size.value)}
                  >
                    {size.label}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
              >
                用紙の向き <span className="text-red-500">*</span>
              </label>
              <RadioGroup.Root
                value={settings.orientation}
                onValueChange={(value: PaperOrientation) => setSettings({ ...settings, orientation: value })}
                className="mt-1 grid grid-cols-2 gap-2"
              >
                <RadioGroup.Item
                  value="portrait"
                  className={selectItemClass(settings.orientation === "portrait")}
                >
                  縦向き
                </RadioGroup.Item>
                <RadioGroup.Item
                  value="landscape"
                  className={selectItemClass(settings.orientation === "landscape")}
                >
                  横向き
                </RadioGroup.Item>
              </RadioGroup.Root>
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
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                作成
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
