import { DEMO_MODE } from "./_keys.js";

/**
 * GET /api/mode
 * Dipakai frontend buat nampilin banner kalau website masih jalan di DEMO_MODE
 * (supaya gak ada pembeli yang scan QR demo dan ngira itu QRIS asli).
 */
export default async function handler(req, res) {
  return res.status(200).json({ demoMode: DEMO_MODE });
}
