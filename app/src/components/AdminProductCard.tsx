import React, { useState, useRef, useEffect } from 'react';
import { Product } from './ProductGrid';

interface AdminProductCardProps {
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    category: string;
    price: number;
    description: string;
    imageFiles: File[];
  }) => void;
  editingProduct?: Product;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ onClose, onSave, editingProduct }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Букеты');
  const [priceRub, setPriceRub] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // При редактировании заполняем форму данными товара
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.title);
      setCategory(editingProduct.category || 'Букеты');
      // Извлекаем числовое значение из строки "2999 руб."
      const priceMatch = editingProduct.price.match(/\d+/);
      if (priceMatch) {
        setPriceRub(priceMatch[0]);
      }
      setDescription(editingProduct.description);

      // Устанавливаем превью изображений из товара (не File, а URL)
      if (editingProduct.images && editingProduct.images.length > 0) {
        setPreviewUrls(editingProduct.images);
      } else if (editingProduct.image) {
        setPreviewUrls([editingProduct.image]);
      }
    }
  }, [editingProduct]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate each file
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Размер файла ${file.name} не должен превышать 5MB`);
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert(`Файл ${file.name} должен быть изображением`);
        return;
      }
    }

    // Create preview URLs for all files
    const urls = fileArray.map(file => URL.createObjectURL(file));

    setSelectedFiles(fileArray);
    setPreviewUrls(urls);
    setCurrentPreviewIndex(0);
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
      id: editingProduct?.id,
      name: name.trim(),
      category: category,
      price: price,
      description: description.trim(),
      imageFiles: selectedFiles,
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
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {previewUrls.length > 0 ? (
            <>
              <img
                src={previewUrls[currentPreviewIndex]}
                alt={`Preview ${currentPreviewIndex + 1}`}
                className="w-full h-full object-cover rounded-b-[30px]"
              />

              {/* Navigation arrows for multiple images */}
              {previewUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPreviewIndex(prev => prev === 0 ? previewUrls.length - 1 : prev - 1);
                    }}
                    className="absolute top-[245px] left-2 w-[50px] h-[50px] flex items-center justify-center bg-white/80 rounded-full"
                  >
                    <img src="/images/arrow-left.svg" alt="Previous" className="w-5 h-9" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPreviewIndex(prev => prev === previewUrls.length - 1 ? 0 : prev + 1);
                    }}
                    className="absolute top-[245px] right-2 w-[50px] h-[50px] flex items-center justify-center bg-white/80 rounded-full"
                  >
                    <img src="/images/arrow-right.svg" alt="Next" className="w-5 h-9" />
                  </button>

                  {/* Pagination dots */}
                  <div className="absolute bottom-[43px] left-1/2 transform -translate-x-1/2 flex gap-5">
                    {previewUrls.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPreviewIndex ? 'bg-[#898989]' : 'bg-[#FFF5F5]'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
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
              <p className="text-gray-medium text-base">Добавить фото (можно несколько)</p>
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="px-8 pt-6 pb-8 flex-1">
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
