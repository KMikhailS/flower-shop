import React, { useState } from 'react';
import { PromoBannerDTO } from '../api/client';

interface AdminPromoBannerCardProps {
  banner: PromoBannerDTO;
  onClose: () => void;
  onDelete: () => void;
  onBlock: () => void;
  onSave: (link: number | null) => void;
}

const AdminPromoBannerCard: React.FC<AdminPromoBannerCardProps> = ({
  banner,
  onClose,
  onDelete,
  onBlock,
  onSave
}) => {
  const [linkValue, setLinkValue] = useState<string>(
    banner.link != null ? String(banner.link) : ''
  );

  const handleSave = () => {
    const link = linkValue.trim() === '' ? null : parseInt(linkValue, 10);
    onSave(isNaN(link as number) ? null : link);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Banner Image Section - same style as main screen */}
        <div className="px-4 pt-6">
          <div className="relative h-[187px] overflow-hidden rounded-[20px]">
            <img
              src={banner.image_url}
              alt="Promo Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Link Input Section */}
        <div className="px-8 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на товар (ID товара)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={linkValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d+$/.test(val)) {
                setLinkValue(val);
              }
            }}
            placeholder="Введите ID товара"
            className="w-full h-[50px] px-4 bg-gray-light rounded-[15px] text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        {/* Action Buttons Section */}
        <div className="px-8 pt-6 pb-8 flex-1">
          {/* Save and Cancel Buttons */}
          <div className="flex gap-[10px] mb-4">
            <button
              onClick={handleSave}
              className="flex-1 h-[66px] bg-teal rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-black">Сохранить</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-[66px] bg-gray-light rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-black">Отмена</span>
            </button>
          </div>

          {/* Delete and Block/Activate Buttons */}
          <div className="flex gap-[10px]">
            <button
              onClick={onDelete}
              className="flex-1 h-[66px] bg-red-500 rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-white">Удалить</span>
            </button>
            <button
              onClick={onBlock}
              className="flex-1 h-[66px] bg-gray-medium rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-white">
                {banner.status === 'BLOCKED' ? 'Активировать' : 'Заблокировать'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPromoBannerCard;
