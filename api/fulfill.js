import axios from "axios";
import { KEYS, DEMO_MODE } from "./_keys.js";
import { notifyAdmin } from "./_telegram.js";

function looksPaid(status) {
  const s = String(status || "").toLowerCase();
  return ["paid", "success", "completed", "settlement", "settled", "done"].some((k) => s.includes(k));
}

function pick(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

// planKey contoh: "panel-2gb" ... "panel-10gb", "panel-unli"
function planToLimits(planKey) {
  const s = String(planKey || "");
  if (s.includes("unli")) return { memory: 0, disk: 0, cpu: 0 };
  const m = s.match(/(\d+)gb/);
  const gb = m ? Number(m[1]) : 1;
  return { memory: gb * 1024, disk: gb * 1000, cpu: gb * 10 };
}

function pteroHeaders() {
  return {
    Authorization: `Bearer ${KEYS.pterodactyl.apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}
async function pteroGet(path, params = {}) {
  const url = `${KEYS.pterodactyl.domain}${path}`;
  const r = await axios.get(url, { headers: pteroHeaders(), params, timeout: 20000 });
  return r.data;
}
async function pteroPost(path, body) {
  const url = `${KEYS.pterodactyl.domain}${path}`;
  const r = await axios.post(url, body, { headers: pteroHeaders(), timeout: 30000 });
  return r.data;
}

function makeEmailFromUsername(username) {
  const u = String(username || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "");
  return `${u || "user"}@panel.local`;
}
function randomPassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function findUserByUsername(username) {
  const data = await pteroGet("/api/application/users", { "filter[username]": username, per_page: 50 });
  const items = data?.data || [];
  return items.length ? items[0] : null;
}

async function createUserIfMissing(username) {
  const existing = await findUserByUsername(username);
  if (existing) return { user: existing, created: false };

  const password = randomPassword();
  const email = makeEmailFromUsername(username);
  const createdUser = await pteroPost("/api/application/users", {
    email,
    username,
    first_name: String(username).slice(0, 16) || "User",
    last_name: "Danzx",
    language: "en",
    password,
    root_admin: false,
  });
  return { user: createdUser, created: true, password, email };
}

async function getEggWithVariables() {
  const data = await pteroGet(`/api/application/nests/${KEYS.pterodactyl.nestId}/eggs/${KEYS.pterodactyl.egg}`, { include: "variables" });
  return data;
}
function buildEnvironmentFromEgg(eggData) {
  const env = {};
  const variables = eggData?.attributes?.relationships?.variables?.data || [];
  for (const v of variables) {
    const a = v?.attributes || v;
    if (!a?.env_variable) continue;
    env[a.env_variable] = a.default_value ?? "";
  }
  return env;
}

async function pickAllocationId() {
  const nodes = await pteroGet("/api/application/nodes", { "filter[location_id]": KEYS.pterodactyl.locationId, per_page: 50 });
  const nodeItems = nodes?.data || [];
  if (!nodeItems.length) throw new Error(`No nodes found for locationId=${KEYS.pterodactyl.locationId}`);
  const nodeId = nodeItems[0]?.attributes?.id;

  const allocs = await pteroGet(`/api/application/nodes/${nodeId}/allocations`, { "filter[available]": 1, per_page: 50 });
  const allocItems = allocs?.data || [];
  if (!allocItems.length) throw new Error(`No available allocations on nodeId=${nodeId}`);
  return allocItems[0]?.attributes?.id;
}

async function findExistingServerByOrder(orderId) {
  const data = await pteroGet("/api/application/servers", { "filter[query]": orderId, per_page: 50 });
  const items = data?.data || [];
  return items.length ? items[0] : null;
}

async function createPanelServer({ orderId, username, planKey }) {
  const existing = await findExistingServerByOrder(orderId);
  if (existing) return { server: existing, alreadyExisted: true };

  const { user, created, password, email } = await createUserIfMissing(username);
  const userId = user?.attributes?.id ?? user?.id;
  if (!userId) throw new Error("Failed to resolve pterodactyl userId");

  const egg = await getEggWithVariables();
  const eggAttrs = egg?.attributes || {};
  const dockerImage = eggAttrs?.docker_image || "ghcr.io/parkervcp/yolks:nodejs_18";
  const startup = eggAttrs?.startup || "npm install && npm start";
  const environment = buildEnvironmentFromEgg(egg);

  const allocationId = await pickAllocationId();
  const limits = planToLimits(planKey);
  const serverName = `panel-${planKey}-${orderId}`.slice(0, 60);

  const createdServer = await pteroPost("/api/application/servers", {
    name: serverName,
    user: userId,
    egg: KEYS.pterodactyl.egg,
    docker_image: dockerImage,
    startup,
    environment,
    limits: { memory: limits.memory, swap: 0, disk: limits.disk, io: 500, cpu: limits.cpu },
    feature_limits: { databases: 0, allocations: 1, backups: 0 },
    allocation: { default: allocationId },
    deploy: { locations: [KEYS.pterodactyl.locationId], dedicated_ip: false, port_range: [] },
    start_on_completion: true,
  });

  return { server: createdServer, alreadyExisted: false, userCreated: created, userEmail: email, userPassword: password };
}

/**
 * POST /api/fulfill
 * body: { orderId, amount, productKey, planKey, inputs?: { name?: string } }
 *
 * - Verifies payment via Nevapedia invoice status
 * - panel: auto-provision via Pterodactyl
 * - reseller / partner: manual — kirim pesan konfirmasi (admin yang aktifkan akses)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount, productKey, planKey, inputs } = req.body || {};
    if (!orderId || !amount || !productKey || !planKey) {
      return res.status(400).json({ error: "orderId, amount, productKey, planKey required" });
    }

    let status;
    if (DEMO_MODE) {
      status = "paid";
    } else {
      if (!KEYS.nevapedia.apikey) {
        return res.status(500).json({
          error: "Nevapedia belum dikonfigurasi",
          detail: "Set NEVAPEDIA_APIKEY di Environment Variables, atau aktifkan DEMO_MODE=true untuk testing.",
        });
      }
      const r = await axios.get(`${KEYS.nevapedia.baseUrl}/invoice/status`, {
        params: { apikey: KEYS.nevapedia.apikey, id: orderId },
        timeout: 10000,
      });
      const body = r.data || {};
      const d = body.data || body.result || body;
      status = String(pick(d, ["status", "state"]) || pick(body, ["status", "state"]) || "unknown").toLowerCase();
    }

    if (!looksPaid(status)) {
      return res.status(402).json({ error: "Payment not confirmed", status });
    }

    if (productKey === "panel") {
      const username = String(inputs?.name || "").trim();
      if (!username) return res.status(400).json({ error: "username (name) required for panel" });

      if (DEMO_MODE) {
        return res.status(200).json({
          ok: true,
          fulfillment: {
            type: "panel",
            serverId: "demo-0001",
            identifier: "demo0001",
            userCreated: true,
            userEmail: makeEmailFromUsername(username),
            userPassword: "DEMO-MODE (tidak ada panel asli)",
          },
        });
      }

      if (!KEYS.pterodactyl.domain || !KEYS.pterodactyl.apiKey) {
        return res.status(500).json({
          error: "Pterodactyl belum dikonfigurasi",
          detail: "Set PTERO_DOMAIN & PTERO_APPKEY (Application API key) di Environment Variables.",
        });
      }

      const result = await createPanelServer({ orderId, username, planKey });
      const attrs = result?.server?.attributes || result?.server || {};

      await notifyAdmin(
        `🛒 *Order Panel Baru*\n` +
        `Order ID: \`${orderId}\`\n` +
        `Paket: ${planKey}\n` +
        `Harga: Rp${Number(amount).toLocaleString("id-ID")}\n` +
        `Username: \`${username}\`\n` +
        `Server ID: \`${attrs?.id || "-"}\`\n` +
        (result.userCreated ? `Akun baru dibuat: ${result.userEmail}` : `Akun sudah ada sebelumnya`)
      );

      return res.status(200).json({
        ok: true,
        fulfillment: {
          type: "panel",
          serverId: attrs?.id,
          identifier: attrs?.identifier,
          userCreated: !!result.userCreated,
          userEmail: result.userEmail,
          userPassword: result.userPassword,
          alreadyExisted: !!result.alreadyExisted,
        },
      });
    }

    const msgMap = {
      reseller: "Pembayaran terkonfirmasi. Akses reseller kamu akan diaktifkan oleh admin sesuai durasi paket yang dibeli.",
      partner: "Pembayaran terkonfirmasi. Akses partner kamu akan diaktifkan oleh admin — cek grup partner untuk info selanjutnya.",
    };

    await notifyAdmin(
      `🛒 *Order ${productKey === "partner" ? "Partner" : "Reseller"} Baru*\n` +
      `Order ID: \`${orderId}\`\n` +
      `Paket: ${planKey}\n` +
      `Harga: Rp${Number(amount).toLocaleString("id-ID")}\n` +
      `Username/ID: \`${inputs?.name || "-"}\`\n\n` +
      `⚠️ Perlu diaktifkan manual di sistem/bot kamu.`
    );

    return res.status(200).json({
      ok: true,
      fulfillment: { type: "manual", productKey, message: msgMap[productKey] || "Pembayaran terkonfirmasi." },
    });
  } catch (err) {
    return res.status(500).json({ error: "Fulfillment failed", detail: err?.response?.data || String(err) });
  }
}
