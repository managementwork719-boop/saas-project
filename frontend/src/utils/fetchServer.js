import { cookies } from 'next/headers';

export async function fetchServer(endpoint, options = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // For server-side fetching, we might need to pass the cookie manually if the backend expects it
  // But since we are calling the backend directly, 'Authorization' header is more reliable
  if (token) {
    headers['Cookie'] = `jwt=${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    cache: options.cache || 'no-store', // Default to no-store for dynamic dashboard data
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error(`API call failed with status ${response.status}`);
  }

  return response.json();
}
