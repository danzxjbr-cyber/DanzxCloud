import axios from "axios";
import { KEYS } from "./_keys.js";

// Demo mode: order created more than ~20s ago is considered PAID, based on
// the timestamp embedded in the DZX-<timestamp>-XXXX orderId.
function demoStatus(orderId) {
  const ts = Number(String(orderId).split("-")[1] || 0);
  const paid = ts && Date.now() - ts > 20000;
  return { status: paid ? "PAID" : "PENDING", order_id: orderId, demo: true };
}

/**
 * GET /api/nevapedia-detail?orderId=...&amount=...
 *
 * ⚠️ TODO (isi setelah dapat spek Nevapedia): ganti path "/transaction/detail"
 * dan query/body params sesuai dokumentasi asli.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount } = req.query || {};
    if (!orderId || !amount) return res.status(400).json({ error: "orderId & amount required" });

    if (KEYS.demoMode) {
      return res.status(200).json({ transaction: demoStatus(orderId) });
    }

    const r = await axios.get(`${KEYS.nevapedia.baseUrl}/transaction/detail`, {
      params: { merchant_id: KEYS.nevapedia.merchantId, order_id: orderId, amount },
      headers: { Authorization: `Bearer ${KEYS.nevapedia.apiKey}` },
      timeout: 15000,
    });

    return res.status(200).json(r.data);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to get transaction detail from Nevapedia",
      detail: err?.response?.data || String(err),
    });
  }
}
