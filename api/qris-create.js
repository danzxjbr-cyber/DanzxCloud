import axios from "axios";
import QRCode from "qrcode";
import { KEYS, DEMO_MODE } from "./_keys.js";

function pick(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

/**
 * POST /api/qris-create
 * body: { orderId: string, amount: number, meta?: object }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount } = req.body || {};
    if (!orderId || !amount) return res.status(400).json({ error: "orderId & amount required" });

    let paymentNumber;
    let raw;

    if (DEMO_MODE) {
      paymentNumber = `DEMO-QRIS-${orderId}-${amount}`;
      raw = { demo: true, order_id: orderId, amount, status: "pending" };
    } else {
      if (!KEYS.nevapedia.apikey) {
        return res.status(500).json({
          error: "Nevapedia belum dikonfigurasi",
          detail: "Set NEVAPEDIA_APIKEY di Environment Variables, atau aktifkan DEMO_MODE=true untuk testing.",
        });
      }
      let r;
      try {
        r = await axios.get(`${KEYS.nevapedia.baseUrl}/invoice`, {
          params: { apikey: KEYS.nevapedia.apikey, amount, order_id: orderId },
          timeout: 15000,
        });
      } catch (e) {
        return res.status(502).json({
          error: "Gagal membuat invoice Nevapedia",
          detail: e?.response?.data || e.message,
        });
      }
      const body = r.data || {};
      if (body.success === false) {
        return res.status(502).json({ error: "Nevapedia menolak permintaan", detail: body.message || body });
      }
      const d = body.data || body.result || body;
      paymentNumber = pick(d, ["qris", "qr_string", "qris_string", "payment_number", "qris_image", "qr_image", "qr_url"]);
      if (!paymentNumber) {
        return res.status(502).json({ error: "Format respons Nevapedia tidak dikenali", detail: body });
      }
      raw = body;
    }

    let dataUrl = "";
    try {
      dataUrl = await QRCode.toDataURL(paymentNumber, { errorCorrectionLevel: "M", margin: 1, scale: 6 });
    } catch {
      dataUrl = "";
    }

    return res.status(200).json({
      qr: { paymentNumber, dataUrl },
      raw,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create invoice", detail: err?.response?.data || String(err) });
  }
}
