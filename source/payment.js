// Client-side helper — no API key here, server (api/*.js) handles secrets.

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function createInvoice({ orderId, amount, meta }) {
  return requestJson("/api/qris-create", {
    method: "POST",
    body: JSON.stringify({ orderId, amount, meta }),
  });
}

export async function invoiceDetail({ orderId, amount }) {
  const qs = new URLSearchParams({ orderId, amount: String(amount) }).toString();
  return requestJson(`/api/qris-detail?${qs}`, { method: "GET" });
}

export async function cancelInvoice({ orderId, amount }) {
  return requestJson("/api/qris-cancel", {
    method: "POST",
    body: JSON.stringify({ orderId, amount }),
  });
}

export async function fulfillOrder(payload) {
  return requestJson("/api/fulfill", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
