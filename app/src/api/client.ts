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
  image_url?: string;
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
  image_url?: string;
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
