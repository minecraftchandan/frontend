import test from "node:test";
import assert from "node:assert/strict";

function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

const storage = makeStorage();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { sessionStorage: storage, localStorage: storage },
});

const { clearStoredSession, createPortalSession, getStoredSession, setStoredSession } = await import("./auth.ts");
const { apiFetch } = await import("./api.ts");

function mockFetch(response: object, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("rejects credentials when the backend refuses login", async () => {
  clearStoredSession();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch({ detail: "Incorrect username or password" }, 401);

  try {
    await assert.rejects(
      createPortalSession("unknown", "wrong-password", "Authority Officer"),
      /Incorrect username or password/,
    );
    assert.equal(getStoredSession(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stores the backend session without retaining the password", async () => {
  clearStoredSession();
  const originalFetch = globalThis.fetch;
  let submittedBody: Record<string, string> | undefined;
  globalThis.fetch = async (_input, options) => {
    submittedBody = JSON.parse(String(options?.body));
    return new Response(JSON.stringify({
      role: "authority",
      username: "authority",
      displayName: "Authority Officer",
      expiresAt: Date.now() + 300_000,
      accessToken: "signed-user-token",
    }), { headers: { "Content-Type": "application/json" } });
  };

  try {
    const session = await createPortalSession("authority", "server-verified", "Authority Officer");

    assert.equal(session.username, "authority");
    assert.equal(session.role, "authority");
    assert.equal(session.accessToken, "signed-user-token");
    assert.equal("password" in session, false);
    assert.equal(submittedBody?.["portal_role"], "Authority Officer");
    assert.equal(getStoredSession()?.username, "authority");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects a backend session for a different selected portal", async () => {
  clearStoredSession();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch({
    role: "inspector",
    username: "inspector",
    displayName: "Inspector",
    expiresAt: Date.now() + 300_000,
    accessToken: "signed-user-token",
  });

  try {
    await assert.rejects(
      createPortalSession("inspector", "password", "Authority Officer"),
      /invalid session/,
    );
    assert.equal(getStoredSession(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects a login response without an API access token", async () => {
  clearStoredSession();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch({
    role: "authority",
    username: "authority",
    displayName: "Authority Officer",
    expiresAt: Date.now() + 300_000,
  });

  try {
    await assert.rejects(
      createPortalSession("authority", "password", "Authority Officer"),
      /invalid session/,
    );
    assert.equal(getStoredSession(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects expired stored sessions", () => {
  clearStoredSession();
  setStoredSession({
    role: "authority",
    username: "authority",
    displayName: "Authority Officer",
    expiresAt: Date.now() - 1,
    accessToken: "signed-user-token",
  });

  assert.equal(getStoredSession(), null);
  assert.equal(window.sessionStorage.getItem("satark-session"), null);
});

test("clearStoredSession removes all active auth session keys", () => {
  setStoredSession({
    role: "authority",
    username: "authority",
    displayName: "Authority Officer",
    expiresAt: Date.now() + 300_000,
    accessToken: "signed-user-token",
  });
  window.sessionStorage.setItem("satark-inspector-session", JSON.stringify({ role: "inspector", username: "inspector" }));

  clearStoredSession();

  assert.equal(window.sessionStorage.getItem("satark-session"), null);
  assert.equal(window.sessionStorage.getItem("satark-inspector-session"), null);
});

test("API requests include the signed-in user's bearer token", async () => {
  setStoredSession({
    role: "inspector",
    username: "inspector",
    displayName: "Field Inspector",
    expiresAt: Date.now() + 300_000,
    accessToken: "signed-user-token",
  });
  const originalFetch = globalThis.fetch;
  let requestHeaders: Headers | undefined;
  globalThis.fetch = async (_input, options) => {
    requestHeaders = new Headers(options?.headers);
    return new Response("{}", { headers: { "Content-Type": "application/json" } });
  };

  try {
    await apiFetch("https://api.example.test/api/schedule", {
      headers: { "X-Test": "preserved" },
    });
    assert.equal(requestHeaders?.get("Authorization"), "Bearer signed-user-token");
    assert.equal(requestHeaders?.get("X-Test"), "preserved");
  } finally {
    globalThis.fetch = originalFetch;
    clearStoredSession();
  }
});
