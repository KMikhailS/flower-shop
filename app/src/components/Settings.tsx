import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import { fetchSettings, updateUserMode, upsertSetting, Setting } from '../api/client';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuClick: () => void;
  userMode?: string;
  initData?: string;
  onModeChange?: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onMenuClick,
  userMode,
  initData,
  onModeChange
}) => {
  const [currentMode, setCurrentMode] = useState<string>(userMode || 'USER');
  const [supportChatId, setSupportChatId] = useState<string>('');
  const [managerChatId, setManagerChatId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings when component opens
  useEffect(() => {
    if (isOpen && initData) {
      loadSettings();
    }
  }, [isOpen, initData]);

  // Update local mode when prop changes
  useEffect(() => {
    if (userMode) {
      setCurrentMode(userMode);
    }
  }, [userMode]);

  const loadSettings = async () => {
    if (!initData) return;

    setIsLoading(true);
    setError(null);

    try {
      const settings = await fetchSettings(initData);

      // Find specific settings by type
      const supportSetting = settings.find((s: Setting) => s.type === 'SUPPORT_CHAT_ID');
      const managerSetting = settings.find((s: Setting) => s.type === 'MANAGER_CHAT_ID');

      setSupportChatId(supportSetting?.value || '');
      setManagerChatId(managerSetting?.value || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeToggle = () => {
    const newMode = currentMode === 'ADMIN' ? 'USER' : 'ADMIN';
    setCurrentMode(newMode);
  };

  const handleSave = async () => {
    if (!initData) {
      setError('Ошибка авторизации');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update mode if changed
      if (currentMode !== userMode) {
        await updateUserMode(currentMode, initData);

        // Notify parent to reload user info
        if (onModeChange) {
          onModeChange();
        }
      }

      // Save support chat ID if provided
      if (supportChatId.trim()) {
        // Validate: digits with optional minus sign (for groups/supergroups)
        if (!/^-?\d+$/.test(supportChatId.trim())) {
          setError('ID чата поддержки должен быть числом (может быть отрицательным)');
          setIsSaving(false);
          return;
        }
        await upsertSetting('SUPPORT_CHAT_ID', supportChatId.trim(), initData);
      }

      // Save manager chat ID if provided
      if (managerChatId.trim()) {
        // Validate: digits with optional minus sign (for groups/supergroups)
        if (!/^-?\d+$/.test(managerChatId.trim())) {
          setError('ID чата менеджера должен быть числом (может быть отрицательным)');
          setIsSaving(false);
          return;
        }
        await upsertSetting('MANAGER_CHAT_ID', managerChatId.trim(), initData);
      }

      // Success - close settings
      alert('Настройки успешно сохранены!');
      onClose();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <AppHeader
          title="FanFanTulpan"
          actionType="menu-text"
          onAction={onMenuClick}
        />

        {/* Page Title */}
        <div className="px-6 mt-[30px]">
          <h1 className="text-2xl font-normal text-black">Настройки</h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center mt-[50px]">
            <p className="text-gray-medium">Загрузка настроек...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex justify-center items-center px-6 mt-4">
            <p className="text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* Settings Form */}
        {!isLoading && (
          <div className="flex flex-col gap-6 px-6 mt-[25px]">
            {/* Mode Toggle */}
            <div className="flex flex-col gap-3">
              <label className="text-base font-semibold text-black">
                Режим
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${currentMode === 'USER' ? 'font-semibold' : 'font-normal text-gray-medium'}`}>
                  Пользователь
                </span>
                <button
                  onClick={handleModeToggle}
                  disabled={isSaving}
                  className={`relative w-[60px] h-[32px] rounded-full transition-colors ${
                    currentMode === 'ADMIN' ? 'bg-teal' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <div
                    className={`absolute top-[4px] w-[24px] h-[24px] bg-white rounded-full shadow-md transition-transform ${
                      currentMode === 'ADMIN' ? 'translate-x-[32px]' : 'translate-x-[4px]'
                    }`}
                  />
                </button>
                <span className={`text-sm ${currentMode === 'ADMIN' ? 'font-semibold' : 'font-normal text-gray-medium'}`}>
                  Администратор
                </span>
              </div>
            </div>

            {/* Support Chat ID */}
            <div className="flex flex-col gap-3">
              <label className="text-base font-semibold text-black">
                ID чата службы поддержки
              </label>
              <input
                type="text"
                value={supportChatId}
                onChange={(e) => setSupportChatId(e.target.value)}
                placeholder="Например: 123456789 или -1003195004506"
                disabled={isSaving}
                className="w-full px-4 py-3 border border-gray-300 rounded-[20px] focus:outline-none focus:border-teal disabled:opacity-50"
              />
            </div>

            {/* Manager Chat ID */}
            <div className="flex flex-col gap-3">
              <label className="text-base font-semibold text-black">
                ID чата менеджера
              </label>
              <input
                type="text"
                value={managerChatId}
                onChange={(e) => setManagerChatId(e.target.value)}
                placeholder="Например: 123456789 или -1003195004506"
                disabled={isSaving}
                className="w-full px-4 py-3 border border-gray-300 rounded-[20px] focus:outline-none focus:border-teal disabled:opacity-50"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-teal text-white py-3 rounded-[30px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
