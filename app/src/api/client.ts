// User information from backend
export interface UserInfo {
  id: number;
  role: string;
  mode: string;
  status: string;
}

// Good card data for creating new products
export interface GoodCardData {
  name: string;
  category: string;
  price: number;
  description: string;
}

// Good card response from backend
export interface GoodCardResponse {
  id: number;
  createstamp: string;
  changestamp: string;
  status: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_urls: string[];
}

// Good DTO for public goods listing
export interface GoodDTO {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image_urls: string[];
  status: string;
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
 * @returns Promise<GoodCardResponse> - Created good card data
 * @throws Error if request fails
 */
export async function createGoodCard(
  goodCardData: GoodCardData,
  initData: string
): Promise<GoodCardResponse> {
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
  return data as GoodCardResponse;
}

/**
 * Update an existing good card (ADMIN only)
 *
 * @param goodId - ID of the good to update
 * @param goodCardData - The updated good card data
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodCardResponse> - Updated good card data
 * @throws Error if request fails
 */
export async function updateGoodCard(
  goodId: number,
  goodCardData: GoodCardData,
  initData: string
): Promise<GoodCardResponse> {
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
  return data as GoodCardResponse;
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
 * @returns Promise<GoodCardResponse> - Updated good card data
 * @throws Error if request fails
 */
export async function blockGood(
  goodId: number,
  initData: string
): Promise<GoodCardResponse> {
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
  return data as GoodCardResponse;
}

/**
 * Activate good - set status to NEW (ADMIN only)
 *
 * @param goodId - ID of the good to activate
 * @param initData - Telegram WebApp initData string
 * @returns Promise<GoodCardResponse> - Updated good card data
 * @throws Error if request fails
 */
export async function activateGood(
  goodId: number,
  initData: string
): Promise<GoodCardResponse> {
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
  return data as GoodCardResponse;
}
