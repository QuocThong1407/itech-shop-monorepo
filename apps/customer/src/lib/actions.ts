// apps/customer/src/lib/actions.ts
"use server";

import { updateProfile } from "@/lib/api";
import { createApiClient } from "@itech/shared/api";
import { cookies } from "next/headers";
import type { CreateAddressInput, Address } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const body = await promise as any;
  return (body?.data !== undefined ? body.data : body) as T;
}

async function getClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return createApiClient({ baseUrl: BASE_URL, credentials: "include", token });
}

export async function updateProfileAction(input: { username: string }) {
  return updateProfile(input);
}

export async function createAddressAction(input: CreateAddressInput): Promise<Address> {
  const client = await getClient();
  return unwrap<Address>(client.post("/addresses", input));
}

export async function deleteAddressAction(id: string): Promise<void> {
  const client = await getClient();
  await unwrap<null>(client.del(`/addresses/${id}`));
}