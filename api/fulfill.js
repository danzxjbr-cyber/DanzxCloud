import axios from "axios";
import { KEYS } from "./_keys.js";

function normalizeStatus(s) { return String(s || "").toUpperCase(); }
function looksPaid(status) {
  const s = normalizeStatus(status);
  return ["PAID", "SUCCESS", "SETTLED", "SETTLEMENT", "COMPLETED", "DONE", "BERHASIL", "LUNAS"].some((k) => s.includes(k));
}

function planToLimits(planKey) {
  // Memory in MB, disk in MB, cpu as percentage (100 = 1 core).
  const m = {
    "panel-1gb": { memory: 1024, disk: 10240, cpu: 100 },
    "panel-2gb": { memory: 2048, disk: 20480, cpu: 150 },
    "panel-3gb": { memory: 3072, disk: 30720, cpu: 175 },
    "panel-4gb": { memory: 4096, disk: 40960, cpu: 200 },
    "panel-unlimited": { memory: 0, disk: 0, cpu: 0 }, // 0 = unlimited in Pterodactyl
  };
  return m[planKey] || { memory: 1024, disk: 10240, cpu: 100 };
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
  return `${u || "user"}@danzxcloud.buyer`;
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
  const first = String(username).slice(0, 16) || "User";

  const createdUser = await pteroPost("/api/application/users", {
    email,
    username,
    first_name: first,
    last_name: "DanzxCloud",
    language: "en",
    password,
    root_admin: false,
  });

  return { user: createdUser, created: true, password, email };
}

async function getEggWithVariables() {
  const nestId = KEYS.pterodactyl.nestId;
  const eggId = KEYS.pterodactyl.egg;
  return pteroGet(`/api/application/nests/${nestId}/eggs/${eggId}`, { include: "variables" });
}

function buildEnvironmentFromEgg(eggData) {
  const env = {};
  const variables = eggData?.attributes?.relationships?.variables?.data || eggData?.relationships?.variables?.data || [];
  for (const v of variables) {
    const a = v?.attributes || v;
    const key = a?.env_variable;
    if (!key) continue;
    env[key] = a?.default_value ?? "";
  }
  return env;
}

async function pickAllocationId() {
  const locationId = KEYS.pterodactyl.locationId;
  const nodes = await pteroGet("/api/application/nodes", { "filter[location_id]": locationId, per_page: 50 });
  const nodeItems = nodes?.data || [];
  if (!nodeItems.length) throw new Error(`No nodes found for locationId=${locationId}`);

  const nodeId = nodeItems[0]?.attributes?.id;
  if (!nodeId) throw new Error("Failed to resolve nodeId");

  const allocs = await pteroGet(`/api/application/nodes/${nodeId}/allocations`, { "filter[available]": 1, per_page: 50 });
  const allocItems = allocs?.data || [];
  if (!allocItems.length) throw new Error(`No available allocations on nodeId=${nodeId}`);

  const allocationId = allocItems[0]?.attributes?.id;
  if (!allocationId) throw new Error("Failed to resolve allocationId");
  return allocationId;
}

async function findExistingServerByOrder(orderId) {
  const data = await pteroGet("/api/application/servers", { "filter[query]": orderId, per_page: 50 });
  const items = data?.data || [];
  return items.length ? items[0] : null;
}

async function createPanelServer({ orderId, panelName, planKey }) {
  const existing = await findExistingServerByOrder(orderId);
  if (existing) return { server: existing, alreadyExisted: true };

  const { user, created, password, email } = await createUserIfMissing(panelName);
  const userId = user?.attributes?.id ?? user?.id;
  if (!userId) throw new Error("Failed to resolve pterodactyl userId");

  const egg = await getEggWithVariables();
  const eggAttrs = egg?.attributes || {};
  const dockerImage = eggAttrs?.docker_image || "ghcr.io/pterodactyl/yolks:java_17";
  const startup = eggAttrs?.startup || "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar";
  const environment = buildEnvironmentFromEgg(egg);

  const allocationId = await pickAllocationId();
  const limits = planToLimits(planKey);
  const serverName = `panel-${planKey}-${orderId}`.slice(0, 60);

  const payload = {
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
  };

  const createdServer = await pteroPost("/api/application/servers", payload);
  return {
    server: createdServer,
    alreadyExisted: false,
    userCreated: created,
    userEmail: email,
    userPassword: password,
  };
}

async function notifyAdminTelegram(text) {
  const { botToken, adminChatId } = KEYS.telegram;
  if (!botToken || !adminChatId) return false;
  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: adminChatId,
      text,
      parse_mode: "HTML",
    }, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/fulfill
 * body: { orderId, amount, productKey, planKey, inputs: { panelName?, telegram? } }
 *
 * - Verifies payment via Nevapedia (or demo mode)
 * - productKey "panel": creates/find user + server in Pterodactyl
 * - productKey "reseller" / "partner": notifies admin group via Telegram so
 *   the role can be applied in partner.json / reseller storage by the bot.
 *   Swap this for a direct call into your bot's internal API if you expose one.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount, productKey, planKey, inputs } = req.body || {};
    if (!orderId || !amount || !productKey || !planKey) {
      return res.status(400).json({ error: "orderId, amount, productKey, planKey required" });
    }

    // 1) Verify payment with Nevapedia
    let status = "PAID";
    if (!KEYS.demoMode) {
      const txr = await axios.get(`${KEYS.nevapedia.baseUrl}/transaction/detail`, {
        params: { merchant_id: KEYS.nevapedia.merchantId, order_id: orderId, amount },
        headers: { Authorization: `Bearer ${KEYS.nevapedia.apiKey}` },
        timeout: 15000,
      });
      const tx = txr.data?.transaction || txr.data?.data || txr.data;
      status = tx?.status || tx?.transaction_status || tx?.state || "UNKNOWN";
      if (!looksPaid(status)) {
        return res.status(402).json({ error: "Payment not confirmed", status, tx });
      }
    }

    // 2) Fulfill based on product
    if (productKey === "panel") {
      const panelName = String(inputs?.panelName || "").trim();
      if (!panelName) return res.status(400).json({ error: "panelName required" });

      const result = await createPanelServer({ orderId, panelName, planKey });
      const server = result?.server;
      const attrs = server?.attributes || server || {};
      return res.status(200).json({
        ok: true,
        fulfillment: {
          type: "panel",
          serverId: attrs?.id,
          uuid: attrs?.uuid,
          identifier: attrs?.identifier,
          name: attrs?.name,
          userCreated: !!result.userCreated,
          userEmail: result.userEmail,
          userPassword: result.userPassword,
          alreadyExisted: !!result.alreadyExisted,
        },
      });
    }

    if (productKey === "reseller" || productKey === "partner") {
      const telegram = String(inputs?.telegram || "").trim().replace(/^@/, "");
      if (!telegram) return res.status(400).json({ error: "telegram username required" });

      const roleLabel = productKey === "partner" ? "PARTNER" : "RESELLER";
      const actionLabel = String(planKey).includes("extend") ? "PERPANJANG" : "JOIN";

      const notified = await notifyAdminTelegram(
        `🟢 <b>${actionLabel} ${roleLabel}</b>\n` +
        `Order: <code>${orderId}</code>\n` +
        `User: @${telegram}\n` +
        `Amount: Rp${Number(amount).toLocaleString("id-ID")}\n` +
        `Plan: ${planKey}\n\n` +
        `Aktifkan role lewat @CpanelDanzxbot.`
      );

      return res.status(200).json({
        ok: true,
        fulfillment: {
          type: "role",
          role: productKey,
          telegram,
          action: actionLabel,
          adminNotified: notified,
          message: notified
            ? "Admin sudah diberi tahu, role akan diaktifkan lewat bot."
            : "Pembayaran terkonfirmasi. Hubungi admin untuk aktivasi role jika belum otomatis.",
        },
      });
    }

    return res.status(200).json({
      ok: true,
      fulfillment: { type: "manual", productKey, message: "Pembayaran terkonfirmasi. Lanjutkan proses sesuai sistem kamu." },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Fulfillment failed",
      detail: err?.response?.data || String(err),
    });
  }
}
