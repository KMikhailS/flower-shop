import { useState, useEffect } from 'react';
import AppHeader from './components/AppHeader';
import SearchBar from './components/SearchBar';
import PromoBanner from './components/PromoBanner';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid, { Product } from './components/ProductGrid';
import PaginationDots from './components/PaginationDots';
import BottomButton from './components/BottomButton';
import MobileMenu from './components/MobileMenu';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import StoreAddresses from './components/StoreAddresses';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useCartPersistence } from './hooks/useCartPersistence';

export interface CartItemData {
  product: Product;
  quantity: number;
}

function App() {
  const { webApp } = useTelegramWebApp();
  const { saveCart, loadCart, clearCart } = useCartPersistence(webApp);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreAddressesOpen, setIsStoreAddressesOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('г. Тюмень ул. Пермякова, 62');
  const [returnToCart, setReturnToCart] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<'home' | 'cart' | 'storeAddresses' | null>(null);
  const [previousScreenBeforeCart, setPreviousScreenBeforeCart] = useState<'home' | 'productCard' | null>(null);
  const [previousProduct, setPreviousProduct] = useState<Product | null>(null);

  // Состояние корзины - теперь массив товаров
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [cartDeliveryMethod, setCartDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [cartPaymentMethod, setCartPaymentMethod] = useState<'cash' | 'card' | 'sbp' | null>(null);

  // Функции управления корзиной
  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);

      if (existingItem) {
        // Если товар уже есть - увеличиваем quantity
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Если товара нет - добавляем новый
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  };

  const handleOpenCart = () => {
    // Определяем текущий экран перед открытием корзины
    if (selectedProduct) {
      setPreviousScreenBeforeCart('productCard');
      setPreviousProduct(selectedProduct); // Сохраняем продукт
    } else {
      setPreviousScreenBeforeCart('home');
      setPreviousProduct(null);
    }

    // Просто открываем корзину, не добавляем товар
    setIsCartOpen(true);
    setSelectedProduct(null);
  };

  const handleIncreaseQuantity = (productId: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (productId: number) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.product.id === productId);

      if (item && item.quantity === 1) {
        // Если quantity = 1, удаляем товар
        return prevItems.filter(i => i.product.id !== productId);
      }

      // Иначе уменьшаем quantity
      return prevItems.map(i =>
        i.product.id === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const handleOpenStoreAddresses = (fromCart: boolean = false) => {
    setReturnToCart(fromCart);
    if (fromCart) {
      setIsCartOpen(false);
    } else {
      setIsMenuOpen(false);
    }
    setIsStoreAddressesOpen(true);
  };

  const handleSelectAddress = (address: string) => {
    setSelectedAddress(address);
    setIsStoreAddressesOpen(false);
    if (returnToCart && cartItems.length > 0) {
      setIsCartOpen(true);
      setReturnToCart(false);
    }
  };

  const handleNavigateHome = () => {
    setIsMenuOpen(false);
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsStoreAddressesOpen(false);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    if (previousScreen === 'cart') {
      setIsCartOpen(true);
    } else if (previousScreen === 'storeAddresses') {
      setIsStoreAddressesOpen(true);
    }
    setPreviousScreen(null);
  };

  // Восстановление корзины при инициализации
  useEffect(() => {
    if (!webApp) return;

    loadCart().then((savedCart) => {
      if (savedCart && savedCart.cartItems) {
        setCartItems(savedCart.cartItems);
        setSelectedAddress(savedCart.selectedAddress);
        setCartDeliveryMethod(savedCart.deliveryMethod);
        setCartPaymentMethod(savedCart.paymentMethod);
      }
    });
  }, [webApp, loadCart]);

  // Автосохранение корзины при изменении состояния
  useEffect(() => {
    if (cartItems.length === 0) {
      clearCart(); // Очищаем storage при пустой корзине
      return;
    }

    saveCart({
      cartItems,
      deliveryMethod: cartDeliveryMethod,
      paymentMethod: cartPaymentMethod,
      selectedAddress: selectedAddress,
      timestamp: new Date().toISOString(),
    });
  }, [cartItems, cartDeliveryMethod, cartPaymentMethod, selectedAddress, saveCart, clearCart]);

  // Управление BackButton Telegram
  useEffect(() => {
    if (!webApp) return;

    const isNotOnHome = isCartOpen || selectedProduct !== null || isStoreAddressesOpen || isMenuOpen;

    if (isNotOnHome) {
      webApp.BackButton.show();

      const handleBackClick = () => {
        if (isCartOpen) {
          setIsCartOpen(false);
          // Восстанавливаем предыдущий экран
          if (previousScreenBeforeCart === 'productCard' && previousProduct) {
            setSelectedProduct(previousProduct); // Восстанавливаем продукт
            setPreviousProduct(null); // Очищаем сохраненный продукт
          }
          setPreviousScreenBeforeCart(null);
        } else if (selectedProduct) {
          setSelectedProduct(null);
        } else if (isStoreAddressesOpen) {
          setIsStoreAddressesOpen(false);
          if (returnToCart && cartItems.length > 0) {
            setIsCartOpen(true);
            setReturnToCart(false);
          }
        } else if (isMenuOpen) {
          handleCloseMenu();
        }
      };

      webApp.BackButton.onClick(handleBackClick);

      return () => {
        webApp.BackButton.offClick(handleBackClick);
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [webApp, isCartOpen, selectedProduct, isStoreAddressesOpen, isMenuOpen, returnToCart, cartItems, previousProduct, previousScreenBeforeCart]);

  return (
    <div className="min-h-screen bg-white max-w-[402px] mx-auto">
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        onOpenStoreAddresses={() => handleOpenStoreAddresses(false)}
        onNavigateHome={handleNavigateHome}
      />
      <StoreAddresses
        isOpen={isStoreAddressesOpen}
        onClose={() => setIsStoreAddressesOpen(false)}
        onSelectAddress={handleSelectAddress}
        onMenuClick={() => {
          setPreviousScreen('storeAddresses');
          setIsStoreAddressesOpen(false);
          setIsMenuOpen(true);
        }}
      />
      {isCartOpen && (
        <Cart
          cartItems={cartItems}
          onClose={() => setIsCartOpen(false)}
          onOpenMenu={() => {
            setPreviousScreen('cart');
            setIsCartOpen(false);
            setIsMenuOpen(true);
          }}
          selectedAddress={selectedAddress}
          onOpenStoreAddresses={() => handleOpenStoreAddresses(true)}
          deliveryMethod={cartDeliveryMethod}
          setDeliveryMethod={setCartDeliveryMethod}
          paymentMethod={cartPaymentMethod}
          setPaymentMethod={setCartPaymentMethod}
          onIncreaseQuantity={handleIncreaseQuantity}
          onDecreaseQuantity={handleDecreaseQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={() => {
            setCartItems([]);
            clearCart();
          }}
        />
      )}
      {selectedProduct && !isCartOpen && (
        <ProductCard
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenCart={handleOpenCart}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
        />
      )}
      <div className="flex flex-col gap-4">
        <AppHeader
          title="FanFanTulpan"
          actionType="menu-text"
          onAction={() => {
            setPreviousScreen('home');
            setIsMenuOpen(true);
          }}
        />
        <SearchBar />
        <PromoBanner />
        <PaginationDots />
        <CategoryTabs />
        <ProductGrid onProductClick={setSelectedProduct} />
        <div className="mt-4">
          <BottomButton />
        </div>
      </div>
    </div>
  );
}

export default App;
