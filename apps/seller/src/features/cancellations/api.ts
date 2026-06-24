import { apiJson } from "../../lib/seller-api";
import type { CancellationRecord, CancellationsResponse } from "./types";

export function fetchCancellations() {
  return apiJson<CancellationsResponse>("/cancellations?page=1&limit=1000");
}

export function fetchCancellationDetail(cancellationId: string) {
  return apiJson<CancellationRecord>(`/cancellations/${cancellationId}`);
}

export function updateCancellationStatus(cancellationId: string, status: string) {
  return apiJson(
    `/cancellations/${cancellationId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "/seller/cancellations",
  );
}
