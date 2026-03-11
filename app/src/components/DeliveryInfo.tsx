import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppHeader from './AppHeader';
import { fetchDeliveryInfoText, upsertSetting } from '../api/client';

interface DeliveryInfoProps {
  isOpen: boolean;
  onClose: () => void;
  initData?: string;
  userMode?: string;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({
  isOpen,
  onClose,
  initData,
  userMode
}) => {
  const [deliveryText, setDeliveryText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: deliveryInfoText = '',
    isLoading,
    error,
  } = useQuery<string>({
    queryKey: ['delivery-info-text', initData],
    queryFn: () => fetchDeliveryInfoText(initData as string),
    enabled: isOpen && Boolean(initData),
    refetchOnWindowFocus: false,
  });

  const errorMessage = actionError || (error ? 'Не удалось загрузить информацию о доставке' : null);

  const paragraphs = useMemo(() => {
    return deliveryText
      .split(/\r?\n/)
      .map(p => p.trim())
      .filter(Boolean);
  }, [deliveryText]);

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(false);
    setIsSaving(false);
    setActionError(null);
    if (!initData) {
      setActionError('Ошибка авторизации. Перезапустите приложение.');
    }
  }, [isOpen, initData]);

  useEffect(() => {
    if (!isOpen) return;
    setDeliveryText(deliveryInfoText || '');
    if (!isEditing) {
      setDraftText(deliveryInfoText || '');
    }
  }, [deliveryInfoText, isOpen, isEditing]);

  const isAdmin = userMode === 'ADMIN';

  const handleStartEdit = () => {
    setDraftText(deliveryText || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftText(deliveryText || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!initData) return;

    setIsSaving(true);
    setActionError(null);
    try {
      await upsertSetting('DELIVERY_INFO_TEXT', draftText, initData);
      setDeliveryText(draftText);
      queryClient.setQueryData(['delivery-info-text', initData], draftText);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save delivery info text:', err);
      setActionError('Не удалось сохранить информацию о доставке');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <AppHeader
        title="Доставка"
        actionType="close-text"
        onAction={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {isAdmin && (
          <div className="flex justify-end mb-4">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="px-4 py-2 rounded-[20px] bg-gray-light text-sm font-semibold text-black hover:opacity-80 transition-opacity"
              >
                Редактировать
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-[20px] bg-teal text-sm font-semibold text-black hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-[20px] bg-gray-light text-sm font-semibold text-black hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="text-base text-black opacity-70">Загрузка...</div>
        ) : isEditing ? (
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Введите текст о доставке"
            rows={16}
            className="w-full px-4 py-3 rounded-[20px] bg-gray-light border-none text-base text-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-teal resize-none"
          />
        ) : (
          <div className="space-y-4">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => (
                <p key={idx} className="text-base leading-relaxed text-black">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-base leading-relaxed text-black opacity-70">
                Информация о доставке пока не настроена.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryInfo;
