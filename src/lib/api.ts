// API base URL - Vite proxy will forward /api to backend
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  try {
    console.log(`[API] Making ${options.method || 'GET'} request to: ${API_BASE}${path}`);
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    console.log(`[API] Response status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      let errorMessage = res.statusText;
      let errorDetails = null;
      try {
        const text = await res.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || text;
            errorDetails = json;
          } catch {
            errorMessage = text;
          }
        }
      } catch {
        // Use default errorMessage
      }
      const error = new Error(errorMessage || `HTTP ${res.status}: ${res.statusText}`);
      (error as any).details = errorDetails;
      throw error;
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 4000.');
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {};
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!res.ok) {
      let errorMessage = res.statusText;
      let errorDetails = null;
      try {
        const text = await res.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || text;
            errorDetails = json;
          } catch {
            errorMessage = text;
          }
        }
      } catch {
        // Use default errorMessage
      }
      const error = new Error(errorMessage || `HTTP ${res.status}: ${res.statusText}`);
      (error as any).details = errorDetails;
      throw error;
    }

    return res.json() as Promise<T>;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 4000.');
    }
    throw error;
  }
}


