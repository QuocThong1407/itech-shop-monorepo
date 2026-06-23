// apps/customer/src/lib/api.ts
import { createApiClient } from "@itech/shared/api";
import { cookies } from "next/headers";
import type { Order, OrderStatus } from "./order-types";

export * from "./order-types";

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const body = await promise as any;
  return (body?.data !== undefined ? body.data : body) as T;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  variants: ProductVariant[];
  categoryId: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartProductVariant {
  id: string;
  quantity: number;
  variantAttributes: Record<string, string> | null;
  images: string[] | null;
  priceAdjustment: number;
  Product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stockQuantity: number;
  };
}

export interface CartItem {
  id: string;
  quantity: number;
  ProductVariant: CartProductVariant;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  emailVerified: string | null;
  isOAuth: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePicture {
  image: string | null;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedOrders {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Address {
  id: string;
  phoneNumber: string;
  address: string;
  street: string | null;
  ward: string | null;
  district: string | null;
  province: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  phoneNumber: string;
  address: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}


// ─── Client factory ───────────────────────────────────────────────────────────

export function getApiClient(token?: string) {
  return createApiClient({
    baseUrl: BASE_URL,
    credentials: "include",
    token,
  });
}

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

export async function getProducts(params: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
} = {}): Promise<PaginatedProducts> {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.category) query.set("categoryId", params.category); // fix: category → categoryId
  if (params.search) query.set("search", params.search);
  // sort không gửi lên backend, xử lý client-side bên dưới

  const qs = query.toString();
  const res = await fetch(
    `${BASE_URL}/products${qs ? `?${qs}` : ""}`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to fetch products");

  const body = await res.json();
  const raw = body.data ?? body;
  let products: Product[] = raw.products ?? raw.data ?? [];

  if (params.sort === "price_asc") {
    products = [...products].sort((a, b) => a.price - b.price);
  } else if (params.sort === "price_desc") {
    products = [...products].sort((a, b) => b.price - a.price);
  } else if (params.sort === "newest") {
    products = [...products].sort(
      (a, b) =>
        new Date((b as any).createdAt).getTime() -
        new Date((a as any).createdAt).getTime()
    );
  }

  const pagination = raw.pagination ?? {};

  return {
    data: products,
    total: pagination.total ?? products.length,
    page: pagination.page ?? params.page ?? 1,
    limit: pagination.limit ?? params.limit ?? 12,
    totalPages: pagination.totalPages ?? 1,
  };
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Product not found");
  const body = await res.json();
  return body.data ?? body;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  const body = await res.json();
  const raw = body.data ?? body;
  return raw.categories ?? [];
}

// ─── Authenticated endpoints ──────────────────────────────────────────────────


// GET /orders trả về { orders, pagination } theo getMyOrders() — không phải mảng trần
export async function getOrders(params: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
} = {}): Promise<PaginatedOrders> {
  const token = await getAuthToken();
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);

  const qs = query.toString();
  const res = await fetch(
  `${BASE_URL}/orders/me${qs ? `?${qs}` : ""}`, 
  {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }
);

  if (!res.ok) {
  const body = await res.text().catch(() => "");
  throw new Error(`Orders fetch failed: ${res.status} ${body}`);
}
  const body = await res.json();
  const raw = body.data ?? body;
  return {
    orders: raw.orders ?? [],
    pagination: raw.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
}

// ─── Profile mutations ─────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<UserProfile>(client.get("/users/me"));
}

export async function updateProfile(updates: { username: string }): Promise<UserProfile> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<UserProfile>(client.patch("/users/me", updates));
}

export async function getProfilePicture(): Promise<ProfilePicture> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<ProfilePicture>(client.get("/users/me/pfp"));
}

export async function getCart(): Promise<Cart> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<Cart>(client.get("/cart/me"));
}

export async function getAddresses(): Promise<Address[]> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<Address[]>(client.get("/addresses"));
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<Address>(client.post("/addresses", input));
}

export async function deleteAddress(id: string): Promise<void> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  await unwrap<null>(client.del(`/addresses/${id}`));
}

export async function getOrder(id: string): Promise<Order> {
  const token = await getAuthToken();
  const client = getApiClient(token);
  return unwrap<Order>(client.get(`/orders/${id}`));
}
