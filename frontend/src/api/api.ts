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
  role: "user" | "admin";
};

export type Recipe = {
  _id: string;
  name: string;
  description: string;
  cuisine: string;
  diet: string;
  tags: string[];
  prepMinutes: number;
  calories: number;
  servings: number;
  ingredients: { name: string; quantity: number; unit: string; ingredientId: string }[];
  steps: string[];
  imageUrl: string;
  views?: number;
  matchPercentage?: number;
  matchedCount?: number;
};

export type Preferences = {
  diet: string;
  cuisines: string[];
  allergies: string[];
  excludeIngredients: string[];
  maxPrepMinutes: number;
  mealsPerDay: number;
  repeatLimitWeekly: number;
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
};

export type MealPlan = {
  _id: string;
  weekStart: string;
  days: {
    date: string;
    meals: { mealType: string; recipeId: string }[];
  }[];
};

export type ShoppingList = {
  _id: string;
  weekStart: string;
  items: { name: string; quantity: number; unit: string; ingredientId?: string }[];
};

export type PantryItem = {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  ingredientId: string;
  category: string;
};

export type Ingredient = {
  _id: string;
  name: string;
  category: string;
  defaultUnit: string;
  shelfLifeDays: number;
  isCustom: boolean;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type AdminStats = {
  totalRecipes: number;
  publishedRecipes: number;
  draftRecipes: number;
  archivedRecipes: number;
  totalUsers: number;
  totalCategories: number;
  totalPantryItems: number;
  totalCookingActivities: number;
  reviewQueue: number;
  mostCookedRecipe: string;
  mostUsedIngredient: string;
};

export type AdminActivity = {
  _id: string;
  name: string;
  status: string;
  updatedAt: string;
  views?: number;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type UserProfile = {
  profile: User;
  stats: {
    totalPantryItems: number;
    mostStoredIngredient: string;
    totalCooked: number;
  };
  recentLogs: any[];
  savedRecipes: any[];
};

export type AdminUser = {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminCookingLog = {
  _id: string;
  userId: { _id: string; username: string };
  recipeId: { _id: string; name: string };
  performedAt: string;
};

export type AdminAnalytics = {
  mostCooked: { name: string; count: number }[];
  ingredientStats: { name: string; count: number }[];
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

/**
 * Get current logged-in user profile
 * Requires Authorization header
 */
export function getProfileApi() {
  return request<UserProfile>("/users/profile", { method: "GET" });
}

export function updateProfileApi(data: { username?: string; email?: string; avatarUrl?: string }) {
  return request<{ user: User }>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function changePasswordApi(data: any) {
  return request<{ ok: boolean; message: string }>("/users/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSavedRecipesApi() {
  return request<{ recipes: Recipe[] }>("/recipes/saved", { method: "GET" });
}

export function toggleSaveRecipeApi(recipeId: string) {
  return request<{ saved: boolean }>(`/recipes/saved/${recipeId}`, { method: "POST" });
}

/* =========================
   Recipe APIs
========================= */

export function listRecipesApi() {
  return request<{ recipes: Recipe[] }>("/recipes", { method: "GET" });
}

export function getRecipeApi(id: string) {
  return request<{ recipe: Recipe }>(`/recipes/${id}`, { method: "GET" });
}

export function createRecipeApi(payload: Partial<Recipe>) {
  return request<{ recipe: Recipe }>("/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRecipeApi(id: string, payload: Partial<Recipe>) {
  return request<{ recipe: Recipe }>(`/recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function suggestRecipesApi(ingredientIds: string[]) {
  const ids = ingredientIds.join(",");
  return request<{ recipes: Recipe[] }>(`/recipes/suggested?ingredientIds=${ids}`, { method: "GET" });
}

/* =========================
   Preferences APIs
========================= */

export function getPreferencesApi() {
  return request<{ preferences: Preferences }>("/preferences/me", { method: "GET" });
}

export function savePreferencesApi(payload: Preferences) {
  return request<{ preferences: Preferences }>("/preferences/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/* =========================
   Meal Plan APIs
========================= */

export function getCurrentMealPlanApi() {
  return request<{ plan: MealPlan | null; shoppingList: ShoppingList | null }>(
    "/meal-plans/current",
    { method: "GET" }
  );
}

export function generateMealPlanApi() {
  return request<{ plan: MealPlan; shoppingList: ShoppingList | null }>(
    "/meal-plans/generate",
    { method: "POST" }
  );
}

export function getCurrentShoppingListApi() {
  return request<{ shoppingList: ShoppingList | null }>(
    "/shopping-lists/current",
    { method: "GET" }
  );
}

export function getPantryItemsApi() {
  return request<{ items: PantryItem[] }>("/pantry", { method: "GET" });
}

export function searchIngredientsApi(params: {
  q?: string;
  category?: string;
  limit?: number;
  includeCustom?: boolean;
}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.includeCustom === false) query.set("includeCustom", "false");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<{ ingredients: Ingredient[] }>(`/ingredients${suffix}`, { method: "GET" });
}

export function createCustomIngredientApi(payload: {
  name: string;
  category: string;
  defaultUnit?: string;
  shelfLifeDays?: number;
  keywords?: string[];
}) {
  return request<{ ingredient: Ingredient }>("/ingredients/custom", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================
   Admin APIs
   ========================= */

export function getAdminStatsApi() {
  return request<{ stats: AdminStats }>("/admin/stats", { method: "GET" });
}

export function getAdminActivitiesApi() {
  return request<{ recentRecipes: AdminActivity[]; popularRecipes: AdminActivity[] }>("/admin/activities", { method: "GET" });
}

export function updateRecipeStatusApi(id: string, status: string) {
  return request<{ recipe: Recipe }>(`/recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function deleteRecipeApi(id: string) {
  return request<{ ok: boolean }>(`/recipes/${id}`, { method: "DELETE" });
}

/* =========================
   Expanded Admin APIs
   ========================= */

export function getAdminUsersApi(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return request<{ users: AdminUser[] }>(`/admin/users${query}`, { method: "GET" });
}

export function toggleUserStatusApi(id: string) {
  return request<{ user: AdminUser }>(`/admin/users/${id}/status`, { method: "PATCH" });
}

export function deleteUserApi(id: string) {
  return request<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" });
}

export function getAdminLogsApi() {
  return request<{ logs: AdminCookingLog[] }>("/admin/logs", { method: "GET" });
}

export function getAdminAnalyticsApi() {
  return request<AdminAnalytics>("/admin/analytics", { method: "GET" });
}
