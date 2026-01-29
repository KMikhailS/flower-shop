import { useCallback, useEffect, useState } from 'react';
import { createPromoBanner, fetchAllPromoBanners, fetchPromoBanners, PromoBannerDTO } from '../api/client';

interface UsePromoBannersOptions {
  userMode?: string;
  initData?: string;
  webApp: TelegramWebApp | null;
}

export const usePromoBanners = ({ userMode, initData, webApp }: UsePromoBannersOptions) => {
  const [promoBanners, setPromoBanners] = useState<PromoBannerDTO[]>([]);

  const loadPromoBanners = useCallback(async () => {
    try {
      let banners: PromoBannerDTO[];

      if (userMode === 'ADMIN' && initData) {
        banners = await fetchAllPromoBanners(initData);
      } else {
        banners = await fetchPromoBanners();
      }

      setPromoBanners(banners);
    } catch (error) {
      console.error('Failed to fetch promo banners:', error);
      setPromoBanners([]);
    }
  }, [userMode, initData]);

  useEffect(() => {
    loadPromoBanners();
  }, [loadPromoBanners]);

  const handleAddPromoBanner = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Файл должен быть изображением');
        return;
      }

      try {
        const authData = initData || webApp?.initData || '';

        if (import.meta.env.DEV) {
          console.log('Creating promo banner with initData length:', authData.length);
        }

        if (!authData) {
          console.error('No initData available');
          alert('Ошибка авторизации. Перезапустите приложение.');
          return;
        }

        const newBanner = await createPromoBanner(file, authData);
        if (import.meta.env.DEV) {
          console.log('Promo banner created:', newBanner);
        }

        await loadPromoBanners();
        alert('Промо-баннер успешно создан!');
      } catch (error) {
        console.error('Failed to create promo banner:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        alert(`Не удалось создать промо-баннер: ${errorMessage}`);
      }
    };

    input.click();
  }, [initData, webApp, loadPromoBanners]);

  return {
    promoBanners,
    reloadPromoBanners: loadPromoBanners,
    addPromoBanner: handleAddPromoBanner,
  };
};

export default usePromoBanners;
