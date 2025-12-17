// User information from backend
export interface UserInfo {
  id: number;
  role: string;
  mode: string;
  status: string;
}

// Shop address from backend
export interface ShopAddress {
  id: number;
  address: string;
}

// Good card data for creating new products
export interface GoodCardData {
  name: string;
  category: string;
  price: number;
  description: string;
}

// Image DTO for product images
export interface ImageDTO {
  image_url: string;
  display_order: number;
}

// Good DTO for public goods listing
export interface GoodDTO {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  images: ImageDTO[];
  status: string;
}

// Promo banner from backend
export interface PromoBannerDTO {
  id: number;
  status: string;
  display_order: number;
  image_url: string;
}

// API base URL - uses relative path to work with nginx proxy
// In development with Vite proxy or production with nginx, both route /api to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch current user information from backend
 *
 * @param initData - Telegram WebApp initData string
 * @returns Promise<UserInfo> - User information
 * @throws Error if request fails
 */
export async function fetchUserInfo(initData: string): Promise<UserInfo> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user info: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as UserInfo;
}

/**
 * Create a new good card (ADMIN only)
 *
 * @param goodCardData - The good card data to create
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodDTO> - Created good card data
 * @throws Error if request fails
 */
export async function createGoodCard(
  goodCardData: GoodCardData,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/card`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goodCardData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create good card: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO;
}

/**
 * Update an existing good card (ADMIN only)
 *
 * @param goodId - ID of the good to update
 * @param goodCardData - The updated good card data
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodDTO> - Updated good card data
 * @throws Error if request fails
 */
export async function updateGoodCard(
  goodId: number,
  goodCardData: GoodCardData,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goodCardData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update good card: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO;
}

/**
 * Upload product images
 *
 * @param files - Array of image files to upload (jpg, jpeg, png, webp, max 5MB each)
 * @returns Promise<string[]> - Array of image URLs (/api/static/xxx.jpg)
 * @throws Error if upload fails
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE_URL}/shop/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload images: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.imageUrls;
}

/**
 * Add images to an existing good (ADMIN only)
 *
 * @param goodId - ID of the good to add images to
 * @param files - Array of image files to upload
 * @param initData - Telegram WebApp initData string
 * @returns Promise<string[]> - Array of uploaded image URLs
 * @throws Error if upload fails
 */
export async function addGoodImages(
  goodId: number,
  files: File[],
  initData: string
): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add images to good: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.imageUrls;
}

/**
 * Fetch all goods with status NEW (public endpoint)
 *
 * @returns Promise<GoodDTO[]> - List of goods
 * @throws Error if request fails
 */
export async function fetchGoods(): Promise<GoodDTO[]> {
  const response = await fetch(`${API_BASE_URL}/goods`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch goods: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO[];
}

/**
 * Fetch all goods regardless of status (ADMIN only)
 *
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodDTO[]> - List of all goods
 * @throws Error if request fails
 */
export async function fetchAllGoods(initData: string): Promise<GoodDTO[]> {
  const response = await fetch(`${API_BASE_URL}/goods/all`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch all goods: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO[];
}

/**
 * Delete good (ADMIN only)
 *
 * @param goodId - ID of the good to delete
 * @param initData - Telegram WebApp initData string
 * @returns Promise<void>
 * @throws Error if request fails
 */
export async function deleteGood(
  goodId: number,
  initData: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete good: ${response.status} ${errorText}`);
  }
}

/**
 * Block good - set status to BLOCKED (ADMIN only)
 *
 * @param goodId - ID of the good to block
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodDTO> - Updated good card data
 * @throws Error if request fails
 */
export async function blockGood(
  goodId: number,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/block`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to block good: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO;
}

/**
 * Activate good - set status to NEW (ADMIN only)
 *
 * @param goodId - ID of the good to activate
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodDTO> - Updated good card data
 * @throws Error if request fails
 */
export async function activateGood(
  goodId: number,
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/activate`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to activate good: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO;
}

/**
 * Fetch all promo banners with status NEW (public endpoint)
 *
 * @returns Promise<PromoBannerDTO[]> - List of promo banners
 * @throws Error if request fails
 */
export async function fetchPromoBanners(): Promise<PromoBannerDTO[]> {
  const response = await fetch(`${API_BASE_URL}/promo`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch promo banners: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as PromoBannerDTO[];
}

/**
 * Fetch ALL promo banners including BLOCKED (ADMIN only)
 *
 * @param initData - Telegram WebApp initData string
 * @returns Promise<PromoBannerDTO[]> - All promo banners
 * @throws Error if request fails
 */
export async function fetchAllPromoBanners(initData: string): Promise<PromoBannerDTO[]> {
  const response = await fetch(`${API_BASE_URL}/promo/all`, {
    method: 'GET',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch all promo banners: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as PromoBannerDTO[];
}

/**
 * Create a new promo banner by uploading an image (ADMIN only)
 *
 * @param file - Image file to upload
 * @param initData - Telegram WebApp initData string
 * @returns Promise<PromoBannerDTO> - Created promo banner data
 * @throws Error if upload fails
 */
export async function createPromoBanner(
  file: File,
  initData: string
): Promise<PromoBannerDTO> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/promo`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create promo banner: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as PromoBannerDTO;
}

/**
 * Delete promo banner (ADMIN only)
 *
 * @param bannerId - ID of the banner to delete
 * @param initData - Telegram WebApp initData string
 * @returns Promise<void>
 * @throws Error if request fails
 */
export async function deletePromoBanner(
  bannerId: number,
  initData: string
): Promise<void> {
  const url = `${API_BASE_URL}/promo/${bannerId}`;

  console.log(`[DELETE BANNER] Sending DELETE request to: ${url}, Banner ID: ${bannerId}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });

  console.log(`[DELETE BANNER] Response received: Status ${response.status}, OK: ${response.ok}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[DELETE BANNER] Error response: ${errorText}`);
    throw new Error(`Failed to delete promo banner: ${response.status} ${errorText}`);
  }

  console.log(`[DELETE BANNER] Banner ${bannerId} deleted successfully`);
}

/**
 * Block promo banner - set status to BLOCKED (ADMIN only)
 *
 * @param bannerId - ID of the banner to block
 * @param initData - Telegram WebApp initData string
 * @returns Promise<PromoBannerDTO> - Updated promo banner data
 * @throws Error if request fails
 */
export async function blockPromoBanner(
  bannerId: number,
  initData: string
): Promise<PromoBannerDTO> {
  const response = await fetch(`${API_BASE_URL}/promo/${bannerId}/block`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to block promo banner: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as PromoBannerDTO;
}

/**
 * Activate promo banner - set status to NEW (ADMIN only)
 *
 * @param bannerId - ID of the banner to activate
 * @param initData - Telegram WebApp initData string
 * @returns Promise<PromoBannerDTO> - Updated promo banner data
 * @throws Error if request fails
 */
export async function activatePromoBanner(
  bannerId: number,
  initData: string
): Promise<PromoBannerDTO> {
  const response = await fetch(`${API_BASE_URL}/promo/${bannerId}/activate`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to activate promo banner: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as PromoBannerDTO;
}

/**
 * Fetch all shop addresses (public endpoint)
 *
 * @returns Promise<ShopAddress[]> - List of shop addresses
 * @throws Error if request fails
 */
export async function fetchShopAddresses(): Promise<ShopAddress[]> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch shop addresses: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as ShopAddress[];
}

/**
 * Create a new shop address (ADMIN only)
 *
 * @param address - The address string
 * @param initData - Telegram WebApp initData string
 * @returns Promise<ShopAddress> - Created shop address
 * @throws Error if request fails
 */
export async function createShopAddress(
  address: string,
  initData: string
): Promise<ShopAddress> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses`, {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create shop address: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as ShopAddress;
}

/**
 * Update existing shop address (ADMIN only)
 *
 * @param addressId - ID of the address to update
 * @param address - The updated address string
 * @param initData - Telegram WebApp initData string
 * @returns Promise<ShopAddress> - Updated shop address
 * @throws Error if request fails
 */
export async function updateShopAddress(
  addressId: number,
  address: string,
  initData: string
): Promise<ShopAddress> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update shop address: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as ShopAddress;
}

/**
 * Delete shop address (ADMIN only)
 *
 * @param addressId - ID of the address to delete
 * @param initData - Telegram WebApp initData string
 * @returns Promise<void>
 * @throws Error if request fails
 */
export async function deleteShopAddress(
  addressId: number,
  initData: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/shop/addresses/${addressId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete shop address: ${response.status} ${errorText}`);
  }
}

/**
 * Reorder images for a good (ADMIN only)
 *
 * @param goodId - ID of the good to reorder images for
 * @param imageUrls - Array of image URLs in new order
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodDTO> - Updated good card data
 * @throws Error if request fails
 */
export async function reorderGoodImages(
  goodId: number,
  imageUrls: string[],
  initData: string
): Promise<GoodDTO> {
  const response = await fetch(`${API_BASE_URL}/goods/${goodId}/images/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `tma ${initData}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrls }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to reorder images: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data as GoodDTO;
}
