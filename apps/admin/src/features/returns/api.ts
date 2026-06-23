import { apiJson } from "../../lib/admin-api";
import type { ReturnRecord, ReturnsResponse } from "./types";

export function fetchReturns() {
  return apiJson<ReturnsResponse>("/returns?page=1&limit=1000");
}

export function fetchReturnDetail(returnId: string) {
  return apiJson<ReturnRecord>(`/returns/${returnId}`);
}

export function updateReturnStatus(returnId: string, status: string) {
  return apiJson(
    `/returns/${returnId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "/returns",
  );
}
