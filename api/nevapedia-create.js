import axios from "axios";
import QRCode from "qrcode";
import { KEYS } from "./_keys.js";

// Best-effort extraction of the EMVCo/QRIS payment string from an unknown
// gateway response shape. Nevapedia's real field names go here once known —
// add them to the `candidates` list first (fastest path), the deep search
// below is just a safety net.
function extractPaymentString(obj) {
  const candidates = [
    obj?.qr?.paymentNumber, obj?.qr?.payment_number,
    obj?.paymentNumber, obj?.payment_number,
    obj?.data?.paymentNumber, obj?.data?.payment_number,
    obj?.data?.qr_string, obj?.qr_string,
    obj?.data?.qris_string, obj?.qris_string,
    obj?.transaction?.qris_string, obj?.transaction?.payload,
    obj?.payload, obj?.data?.payload,
  ].filter(Boolean);

  for (const c of candidates) {
    const s = String(c).trim();
    if (s.startsWith("000201")) return s;
    if (s.length > 50) return s;
  }

  const stack = [obj];
  const seen = new Set();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const k of Object.keys(cur)) {
      const v = cur[k];
      if (typeof v === "string") {
        const s = v.trim();
        if (s.startsWith("000201")) return s;
        if (s.length > 100 && /\d{4,}/.test(s)) return s;
      } else if (v && typeof v === "object") {
        stack.push(v);
      }
    }
  }
  return "";
}

async function demoQr(orderId, amount) {
  const demoString = `DEMO-QRIS|${orderId}|${amount}|${Date.now()}`;
  const dataUrl = await QRCode.toDataURL(demoString, { errorCorrectionLevel: "M", margin: 1, scale: 6 });
  return { paymentNumber: demoString, dataUrl };
}

/**
 * POST /api/nevapedia-create
 * body: { orderId: string, amount: number, meta?: object }
 *
 * ⚠️ TODO (isi setelah dapat spek Nevapedia):
 * 1. Ganti path "/transaction/create" di bawah dengan endpoint create asli.
 * 2. Sesuaikan body request (nama field project/merchant/amount/order_id/api_key).
 * 3. Sesuaikan cara kirim auth (header Authorization / body api_key / signature).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount, meta } = req.body || {};
    if (!orderId || !amount) return res.status(400).json({ error: "orderId & amount required" });

    if (KEYS.demoMode) {
      const qr = await demoQr(orderId, amount);
      return res.status(200).json({ qr, raw: { demo: true } });
    }

    const r = await axios.post(
      `${KEYS.nevapedia.baseUrl}/transaction/create`,
      {
        merchant_id: KEYS.nevapedia.merchantId,
        order_id: orderId,
        amount,
        method: "qris",
        note: meta?.label || "",
      },
      {
        headers: { Authorization: `Bearer ${KEYS.nevapedia.apiKey}` },
        timeout: 15000,
      }
    );

    const raw = r.data;
    const paymentNumber = extractPaymentString(raw);
    let dataUrl = "";
    if (paymentNumber) {
      try {
        dataUrl = await QRCode.toDataURL(paymentNumber, { errorCorrectionLevel: "M", margin: 1, scale: 6 });
      } catch {
        dataUrl = "";
      }
    }

    return res.status(200).json({ qr: { paymentNumber, dataUrl }, raw });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to create QRIS via Nevapedia",
      detail: err?.response?.data || String(err),
    });
  }
}
