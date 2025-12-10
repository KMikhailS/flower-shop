import React from 'react';

interface AppHeaderProps {
  title?: string;
  actionType: 'menu-text' | 'close-text' | 'menu-icon';
  onAction: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, actionType, onAction }) => {
  return (
    <div className="flex items-center justify-between px-8 py-5">
      <div className="contents">
        {/* Логотип в круге - одинаково на всех экранах */}
        <div className="w-15 h-15 bg-white rounded-full shadow-sm flex items-center justify-center">
          <img src="/images/logo.svg" alt="Logo" className="w-9 h-8" />
        </div>
        {title && (
          <div className="text-2xl font-normal font-raleway">{title}</div>
        )}
        {actionType === 'menu-text' && (
          <button
            onClick={onAction}
            className="text-base font-normal text-black hover:opacity-70 transition-opacity"
          >
            Меню
          </button>
        )}
        {actionType === 'close-text' && (
          <button
            onClick={onAction}
            className="text-base font-normal text-black hover:opacity-70 transition-opacity"
          >
            Закрыть
          </button>
        )}
        {actionType === 'menu-icon' && (
          <button
            onClick={onAction}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <img
              src="/images/menu.svg"
              alt="Menu"
              className="w-6 h-6"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default AppHeader;
