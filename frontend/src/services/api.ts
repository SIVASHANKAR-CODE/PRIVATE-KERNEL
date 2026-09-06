const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const token = localStorage.getItem('pk_token');

  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only set Content-Type if not sending FormData
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('API request error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Could not connect to server. Please check your network connection.'
      }
    };
  }
}
