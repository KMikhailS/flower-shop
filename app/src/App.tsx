import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import AppHeader from './components/AppHeader';
import SearchBar from './components/SearchBar';
import PromoBanner from './components/PromoBanner';
import CategoryTabs from './components/CategoryTabs';
import ProductGrid from './components/ProductGrid';
import type { Product } from './types/product';
import MobileMenu from './components/MobileMenu';
import StoreAddresses from './components/StoreAddresses';
import CartBottomButton from './components/CartBottomButton';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useProducts } from './hooks/useProducts';
import { usePromoBanners } from './hooks/usePromoBanners';
import { useNavigation } from './hooks/useNavigation';
import { CartProvider } from './hooks/useCart';
import { fetchUserInfo, UserInfo, createGoodCard, addGoodImages, updateGoodCard, deleteGood, blockGood, activateGood, PromoBannerDTO, deletePromoBanner, blockPromoBanner, activatePromoBanner, updatePromoBannerLink, fetchSupportChatId } from './api/client';

const Cart = lazy(() => import('./components/Cart'));
const ProductCard = lazy(() => import('./components/ProductCard'));
const AdminOrders = lazy(() => import('./components/AdminOrders'));
const MyOrders = lazy(() => import('./components/MyOrders'));
const Settings = lazy(() => import('./components/Settings'));
const AdminProductCard = lazy(() => import('./components/AdminProductCard'));
const AdminPromoBannerCard = lazy(() => import('./components/AdminPromoBannerCard'));
const DeliveryInfo = lazy(() => import('./components/DeliveryInfo'));
const PaymentInfo = lazy(() => import('./components/PaymentInfo'));

function App() {
  const { webApp } = useTelegramWebApp();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const {
    products,
    uniqueCategories,
    filteredProducts,
    activeCategory,
    setSearchQuery,
    handleCategoryToggle,
    reloadProducts,
  } = useProducts({ userMode: userInfo?.mode, initData: webApp?.initData });

  const {
    promoBanners,
    reloadPromoBanners,
    addPromoBanner,
  } = usePromoBanners({ userMode: userInfo?.mode, initData: webApp?.initData, webApp });

  const {
    isMenuOpen,
    setIsMenuOpen,
    selectedProduct,
    setSelectedProduct,
    isCartOpen,
    setIsCartOpen,
    isStoreAddressesOpen,
    setIsStoreAddressesOpen,
    isDeliveryInfoOpen,
    setIsDeliveryInfoOpen,
    isPaymentInfoOpen,
    setIsPaymentInfoOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isMyOrdersOpen,
    setIsMyOrdersOpen,
    isAdminOrdersOpen,
    setIsAdminOrdersOpen,
    setPreviousScreen,
    previousScreenBeforeCart,
    setPreviousScreenBeforeCart,
    previousProduct,
    setPreviousProduct,
    returnToCart,
    setReturnToCart,
    isAdminCardOpen,
    setIsAdminCardOpen,
    editingProduct,
    setEditingProduct,
    isAdminBannerCardOpen,
    setIsAdminBannerCardOpen,
    editingBanner,
    setEditingBanner,
    isBottomButtonVisible,
    setIsBottomButtonVisible,
    openCart,
    openStoreAddresses,
    closeStoreAddressesAfterSelect,
    navigateHome,
    closeMenu,
  } = useNavigation();

  const productGridRef = useRef<HTMLDivElement>(null);

  const buildSupportChatLink = useCallback((chatId: string) => {
    const normalized = chatId.trim();
    if (!normalized) {
      return null;
    }

    if (/^https?:\/\//.test(normalized)) {
      return { url: normalized, preferTelegram: true };
    }

    if (normalized.startsWith('@')) {
      return { url: `https://t.me/${normalized.slice(1)}`, preferTelegram: true };
    }

    if (/^-?\d+$/.test(normalized)) {
      if (normalized.startsWith('-100') && normalized.length > 4) {
        return { url: `https://t.me/c/${normalized.slice(4)}/1`, preferTelegram: true };
      }
      return { url: `tg://user?id=${normalized}`, preferTelegram: false };
    }

    return null;
  }, []);

  const openSupportLink = useCallback((url: string, preferTelegram: boolean) => {
    if (preferTelegram && webApp?.openTelegramLink) {
      try {
        webApp.openTelegramLink(url);
        return true;
      } catch (error) {
        console.warn('openTelegramLink failed:', error);
      }
    }

    if (webApp?.openLink) {
      try {
        webApp.openLink(url);
        return true;
      } catch (error) {
        console.warn('openLink failed:', error);
      }
    }

    try {
      window.open(url, '_blank');
      return true;
    } catch (error) {
      console.warn('window.open failed:', error);
    }

    return false;
  }, [webApp]);

  const handleOpenFeedback = useCallback(async () => {
    if (!webApp?.initData) {
      alert('Ошибка: нет данных авторизации');
      return;
    }

    try {
      const supportChatId = await fetchSupportChatId(webApp.initData);
      if (!supportChatId) {
        webApp?.showAlert?.('Чат поддержки не настроен');
        return;
      }

      const chatLink = buildSupportChatLink(supportChatId);
      if (!chatLink) {
        webApp?.showAlert?.('Неверный формат ID чата поддержки');
        return;
      }

      const opened = openSupportLink(chatLink.url, chatLink.preferTelegram);
      if (!opened) {
        webApp?.showAlert?.('Не удалось открыть чат поддержки');
        return;
      }
      setIsMenuOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('404')) {
        webApp?.showAlert?.('Чат поддержки не настроен');
      } else if (webApp?.showAlert) {
        webApp.showAlert('Не удалось открыть чат поддержки');
      } else {
        alert('Не удалось открыть чат поддержки');
      }
    }
  }, [webApp, buildSupportChatLink, openSupportLink]);

  const handleCloseMenu = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  const handleOpenSettings = useCallback(() => {
    setIsMenuOpen(false);
    setIsSettingsOpen(true);
  }, [setIsMenuOpen, setIsSettingsOpen]);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, [setIsSettingsOpen]);

  const handleOpenDeliveryInfo = useCallback(() => {
    setIsMenuOpen(false);
    setIsDeliveryInfoOpen(true);
  }, [setIsMenuOpen, setIsDeliveryInfoOpen]);

  const handleCloseDeliveryInfo = useCallback(() => {
    setIsDeliveryInfoOpen(false);
  }, [setIsDeliveryInfoOpen]);

  const handleOpenPaymentInfo = useCallback(() => {
    setIsMenuOpen(false);
    setIsPaymentInfoOpen(true);
  }, [setIsMenuOpen, setIsPaymentInfoOpen]);

  const handleClosePaymentInfo = useCallback(() => {
    setIsPaymentInfoOpen(false);
  }, [setIsPaymentInfoOpen]);

  const handleOpenMyOrders = useCallback(() => {
    setIsMenuOpen(false);
    setIsMyOrdersOpen(true);
  }, [setIsMenuOpen, setIsMyOrdersOpen]);

  const handleOpenAdminOrders = useCallback(() => {
    setIsMenuOpen(false);
    setIsAdminOrdersOpen(true);
  }, [setIsMenuOpen, setIsAdminOrdersOpen]);

  const handleSettingsModeChange = useCallback(async () => {
    // Reload user info after mode change
    if (!webApp || !webApp.initData) return;

    try {
      const data = await fetchUserInfo(webApp.initData);
      setUserInfo(data);
      if (import.meta.env.DEV) {
        console.log('User info reloaded after mode change:', data);
      }
    } catch (error) {
      console.error('Failed to reload user info:', error);
    }
  }, [webApp]);

  const handleOpenAdminCard = useCallback(() => {
    setEditingProduct(null);
    setIsAdminCardOpen(true);
  }, [setEditingProduct, setIsAdminCardOpen]);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsAdminCardOpen(true);
    setSelectedProduct(null);
  }, [setEditingProduct, setIsAdminCardOpen, setSelectedProduct]);

  const handleEditSelectedProduct = useCallback(() => {
    if (!selectedProduct) return;
    handleEditProduct(selectedProduct);
  }, [selectedProduct, handleEditProduct]);

  const handleProductClick = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, [setSelectedProduct]);

  const handleOpenCart = useCallback(() => {
    openCart();
  }, [openCart]);

  const handleOpenStoreAddresses = useCallback((fromCart: boolean = false) => {
    openStoreAddresses(fromCart);
  }, [openStoreAddresses]);

  const handleSelectAddress = useCallback((_address: string) => {
    closeStoreAddressesAfterSelect();
  }, [closeStoreAddressesAfterSelect]);

  const handleNavigateHome = useCallback(() => {
    navigateHome();
  }, [navigateHome]);

  const handleOpenMenuFromHome = useCallback(() => {
    setPreviousScreen('home');
    setIsMenuOpen(true);
  }, [setPreviousScreen, setIsMenuOpen]);

  const handleOpenMenuFromCart = useCallback(() => {
    setPreviousScreen('cart');
    setIsCartOpen(false);
    setIsMenuOpen(true);
  }, [setPreviousScreen, setIsCartOpen, setIsMenuOpen]);

  const handleOpenMenuFromStoreAddresses = useCallback(() => {
    setPreviousScreen('storeAddresses');
    setIsStoreAddressesOpen(false);
    setIsMenuOpen(true);
  }, [setPreviousScreen, setIsStoreAddressesOpen, setIsMenuOpen]);

  const handleOpenMenuFromSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setIsMenuOpen(true);
  }, [setIsSettingsOpen, setIsMenuOpen]);

  const handleOpenMenuFromOrders = useCallback(() => {
    setIsMyOrdersOpen(false);
    setIsMenuOpen(true);
  }, [setIsMyOrdersOpen, setIsMenuOpen]);

  const handleOpenMenuFromAdminOrders = useCallback(() => {
    setIsAdminOrdersOpen(false);
    setIsMenuOpen(true);
  }, [setIsAdminOrdersOpen, setIsMenuOpen]);

  const handleOpenStoreAddressesFromCart = useCallback(() => {
    handleOpenStoreAddresses(true);
  }, [handleOpenStoreAddresses]);

  const handleOpenMyOrdersFromCart = useCallback(() => {
    setIsCartOpen(false);
    setIsMyOrdersOpen(true);
  }, [setIsCartOpen, setIsMyOrdersOpen]);

  const handleDeleteProduct = async () => {
    if (!webApp || !webApp.initData || !editingProduct) {
      alert('Ошибка: недоступен Telegram WebApp или товар не выбран');
      return;
    }

    const confirmMessage = `Удалить товар "${editingProduct.title}"?`;

    const handleConfirmedDelete = async () => {
      try {
        await deleteGood(editingProduct.id, webApp.initData);

        const onSuccess = () => {
          setIsAdminCardOpen(false);
          setEditingProduct(null);
          reloadProducts();
        };

        if (webApp?.showAlert) {
          webApp.showAlert('Товар успешно удалён', onSuccess);
        } else {
          alert('Товар успешно удалён');
          onSuccess();
        }
      } catch (error) {
        console.error('Failed to delete good:', error);
        if (webApp?.showAlert) {
          webApp.showAlert('Ошибка при удалении товара');
        } else {
          alert('Ошибка при удалении товара');
        }
      }
    };

    if (webApp?.showConfirm) {
      webApp.showConfirm(confirmMessage, (confirmed) => {
        if (!confirmed) return;
        handleConfirmedDelete();
      });
      return;
    }

    const confirmDelete = window.confirm(confirmMessage);
    if (!confirmDelete) return;
    await handleConfirmedDelete();
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
      await reloadProducts();
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      alert('Ошибка при изменении статуса товара');
    }
  };

  // Обработчик клика по баннеру - открывает товар по link
  const handleBannerClick = useCallback((banner: PromoBannerDTO) => {
    if (!banner.link) return;

    const product = products.find(p => p.id === banner.link);
    if (product) {
      setSelectedProduct(product);
    }
  }, [products, setSelectedProduct]);

  // Обработчики для редактирования баннеров
  const handleEditBanner = useCallback((banner: PromoBannerDTO) => {
    setEditingBanner(banner);
    setIsAdminBannerCardOpen(true);
  }, [setEditingBanner, setIsAdminBannerCardOpen]);

  const handleDeleteBanner = async () => {
    if (!webApp || !webApp.initData || !editingBanner) {
      webApp?.showAlert?.('Ошибка: недоступен Telegram WebApp или баннер не выбран');
      return;
    }

    // Use Telegram WebApp native confirm dialog
    webApp.showConfirm('Удалить промо-баннер?', async (confirmed) => {
      if (!confirmed) return;

      try {
        await deletePromoBanner(editingBanner.id, webApp.initData);
        webApp.showAlert('Баннер успешно удалён', () => {
          setIsAdminBannerCardOpen(false);
          setEditingBanner(null);
          reloadPromoBanners();
        });
      } catch (error) {
        console.error('Failed to delete banner:', error);
        webApp.showAlert(`Ошибка при удалении баннера:\n${error instanceof Error ? error.message : String(error)}`);
      }
    });
  };

  const handleToggleBlockBanner = async () => {
    if (!webApp || !webApp.initData || !editingBanner) {
      alert('Ошибка: недоступен Telegram WebApp или баннер не выбран');
      return;
    }

    try {
      if (editingBanner.status === 'BLOCKED') {
        // Активируем баннер
        await activatePromoBanner(editingBanner.id, webApp.initData);
        alert('Баннер успешно активирован');
      } else {
        // Блокируем баннер
        await blockPromoBanner(editingBanner.id, webApp.initData);
        alert('Баннер успешно заблокирован');
      }
      setIsAdminBannerCardOpen(false);
      setEditingBanner(null);
      await reloadPromoBanners();
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      alert('Ошибка при изменении статуса баннера');
    }
  };

  const handleSaveBanner = async (link: number | null) => {
    if (!webApp || !webApp.initData || !editingBanner) {
      alert('Ошибка: недоступен Telegram WebApp или баннер не выбран');
      return;
    }

    try {
      await updatePromoBannerLink(editingBanner.id, link, webApp.initData);
      setIsAdminBannerCardOpen(false);
      setEditingBanner(null);
      await reloadPromoBanners();
      alert('Баннер успешно сохранён');
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Ошибка при сохранении баннера');
    }
  };


  const handleSaveAdminCard = async (data: {
    id?: number;
    name: string;
    category: string;
    price: number;
    non_discount_price?: number;
    description: string;
    imageFiles: File[];
    sort_order?: number;
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
            non_discount_price: data.non_discount_price,
            description: data.description,
            sort_order: data.sort_order,
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
            non_discount_price: data.non_discount_price,
            description: data.description,
            sort_order: data.sort_order,
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
      await reloadProducts();
    } catch (error) {
      console.error('Failed to save good card:', error);
      alert('Ошибка при сохранении товара. Проверьте права доступа.');
    }
  };

  // Получение информации о пользователе при инициализации
  useEffect(() => {
    if (!webApp || !webApp.initData) return;

    fetchUserInfo(webApp.initData)
      .then((data) => {
        setUserInfo(data);
        if (import.meta.env.DEV) {
          console.log('User info loaded:', data);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch user info:', error);
      });
  }, [webApp]);

  // Intersection Observer для отслеживания видимости ProductGrid
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Показываем кнопку когда ProductGrid появился на экране на 20%
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            setIsBottomButtonVisible(true);
          }
        });
      },
      {
        threshold: 0.2, // Срабатывает когда 20% элемента видно
      }
    );

    const currentRef = productGridRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);


  // Управление BackButton Telegram
  useEffect(() => {
    if (!webApp) return;

    const isNotOnHome = isCartOpen || selectedProduct !== null || isStoreAddressesOpen || isDeliveryInfoOpen || isPaymentInfoOpen || isMenuOpen || isAdminCardOpen || isSettingsOpen || isMyOrdersOpen || isAdminOrdersOpen;

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
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isMyOrdersOpen) {
          setIsMyOrdersOpen(false);
        } else if (isAdminOrdersOpen) {
          setIsAdminOrdersOpen(false);
        } else if (isDeliveryInfoOpen) {
          setIsDeliveryInfoOpen(false);
          setIsMenuOpen(true);
        } else if (isPaymentInfoOpen) {
          setIsPaymentInfoOpen(false);
          setIsMenuOpen(true);
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
  }, [webApp, isCartOpen, selectedProduct, isStoreAddressesOpen, isDeliveryInfoOpen, isPaymentInfoOpen, isMenuOpen, isAdminCardOpen, isSettingsOpen, isMyOrdersOpen, isAdminOrdersOpen, returnToCart, previousProduct, previousScreenBeforeCart, handleCloseMenu]);

  return (
    <CartProvider webApp={webApp}>
      <div className="min-h-screen bg-white max-w-[402px] mx-auto">
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={handleCloseMenu}
          onOpenStoreAddresses={handleOpenStoreAddresses}
          onOpenDeliveryInfo={handleOpenDeliveryInfo}
          onOpenPaymentInfo={handleOpenPaymentInfo}
          onOpenFeedback={handleOpenFeedback}
          onOpenSettings={handleOpenSettings}
          onOpenMyOrders={handleOpenMyOrders}
          onOpenAdminOrders={handleOpenAdminOrders}
          onNavigateHome={handleNavigateHome}
          userRole={userInfo?.role}
        />
        <Suspense fallback={null}>
          <DeliveryInfo
            isOpen={isDeliveryInfoOpen}
            onClose={handleCloseDeliveryInfo}
            initData={webApp?.initData}
            userMode={userInfo?.mode}
          />
        </Suspense>
        <Suspense fallback={null}>
          <PaymentInfo
            isOpen={isPaymentInfoOpen}
            onClose={handleClosePaymentInfo}
            initData={webApp?.initData}
            userMode={userInfo?.mode}
          />
        </Suspense>
        <StoreAddresses
          isOpen={isStoreAddressesOpen}
          onSelectAddress={handleSelectAddress}
          onMenuClick={handleOpenMenuFromStoreAddresses}
          userMode={userInfo?.mode}
          initData={webApp?.initData}
          fromCart={returnToCart}
        />
        <Suspense fallback={null}>
          <Settings
            isOpen={isSettingsOpen}
            onClose={handleCloseSettings}
            onMenuClick={handleOpenMenuFromSettings}
            userMode={userInfo?.mode}
            initData={webApp?.initData}
            onModeChange={handleSettingsModeChange}
          />
        </Suspense>
        <Suspense fallback={null}>
          <MyOrders
            isOpen={isMyOrdersOpen}
            onMenuClick={handleOpenMenuFromOrders}
            initData={webApp?.initData}
          />
        </Suspense>
        <Suspense fallback={null}>
          <AdminOrders
            isOpen={isAdminOrdersOpen}
            onMenuClick={handleOpenMenuFromAdminOrders}
            initData={webApp?.initData}
          />
        </Suspense>
        {isCartOpen && (
          <Suspense fallback={null}>
            <Cart
              onOpenMenu={handleOpenMenuFromCart}
              onOpenStoreAddresses={handleOpenStoreAddressesFromCart}
              onOpenMyOrders={handleOpenMyOrdersFromCart}
            />
          </Suspense>
        )}
        {selectedProduct && !isCartOpen && (
          <Suspense fallback={null}>
            <ProductCard
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onOpenCart={handleOpenCart}
              userInfo={userInfo || undefined}
              onEdit={handleEditSelectedProduct}
            />
          </Suspense>
        )}
        {isAdminCardOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}
        {isAdminBannerCardOpen && editingBanner && (
          <Suspense fallback={null}>
            <AdminPromoBannerCard
              banner={editingBanner}
              onClose={() => {
                setIsAdminBannerCardOpen(false);
                setEditingBanner(null);
              }}
              onDelete={handleDeleteBanner}
              onBlock={handleToggleBlockBanner}
              onSave={handleSaveBanner}
            />
          </Suspense>
        )}
        <div className="flex flex-col gap-4">
          <AppHeader
            title="FanFanTulpan"
            actionType="menu-text"
            onAction={handleOpenMenuFromHome}
          />
          <SearchBar onSearchChange={setSearchQuery} />
          <PromoBanner
            banners={promoBanners}
            isAdminMode={userInfo?.mode === 'ADMIN'}
            onAddNew={addPromoBanner}
            onEdit={handleEditBanner}
            onBannerClick={handleBannerClick}
          />
          <CategoryTabs
            categories={uniqueCategories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryToggle}
          />
          <div ref={productGridRef}>
            <ProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
              isAdminMode={userInfo?.mode === 'ADMIN'}
              onAddNewCard={handleOpenAdminCard}
            />
          </div>
          <CartBottomButton
            isVisible={isBottomButtonVisible}
            onClick={handleOpenCart}
          />
        </div>
      </div>
    </CartProvider>
  );
}

export default App;
