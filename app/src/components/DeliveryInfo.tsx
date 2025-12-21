import React from 'react';
import AppHeader from './AppHeader';

interface DeliveryInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <AppHeader
        title="Доставка"
        actionType="close-text"
        onAction={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-gray-800">
            Если нужный букет собрать не получится, мы сразу свяжемся и подберём достойную замену.
          </p>

          <p className="text-base leading-relaxed text-gray-800">
            Доставляем бережно с 8:00 до 23:00. Обычно от 3 часов после заказа. Букеты с витрины можем привезти быстрее, иногда всего за 30 минут. Правда, точное время зависит от пробок и загруженности курьеров. В праздники сроки могут немного меняться.
          </p>

          <p className="text-base leading-relaxed text-gray-800">
            Доставка по городу от 350 ₽. В отдалённые районы уточняем цену вместе с вами, всё прозрачно и без сюрпризов.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;
