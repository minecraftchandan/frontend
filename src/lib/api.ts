import { getStoredSession } from "./auth.ts";

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const accessToken = getStoredSession()?.accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(input, { ...init, headers });
}
