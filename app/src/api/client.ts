// User information from backend
export interface UserInfo {
  id: number;
  role: string;
  mode: string;
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
