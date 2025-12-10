import { useEffect, useState } from 'react';

interface UseTelegramWebAppReturn {
  webApp: TelegramWebApp | null;
  user: TelegramWebApp['initDataUnsafe']['user'] | null;
  isReady: boolean;
}

export const useTelegramWebApp = (): UseTelegramWebAppReturn => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setIsReady(true);

      // Применяем цвета темы Telegram
      if (tg.themeParams.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
      }
      if (tg.themeParams.text_color) {
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
      }
      if (tg.themeParams.button_color) {
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
      }
      if (tg.themeParams.button_text_color) {
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
      }
    }
  }, []);

  return {
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    isReady,
  };
};

export default useTelegramWebApp;
