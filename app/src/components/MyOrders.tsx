import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import { fetchMyOrders, OrderDTO, fetchGoods, GoodDTO } from '../api/client';

interface MyOrdersProps {
  isOpen: boolean;
  onMenuClick: () => void;
  initData?: string;
}

const MyOrders: React.FC<MyOrdersProps> = ({
  isOpen,
  onMenuClick,
  initData
}) => {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [goods, setGoods] = useState<GoodDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (!initData) {
      console.error('MyOrders: initData is not available');
      setError('Ошибка авторизации. Перезапустите приложение.');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      console.log('MyOrders: Loading orders with initData length:', initData.length);

      try {
        // Load orders and goods in parallel
        const [ordersData, goodsData] = await Promise.all([
          fetchMyOrders(initData),
          fetchGoods()
        ]);

        setOrders(ordersData);
        setGoods(goodsData);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Не удалось загрузить заказы');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, initData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'NEW') return 'text-green-600';
    return 'text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'NEW': 'Новый',
      'PROCESSING': 'В обработке',
      'COMPLETED': 'Выполнен',
      'CANCELLED': 'Отменён'
    };
    return statusMap[status] || status;
  };

  const getGoodImage = (goodId: number): string => {
    const good = goods.find(g => g.id === goodId);
    if (good && good.images && good.images.length > 0) {
      return good.images[0].image_url;
    }
    return '/images/placeholder.png';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="flex flex-col">
        <AppHeader
          title="Мои заказы"
          actionType="menu-text"
          onAction={onMenuClick}
        />

        <div className="px-6 py-6">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              Загрузка заказов...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {!isLoading && !error && orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              У вас пока нет заказов
            </div>
          )}

          {!isLoading && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-[20px] shadow-custom p-4"
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-semibold">
                        Заказ #{order.id}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(order.createstamp)}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="text-sm text-gray-600 mb-3">
                    <div>
                      {order.delivery_type === 'PICK_UP' ? 'Самовывоз' : 'Доставка'}
                    </div>
                    <div className="text-gray-500">
                      {order.delivery_address}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="text-sm font-medium mb-2">Товары:</div>
                    <div className="space-y-2">
                      {order.cart_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          {/* Product Image */}
                          <img
                            src={getGoodImage(item.good_id)}
                            alt={item.good_name}
                            className="w-[60px] h-[60px] rounded-lg object-cover"
                          />

                          {/* Product Info */}
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {item.good_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.count} шт. × {item.price} руб.
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="text-sm font-semibold">
                            {item.count * item.price} руб.
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <div className="font-semibold">Итого:</div>
                      <div className="text-lg font-bold text-teal">
                        {order.cart_items.reduce((sum, item) => sum + (item.count * item.price), 0)} руб.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
