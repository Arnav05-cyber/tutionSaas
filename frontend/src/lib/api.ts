const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function request(method: string, path: string, token?: string | null, body?: unknown) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

const api = {
  get: (path: string, token?: string | null) => request('GET', path, token),
  post: (path: string, body: unknown, token?: string | null) => request('POST', path, token, body),
  put: (path: string, body: unknown, token?: string | null) => request('PUT', path, token, body),
  patch: (path: string, body: unknown, token?: string | null) => request('PATCH', path, token, body),
  delete: (path: string, token?: string | null) => request('DELETE', path, token),
};

export default api;
