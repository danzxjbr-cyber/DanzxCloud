import { DEMO_MODE } from "./_keys.js";

/**
 * POST /api/qris-cancel
 * body: { orderId: string, amount: number }
 *
 * Catatan: Nevapedia tidak menyediakan endpoint cancel invoice (beda dari Pakasir).
 * Jadi ini hanya menandai transaksi dibatalkan di sisi tampilan/website kita —
 * invoice di Nevapedia sendiri akan expired otomatis sesuai masa berlakunya.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orderId, amount } = req.body || {};
  if (!orderId || !amount) return res.status(400).json({ error: "orderId & amount required" });

  return res.status(200).json({
    canceled: true,
    demo: DEMO_MODE,
    order_id: orderId,
    note: "Nevapedia tidak punya API cancel — invoice akan expired otomatis.",
  });
}
