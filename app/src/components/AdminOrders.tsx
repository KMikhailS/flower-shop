import React, { useState, useEffect } from 'react';
import AppHeader from './AppHeader';
import { fetchAllOrders, OrderDTO, fetchAllGoods, GoodDTO, updateOrderStatus } from '../api/client';

interface AdminOrdersProps {
  isOpen: boolean;
  onMenuClick: () => void;
  initData?: string;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({
  isOpen,
  onMenuClick,
  initData
}) => {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [goods, setGoods] = useState<GoodDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusPopupOrderId, setStatusPopupOrderId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!initData) {
      console.error('AdminOrders: initData is not available');
      setError('Ошибка авторизации. Перезапустите приложение.');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      console.log('AdminOrders: Loading all orders with initData length:', initData.length);

      try {
        // Load orders and goods in parallel
        const [ordersData, goodsData] = await Promise.all([
          fetchAllOrders(initData),
          fetchAllGoods(initData)
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
    switch (status) {
      case 'NEW':
        return 'text-gray-600 bg-gray-100 px-3 py-1 rounded-full';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 px-3 py-1 rounded-full';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 px-3 py-1 rounded-full';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50 px-3 py-1 rounded-full';
      default:
        return 'text-gray-600 bg-gray-100 px-3 py-1 rounded-full';
    }
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

  const handleChangeStatus = (orderId: number, currentStatus: string) => {
    setStatusPopupOrderId(orderId);
    setSelectedStatus(currentStatus);
  };

  const handleCancelOrder = async (orderId: number, currentStatus: string) => {
    if (!initData) {
      alert('Ошибка: нет данных авторизации');
      return;
    }

    if (currentStatus === 'CANCELLED') {
      alert('Заказ уже отменён');
      return;
    }

    try {
      await updateOrderStatus(orderId, 'CANCELLED', initData);
      // Reload orders
      const ordersData = await fetchAllOrders(initData);
      setOrders(ordersData);
      alert('Заказ отменён');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Не удалось отменить заказ');
    }
  };

  const handleSaveStatus = async () => {
    if (!statusPopupOrderId || !initData) return;

    const order = orders.find(o => o.id === statusPopupOrderId);
    if (!order) return;

    // Check if status changed
    if (selectedStatus === order.status) {
      setStatusPopupOrderId(null);
      return;
    }

    try {
      await updateOrderStatus(statusPopupOrderId, selectedStatus, initData);
      // Reload orders
      const ordersData = await fetchAllOrders(initData);
      setOrders(ordersData);
      setStatusPopupOrderId(null);
      alert('Статус заказа изменён');
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Не удалось изменить статус');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto">
      <div className="h-full overflow-y-auto">
        <AppHeader
          title="Заказы"
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
              Нет заказов
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
                      <div className="text-sm text-gray-600 mt-1">
                        ID пользователя: {order.user_id}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${getStatusColor(order.status)}`}>
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

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleChangeStatus(order.id, order.status)}
                        className="flex-1 py-2 px-4 bg-teal text-white rounded-[20px] font-medium hover:opacity-90 transition-opacity"
                      >
                        Изменить статус
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id, order.status)}
                        className="flex-1 py-2 px-4 bg-red-500 text-white rounded-[20px] font-medium hover:opacity-90 transition-opacity"
                      >
                        Отменить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Change Popup */}
      {statusPopupOrderId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] max-w-[402px] mx-auto">
          <div className="bg-white rounded-[20px] p-6 m-4 max-w-[340px] w-full">
            <h3 className="text-lg font-semibold mb-4">Изменить статус заказа</h3>
            
            <div className="space-y-2 mb-6">
              {['NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-[12px] cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-4 h-4 text-teal"
                  />
                  <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStatusPopupOrderId(null)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-[20px] font-medium hover:opacity-90 transition-opacity"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveStatus}
                className="flex-1 py-2 px-4 bg-teal text-white rounded-[20px] font-medium hover:opacity-90 transition-opacity"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

