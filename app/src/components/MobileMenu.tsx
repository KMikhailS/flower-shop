import React from 'react';
import AppHeader from './AppHeader';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStoreAddresses: () => void;
  onOpenDeliveryInfo: () => void;
  onOpenPaymentInfo: () => void;
  onOpenSettings?: () => void;
  onOpenMyOrders: () => void;
  onNavigateHome: () => void;
  userRole?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onOpenStoreAddresses,
  onOpenDeliveryInfo,
  onOpenPaymentInfo,
  onOpenSettings,
  onOpenMyOrders,
  onNavigateHome,
  userRole
}) => {
  if (!isOpen) return null;

  const baseMenuItems = [
    { id: 1, label: 'Главная' },
    { id: 2, label: 'Мои заказы' },
    { id: 3, label: 'Доставка' },
    { id: 4, label: 'Обратная связь' },
    { id: 5, label: 'Оплата' },
    { id: 6, label: 'Адреса магазинов' },
  ];

  // Add Settings for ADMIN users only
  const menuItems = userRole === 'ADMIN'
    ? [...baseMenuItems, { id: 7, label: 'Настройки' }]
    : baseMenuItems;

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
                } else if (item.label === 'Доставка') {
                  onOpenDeliveryInfo();
                } else if (item.label === 'Оплата') {
                  onOpenPaymentInfo();
                } else if (item.label === 'Мои заказы') {
                  onOpenMyOrders();
                } else if (item.label === 'Настройки') {
                  if (onOpenSettings) {
                    onOpenSettings();
                  }
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
