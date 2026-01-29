import { useCallback, useState } from 'react';
import type { PromoBannerDTO } from '../api/client';
import type { Product } from '../components/ProductGrid';

export type PreviousScreen = 'home' | 'cart' | 'storeAddresses' | null;
export type PreviousScreenBeforeCart = 'home' | 'productCard' | null;

export const useNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreAddressesOpen, setIsStoreAddressesOpen] = useState(false);
  const [isDeliveryInfoOpen, setIsDeliveryInfoOpen] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAdminOrdersOpen, setIsAdminOrdersOpen] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<PreviousScreen>(null);
  const [previousScreenBeforeCart, setPreviousScreenBeforeCart] = useState<PreviousScreenBeforeCart>(null);
  const [previousProduct, setPreviousProduct] = useState<Product | null>(null);
  const [returnToCart, setReturnToCart] = useState(false);
  const [isAdminCardOpen, setIsAdminCardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdminBannerCardOpen, setIsAdminBannerCardOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBannerDTO | null>(null);
  const [isBottomButtonVisible, setIsBottomButtonVisible] = useState(false);

  const openCart = useCallback(() => {
    if (selectedProduct) {
      setPreviousScreenBeforeCart('productCard');
      setPreviousProduct(selectedProduct);
    } else {
      setPreviousScreenBeforeCart('home');
      setPreviousProduct(null);
    }

    setIsCartOpen(true);
    setSelectedProduct(null);
  }, [selectedProduct]);

  const openStoreAddresses = useCallback((fromCart: boolean = false) => {
    setReturnToCart(fromCart);
    if (fromCart) {
      setIsCartOpen(false);
    } else {
      setIsMenuOpen(false);
    }
    setIsStoreAddressesOpen(true);
  }, []);

  const closeStoreAddressesAfterSelect = useCallback(() => {
    setIsStoreAddressesOpen(false);
    if (returnToCart) {
      setIsCartOpen(true);
      setReturnToCart(false);
    }
  }, [returnToCart]);

  const navigateHome = useCallback(() => {
    setIsMenuOpen(false);
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsStoreAddressesOpen(false);
    setIsSettingsOpen(false);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    if (previousScreen === 'cart') {
      setIsCartOpen(true);
    } else if (previousScreen === 'storeAddresses') {
      setIsStoreAddressesOpen(true);
    }
    setPreviousScreen(null);
  }, [previousScreen]);

  return {
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
    previousScreen,
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
  };
};

export default useNavigation;
