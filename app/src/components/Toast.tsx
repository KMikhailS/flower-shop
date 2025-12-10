import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] max-w-[402px] w-full px-8">
      <div className="bg-[#80D1C1] rounded-[20px] px-6 py-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] animate-slide-up">
        <p className="text-base font-semibold leading-[1.174] text-black text-center">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Toast;
