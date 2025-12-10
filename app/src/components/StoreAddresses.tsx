import React from 'react';
import AppHeader from './AppHeader';

interface StoreAddressesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
  onMenuClick: () => void;
}

const StoreAddresses: React.FC<StoreAddressesProps> = ({ isOpen, onClose, onSelectAddress, onMenuClick }) => {
  if (!isOpen) return null;

  const addresses = [
    'г. Тюмень, ул. Ленина, 25',
    'г. Тюмень, ул. Республики, 142',
    'г. Тюмень, ул. 50 лет Октября, 57',
    'г. Тюмень, ул. Мельникайте, 106',
    'г. Тюмень, ул. Герцена, 84',
    'г. Тюмень, ул. Профсоюзная, 20',
    'г. Тюмень, ул. Широтная, 131',
  ];

  const handleAddressClick = (address: string) => {
    onSelectAddress(address);
    onClose();
  };

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
          <h1 className="text-2xl font-normal text-black">Адреса магазинов</h1>
        </div>

        {/* Address List */}
        <div className="flex flex-col gap-[54px] px-[30px] mt-[25px]">
          {addresses.map((address, index) => (
            <button
              key={index}
              onClick={() => handleAddressClick(address)}
              className="text-base font-semibold leading-[1.174] text-black text-left hover:opacity-70 transition-opacity"
            >
              {address}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreAddresses;
