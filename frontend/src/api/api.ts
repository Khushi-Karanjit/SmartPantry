// frontend/src/api/api.ts

// Fixed backend API base URL
const API_BASE = "http://127.0.0.1:5000/api";

/* =========================
   Types
========================= */

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

/* =========================
   Helpers
========================= */

function getToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Generic request helper
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  // IMPORTANT: use Record<string, string>
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data as T;
}

/* =========================
   Auth APIs
========================= */

/**
 * Register new user
 * Redirect to login after success (handled in page)
 */
export function registerApi(payload: {
  username: string;
  email: string;
  password: string;
}) {
  return request<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Login user
 * Returns token + user
 */
export function loginApi(payload: {
  usernameOrEmail: string;
  password: string;
}) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get current logged-in user
 * Requires Authorization header
 */
export function meApi() {
  return request<MeResponse>("/users/me", {
    method: "GET",
  });
}
