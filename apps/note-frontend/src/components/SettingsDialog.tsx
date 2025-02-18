import React from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { voiceType, setVoiceType } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-[425px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">設定</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">音声タイプ</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={voiceType === 'female'}
                onChange={() => setVoiceType('female')}
                className="w-4 h-4"
              />
              <span>女性</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={voiceType === 'male'}
                onChange={() => setVoiceType('male')}
                className="w-4 h-4"
              />
              <span>男性</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
