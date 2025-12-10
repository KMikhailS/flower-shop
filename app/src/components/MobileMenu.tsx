import React from 'react';
import AppHeader from './AppHeader';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStoreAddresses: () => void;
  onNavigateHome: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onOpenStoreAddresses, onNavigateHome }) => {
  if (!isOpen) return null;

  const menuItems = [
    { id: 1, label: 'Сайт' },
    { id: 2, label: 'Оплата' },
    { id: 3, label: 'Доставка' },
    { id: 4, label: 'Обратная связь' },
    { id: 5, label: 'Адреса магазинов' },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <AppHeader
          title="FanFanTulpan"
          actionType="close-text"
          onAction={onClose}
        />

        {/* Menu Items */}
        <nav className="flex flex-col gap-[22px] px-8 mt-10">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href="#"
              className="text-2xl font-normal text-black hover:opacity-70 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                if (item.label === 'Адреса магазинов') {
                  onOpenStoreAddresses();
                } else if (item.label === 'Сайт') {
                  onNavigateHome();
                } else {
                  console.log(`Navigate to: ${item.label}`);
                }
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
