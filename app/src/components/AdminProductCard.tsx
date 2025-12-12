import React, { useState, useRef } from 'react';
import { uploadImage } from '../api/client';

interface AdminProductCardProps {
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: string;
    price: number;
    description: string;
    image_url: string;
  }) => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Букеты');
  const [priceRub, setPriceRub] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения');
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      alert('Введите название товара');
      return;
    }

    if (!priceRub.trim() || isNaN(Number(priceRub)) || Number(priceRub) <= 0) {
      alert('Введите корректную цену');
      return;
    }

    if (!description.trim()) {
      alert('Введите описание товара');
      return;
    }

    // Price is stored as integer rubles
    const price = Math.round(Number(priceRub));

    onSave({
      name: name.trim(),
      category: category,
      price: price,
      description: description.trim(),
      image_url: imageUrl.trim() || '/images/flower-1-59d765.png', // Default image if not provided
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Image Placeholder Section */}
        <div
          className="relative h-[505px] flex-shrink-0 bg-gray-light flex items-center justify-center rounded-b-[30px] cursor-pointer"
          onClick={handleImageClick}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal mx-auto mb-4"></div>
              <p className="text-gray-medium text-base">Загрузка...</p>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-b-[30px]"
              onError={(e) => {
                e.currentTarget.src = '/images/flower-1-59d765.png';
              }}
            />
          ) : (
            <div className="text-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-4"
              >
                <path
                  d="M32 42V22M22 32H42"
                  stroke="#A09CAB"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <rect
                  x="8"
                  y="8"
                  width="48"
                  height="48"
                  rx="8"
                  stroke="#A09CAB"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
              <p className="text-gray-medium text-base">Добавить фото</p>
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="px-8 pt-6 pb-8 flex-1">
          {/* Image URL Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black mb-2">
              URL изображения
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full px-4 py-3 rounded-[20px] bg-gray-light border-none text-base text-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black mb-2">
              Название *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Авторская композиция..."
              className="w-full px-4 py-3 rounded-[20px] bg-gray-light border-none text-base text-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Category Select */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black mb-2">
              Категория *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-[20px] bg-gray-light border-none text-base text-black focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="Букеты">Букеты</option>
              <option value="Розы">Розы</option>
              <option value="Вазы">Вазы</option>
              <option value="Экзотика">Экзотика</option>
            </select>
          </div>

          {/* Price Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-black mb-2">
              Цена (руб.) *
            </label>
            <input
              type="number"
              value={priceRub}
              onChange={(e) => setPriceRub(e.target.value)}
              placeholder="2999"
              min="0"
              step="1"
              className="w-full px-4 py-3 rounded-[20px] bg-gray-light border-none text-base text-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-black mb-2">
              Описание *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Букет 'Название' — это гармоничное сочетание..."
              rows={4}
              className="w-full px-4 py-3 rounded-[20px] bg-gray-light border-none text-base text-black placeholder-gray-medium focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-[10px]">
            <button
              onClick={handleSave}
              className="flex-1 h-[66px] bg-teal rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-black">Сохранить</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-[66px] bg-gray-light rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-black">Отмена</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductCard;
