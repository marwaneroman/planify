const API_URL =
  import.meta.env.DEV
    ? import.meta.env.VITE_API_URL || "http://localhost:3001"
    : "";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = (data as { error?: string })?.error || res.statusText || "Request failed";
    throw new Error(err);
  }
  return data as T;
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem("auth_token", token);
  else localStorage.removeItem("auth_token");
}

export function getAuthToken() {
  return getToken();
}
