import React from 'react';
import { PromoBannerDTO } from '../api/client';

interface AdminPromoBannerCardProps {
  banner: PromoBannerDTO;
  onClose: () => void;
  onDelete: () => void;
  onBlock: () => void;
}

const AdminPromoBannerCard: React.FC<AdminPromoBannerCardProps> = ({
  banner,
  onClose,
  onDelete,
  onBlock
}) => {
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
            {/*<div className="absolute top-4 left-5">*/}
            {/*  <div className="bg-green rounded-[30px] px-4 py-2 inline-block">*/}
            {/*    <span className="text-white font-raleway text-xs font-medium">Акция</span>*/}
            {/*  </div>*/}
            {/*</div>*/}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="px-8 pt-6 pb-8 flex-1">
          {/* Save and Cancel Buttons */}
          <div className="flex gap-[10px] mb-4">
            <button
              onClick={onClose}
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
