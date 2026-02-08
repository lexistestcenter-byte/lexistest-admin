/**
 * 클라이언트에서 API 라우트 호출 유틸리티
 * - 자동으로 보안 헤더 추가
 * - 에러 핸들링
 */

const API_REQUEST_HEADER = "x-api-request";
const API_REQUEST_VALUE = "internal";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        [API_REQUEST_HEADER]: API_REQUEST_VALUE,
        ...options.headers,
      },
      credentials: "same-origin",
    });

    const json = await response.json();

    if (!response.ok) {
      return { error: json.error || "Request failed" };
    }

    return { data: json.data ?? json };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),

  post: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
