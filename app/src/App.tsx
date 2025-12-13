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
import AdminProductCard from './components/AdminProductCard';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useCartPersistence } from './hooks/useCartPersistence';
import { fetchUserInfo, UserInfo, createGoodCard, fetchGoods, fetchAllGoods, GoodDTO, addGoodImages, updateGoodCard, deleteGood, blockGood, activateGood } from './api/client';

export interface CartItemData {
  product: Product;
  quantity: number;
}

function App() {
  const { webApp } = useTelegramWebApp();
  const { saveCart, loadCart, clearCart } = useCartPersistence(webApp);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreAddressesOpen, setIsStoreAddressesOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('г. Тюмень ул. Пермякова, 62');
  const [previousScreen, setPreviousScreen] = useState<'home' | 'cart' | 'storeAddresses' | null>(null);
  const [previousScreenBeforeCart, setPreviousScreenBeforeCart] = useState<'home' | 'productCard' | null>(null);
  const [previousProduct, setPreviousProduct] = useState<Product | null>(null);
  const [returnToCart, setReturnToCart] = useState(false);
  const [isAdminCardOpen, setIsAdminCardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    if (returnToCart) {
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

  const handleOpenAdminCard = () => {
    setEditingProduct(null);
    setIsAdminCardOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAdminCardOpen(true);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (!webApp || !webApp.initData || !editingProduct) {
      alert('Ошибка: недоступен Telegram WebApp или товар не выбран');
      return;
    }

    const confirmDelete = window.confirm(`Удалить товар "${editingProduct.title}"?`);
    if (!confirmDelete) return;

    try {
      await deleteGood(editingProduct.id, webApp.initData);
      alert('Товар успешно удалён');
      setIsAdminCardOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Failed to delete good:', error);
      alert('Ошибка при удалении товара');
    }
  };

  const handleToggleBlockProduct = async () => {
    if (!webApp || !webApp.initData || !editingProduct) {
      alert('Ошибка: недоступен Telegram WebApp или товар не выбран');
      return;
    }

    try {
      if (editingProduct.status === 'BLOCKED') {
        // Активируем товар
        await activateGood(editingProduct.id, webApp.initData);
        alert('Товар успешно активирован');
      } else {
        // Блокируем товар
        await blockGood(editingProduct.id, webApp.initData);
        alert('Товар успешно заблокирован');
      }
      setIsAdminCardOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      alert('Ошибка при изменении статуса товара');
    }
  };

  // Функция для загрузки товаров с бэкенда
  const loadProducts = async () => {
    try {
      let goods: GoodDTO[];

      // Если пользователь ADMIN - загружаем все товары, иначе только NEW
      if (userInfo?.mode === 'ADMIN' && webApp?.initData) {
        goods = await fetchAllGoods(webApp.initData);
        console.log('Loading all goods for ADMIN');
      } else {
        goods = await fetchGoods();
        console.log('Loading NEW goods only');
      }

      // Маппинг GoodDTO → Product
      const mappedProducts: Product[] = goods.map((good: GoodDTO) => ({
        id: good.id,
        image: good.image_urls[0] || '/images/placeholder.png',
        images: good.image_urls,
        alt: good.name,
        title: good.name,
        price: `${good.price} руб.`,
        description: good.description,
        category: good.category,
        status: good.status,
      }));

      setProducts(mappedProducts);
      console.log('Products loaded:', mappedProducts.length);
    } catch (error) {
      console.error('Failed to fetch goods:', error);
    }
  };

  const handleSaveAdminCard = async (data: {
    id?: number;
    name: string;
    category: string;
    price: number;
    description: string;
    imageFiles: File[];
  }) => {
    if (!webApp || !webApp.initData) {
      alert('Ошибка: недоступен Telegram WebApp');
      return;
    }

    try {
      if (data.id) {
        // Обновляем существующий товар
        await updateGoodCard(
          data.id,
          {
            name: data.name,
            category: data.category,
            price: data.price,
            description: data.description,
          },
          webApp.initData
        );

        // Если есть новые изображения, загружаем их
        if (data.imageFiles.length > 0) {
          await addGoodImages(data.id, data.imageFiles, webApp.initData);
        }

        setIsAdminCardOpen(false);
        setEditingProduct(null);
        alert('Товар успешно обновлен!');
      } else {
        // Создаем новый товар
        const createdGood = await createGoodCard(
          {
            name: data.name,
            category: data.category,
            price: data.price,
            description: data.description,
          },
          webApp.initData
        );

        // Если есть изображения, загружаем их
        if (data.imageFiles.length > 0) {
          await addGoodImages(createdGood.id, data.imageFiles, webApp.initData);
        }

        setIsAdminCardOpen(false);
        alert('Товар успешно добавлен!');
      }

      // Обновляем список товаров
      await loadProducts();
    } catch (error) {
      console.error('Failed to save good card:', error);
      alert('Ошибка при сохранении товара. Проверьте права доступа.');
    }
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

  // Получение информации о пользователе при инициализации
  useEffect(() => {
    if (!webApp || !webApp.initData) return;

    fetchUserInfo(webApp.initData)
      .then((data) => {
        setUserInfo(data);
        console.log('User info loaded:', data);
      })
      .catch((error) => {
        console.error('Failed to fetch user info:', error);
      });
  }, [webApp]);

  // Загрузка товаров при инициализации и при изменении режима пользователя
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.mode]);

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

    const isNotOnHome = isCartOpen || selectedProduct !== null || isStoreAddressesOpen || isMenuOpen || isAdminCardOpen;

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
        } else if (isAdminCardOpen) {
          setIsAdminCardOpen(false);
        } else if (isStoreAddressesOpen) {
          setIsStoreAddressesOpen(false);
          if (returnToCart) {
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
  }, [webApp, isCartOpen, selectedProduct, isStoreAddressesOpen, isMenuOpen, isAdminCardOpen, returnToCart, cartItems, previousProduct, previousScreenBeforeCart]);

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
        onSelectAddress={handleSelectAddress}
        onMenuClick={() => {
          setPreviousScreen('storeAddresses');
          setIsStoreAddressesOpen(false);
          setIsMenuOpen(true);
        }}
        userMode={userInfo?.mode}
        initData={webApp?.initData}
        fromCart={returnToCart}
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
          userInfo={userInfo || undefined}
          onEdit={() => handleEditProduct(selectedProduct)}
        />
      )}
      {isAdminCardOpen && (
        <AdminProductCard
          onClose={() => {
            setIsAdminCardOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveAdminCard}
          editingProduct={editingProduct || undefined}
          onDelete={editingProduct ? handleDeleteProduct : undefined}
          onBlock={editingProduct ? handleToggleBlockProduct : undefined}
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
        <SearchBar userId={userInfo?.id} />
        <PromoBanner />
        <PaginationDots />
        <CategoryTabs />
        <ProductGrid
          products={products}
          onProductClick={setSelectedProduct}
          isAdminMode={userInfo?.mode === 'ADMIN'}
          onAddNewCard={handleOpenAdminCard}
        />
        <div className="mt-4">
          <BottomButton />
        </div>
      </div>
    </div>
  );
}

export default App;
