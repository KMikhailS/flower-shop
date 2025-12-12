import React, { useEffect } from 'react';
import AppHeader from './AppHeader';
import CartItem from './CartItem';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { CartItemData } from '../App';

interface CartProps {
  cartItems: CartItemData[];
  onClose: () => void;
  onOpenMenu: () => void;
  selectedAddress: string;
  onOpenStoreAddresses: () => void;
  deliveryMethod: 'pickup' | 'delivery';
  setDeliveryMethod: (method: 'pickup' | 'delivery') => void;
  paymentMethod: 'cash' | 'card' | 'sbp' | null;
  setPaymentMethod: (method: 'cash' | 'card' | 'sbp' | null) => void;
  onIncreaseQuantity: (productId: number) => void;
  onDecreaseQuantity: (productId: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  onClose: _onClose,
  onOpenMenu,
  selectedAddress,
  onOpenStoreAddresses,
  deliveryMethod,
  setDeliveryMethod,
  paymentMethod,
  setPaymentMethod,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const { webApp, user } = useTelegramWebApp();

  // Отключаем прокрутку body при открытии модального окна
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Рассчитываем общую сумму всех товаров
  const totalPrice = cartItems.reduce((sum, item) => {
    const basePrice = parseFloat(item.product.price.replace(/[^\d]/g, ''));
    return sum + (basePrice * item.quantity);
  }, 0);

  const handleDecrease = (productId: number) => {
    onDecreaseQuantity(productId);
    webApp?.HapticFeedback.impactOccurred('light');
  };

  const handleIncrease = (productId: number) => {
    onIncreaseQuantity(productId);
    webApp?.HapticFeedback.impactOccurred('light');
  };

  const handleRemove = (productId: number) => {
    onRemoveItem(productId);
    webApp?.HapticFeedback.notificationOccurred('warning');
  };

  const handleBuy = () => {
    if (!paymentMethod || cartItems.length === 0) return;

    webApp?.HapticFeedback.notificationOccurred('success');

    const orderData = {
      user: user ? {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
      } : null,
      items: cartItems.map(item => ({
        id: item.product.id,
        title: item.product.title,
        price: parseFloat(item.product.price.replace(/[^\d]/g, '')),
        quantity: item.quantity,
      })),
      totalPrice,
      deliveryMethod: deliveryMethod === 'pickup' ? 'Самовывоз' : 'Курьером',
      address: selectedAddress,
      paymentMethod: paymentMethod === 'cash' ? 'Наличными' : paymentMethod === 'card' ? 'Картой' : 'СБП',
      timestamp: new Date().toISOString(),
    };

    // Отправляем данные боту
    if (webApp) {
      webApp.sendData(JSON.stringify(orderData));
    }

    // Очищаем корзину после успешной покупки
    onClearCart();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full">
        <AppHeader
          title="FanFanTulpan"
          actionType="menu-text"
          onAction={onOpenMenu}
        />
        <div className="p-8 pt-6">
        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg font-medium text-[#A09CAB]">Ваша корзина пока пуста</p>
          </div>
        ) : (
          cartItems.map((item) => {
            const itemTotalPrice = parseFloat(item.product.price.replace(/[^\d]/g, '')) * item.quantity;
            return (
              <CartItem
                key={item.product.id}
                product={item.product}
                quantity={item.quantity}
                totalPrice={itemTotalPrice}
                onDecrease={() => handleDecrease(item.product.id)}
                onIncrease={() => handleIncrease(item.product.id)}
                onRemove={() => handleRemove(item.product.id)}
              />
            );
          })
        )}

        {/* Delivery Method */}
        <div className="mb-6">
          <h3 className="text-base font-bold leading-[1.174] text-black mb-4">
            Способ получение
          </h3>
          <div className="relative h-10 bg-[#D9D9D9] rounded-[10px] overflow-hidden">
            <div
              className={`absolute top-0 h-full w-1/2 bg-[#80D1C1] rounded-[10px] transition-transform duration-300 ${
                deliveryMethod === 'delivery' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <div className="relative h-full flex">
              <button
                onClick={() => {
                  setDeliveryMethod('pickup');
                  webApp?.HapticFeedback.selectionChanged();
                }}
                className="flex-1 text-base font-medium leading-[1.174] text-black"
              >
                Самовывоз
              </button>
              <button
                onClick={() => {
                  setDeliveryMethod('delivery');
                  webApp?.HapticFeedback.selectionChanged();
                }}
                className="flex-1 text-base font-medium leading-[1.174] text-black"
              >
                Курьером
              </button>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/images/location-icon.svg" alt="Location" className="w-10 h-10" />
          <p className="text-base font-semibold leading-[1.174] text-black flex-1">
            {selectedAddress}
          </p>
          <button
            onClick={onOpenStoreAddresses}
            className="text-base font-semibold leading-[1.174] text-black hover:opacity-70 transition-opacity"
          >
            Выбрать
          </button>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <h3 className="text-base font-bold leading-[1.174] text-black mb-4">
            Способ оплаты
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                setPaymentMethod('cash');
                webApp?.HapticFeedback.selectionChanged();
              }}
              className={`w-full h-[53px] rounded-[15px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center ${
                paymentMethod === 'cash' ? 'bg-[#80D1C1]' : 'bg-white'
              }`}
            >
              <span className="text-base font-semibold leading-[1.174] text-black">
                Наличными
              </span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('card');
                webApp?.HapticFeedback.selectionChanged();
              }}
              className={`w-full h-[53px] rounded-[15px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center ${
                paymentMethod === 'card' ? 'bg-[#80D1C1]' : 'bg-white'
              }`}
            >
              <span className="text-base font-semibold leading-[1.174] text-black">
                Оплатить картой
              </span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('sbp');
                webApp?.HapticFeedback.selectionChanged();
              }}
              className={`w-full h-[53px] rounded-[15px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center ${
                paymentMethod === 'sbp' ? 'bg-[#80D1C1]' : 'bg-white'
              }`}
            >
              <span className="text-base font-semibold leading-[1.174] text-black">
                СБП
              </span>
            </button>
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={!paymentMethod}
          className={`w-full h-[66px] rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center ${
            paymentMethod ? 'bg-[#80D1C1]' : 'bg-gray-300'
          }`}
        >
          <span className="text-xl font-medium leading-[1.174] text-black">
            Купить
          </span>
        </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
