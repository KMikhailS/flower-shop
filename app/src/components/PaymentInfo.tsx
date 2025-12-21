import React from 'react';
import AppHeader from './AppHeader';

interface PaymentInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <AppHeader
        title="Оплата"
        actionType="close-text"
        onAction={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-gray-800">
            Когда заказ поступит, менеджер свяжется с вами для подтверждения.
          </p>

          <p className="text-base leading-relaxed text-gray-800">
            После подтверждения вы получите ссылку на оплату (карты, электронные деньги, Visa, Яндекс.Деньги).
          </p>

          <p className="text-base leading-relaxed text-gray-800">
            Ссылка действительна 10 минут. Оплатив, вы получите электронный чек.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfo;
