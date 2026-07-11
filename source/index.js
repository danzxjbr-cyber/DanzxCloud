import { BRAND, PRODUCTS, CURRENCY, UX, LINKS } from "./config.js";
import { createQris, qrisDetail, qrisCancel, fulfillOrder } from "./nevapedia.js";

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function formatIDR(amount) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: CURRENCY,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `Rp ${amount}`;
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function iconSvg(kind) {
  const c = 'class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"';
  switch (kind) {
    case "panel":
      return `<svg ${c} viewBox="0 0 24 24"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/><path stroke-linecap="round" d="M7 4v16"/></svg>`;
    case "reseller":
      return `<svg ${c} viewBox="0 0 24 24"><path stroke-linejoin="round" d="M16 11a4 4 0 1 0-8 0"/><path stroke-linecap="round" d="M4 20c1.5-4 14.5-4 16 0"/><path stroke-linecap="round" d="M18 8h3M19.5 6.5v3"/></svg>`;
    case "partner":
      return `<svg ${c} viewBox="0 0 24 24"><path stroke-linejoin="round" d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4Z"/><path stroke-linecap="round" d="M9.5 12.5l1.7 1.7 3.8-4.2"/></svg>`;
    default:
      return `<svg ${c} viewBox="0 0 24 24"><path d="M4 12h16"/></svg>`;
  }
}

function toast(message, kind = "info") {
  const root = $("#toastRoot");
  const id = `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const color =
    kind === "success" ? "border-lime text-lime"
    : kind === "error" ? "border-magenta text-magenta"
    : "border-cyan text-cyan";

  const el = document.createElement("div");
  el.id = id;
  el.className = `brutal-flat px-4 py-3 border-3 bg-[#101018] ${color}`;
  el.style.borderWidth = "3px";
  el.innerHTML = `<div class="text-sm font-mono font-medium">${escapeHtml(message)}</div>`;
  root.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    setTimeout(() => el.remove(), 220);
  }, 2800);
}

function setCatActive(cat) {
  $all(".catBtn").forEach((a) => {
    a.classList.toggle("tab-active", a.dataset.cat === cat);
  });
}

function setPayStatus({ kind, text }) {
  const dot = $("#payDot");
  const label = $("#payStatusText");
  label.textContent = text;

  dot.className = "h-2 w-2";
  const map = {
    idle: "bg-[#8d8da3]",
    loading: "bg-cyan",
    pending: "bg-amber",
    success: "bg-lime",
    canceled: "bg-magenta",
    error: "bg-magenta",
  };
  dot.classList.add(map[kind] || "bg-[#8d8da3]");
  if (kind === "loading" || kind === "pending") dot.classList.add("pulse");
}

function looksPaid(status = "") {
  const s = String(status).toLowerCase();
  return ["paid", "success", "completed", "settlement", "done", "lunas", "berhasil"].some((k) => s.includes(k));
}
function looksPending(status = "") {
  const s = String(status).toLowerCase();
  return ["pending", "process", "waiting", "unpaid", "menunggu"].some((k) => s.includes(k));
}

function inputBlockFor(product) {
  const reqPanel = product.requires?.panelName;
  const reqTele = product.requires?.telegram;

  return `
    ${reqPanel ? `
      <div class="mt-5">
        <div class="text-[10px] font-mono uppercase text-[#8d8da3]">Nama panel (jadi username kamu)</div>
        <input data-input="${product.key}:panelName" type="text" placeholder="contoh: danzxstore"
          class="mt-2 w-full px-4 py-3 bg-black/40 border-3 border-[#f4f4f9] focus:border-cyan outline-none font-mono text-sm" style="border-width:3px" />
      </div>
    ` : ""}

    ${reqTele ? `
      <div class="mt-5">
        <div class="text-[10px] font-mono uppercase text-[#8d8da3]">Username Telegram (tanpa @)</div>
        <input data-input="${product.key}:telegram" type="text" placeholder="contoh: danzxofficial74"
          class="mt-2 w-full px-4 py-3 bg-black/40 border-3 border-[#f4f4f9] focus:border-magenta outline-none font-mono text-sm" style="border-width:3px" />
      </div>
    ` : ""}
  `;
}

function planSubline(product, p) {
  if (product.kind === "panel") {
    return p.ramGb === 0 ? "Request-based · Fair Use" : `${p.ramGb} GB RAM`;
  }
  if (product.kind === "role") {
    return p.isExtend ? `Perpanjang akses ${p.period}` : `Aktivasi role ${p.period}`;
  }
  return "";
}

function buildSection(product) {
  const cards = product.plans.map((p) => {
    const badge = p.badge ? `<span class="chip ${p.isExtend ? 'text-amber' : 'text-lime'}">${escapeHtml(p.badge)}</span>` : "";
    return `
      <button type="button"
        data-plan="${product.key}:${p.key}"
        class="planCard text-left brutal-flat p-4 hover:border-cyan transition-colors">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-display font-bold uppercase">${escapeHtml(p.label)}</div>
            <div class="mt-1 text-xs font-mono text-[#8d8da3]">${escapeHtml(planSubline(product, p))}</div>
          </div>
          ${badge}
        </div>
        <div class="mt-4 text-xl font-display font-extrabold tracking-tight text-cyan">${escapeHtml(formatIDR(p.price))}</div>
      </button>
    `;
  }).join("");

  const notes = (product.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  return `
    <section id="${escapeHtml(product.key)}" class="scroll-mt-40">
      <div class="brutal ${product.kind === 'panel' ? 'brutal-cyan' : product.key === 'partner' ? 'brutal-magenta' : 'brutal-lime'} p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div class="flex items-start gap-4">
            <div class="h-12 w-12 border-3 border-[#f4f4f9] bg-black flex items-center justify-center shrink-0" style="border-width:3px">
              ${iconSvg(product.icon)}
            </div>
            <div>
              <h3 class="font-display font-extrabold uppercase text-xl sm:text-2xl">${escapeHtml(product.title)}</h3>
              <p class="mt-1 text-sm text-[#c4c4d4]">${escapeHtml(product.subtitle)}</p>
            </div>
          </div>
          <div class="text-xs font-mono text-[#8d8da3] shrink-0">
            <div class="uppercase tracking-widest text-[10px]">Pilih paket</div>
            <div class="mt-1">klik kartu ↓</div>
          </div>
        </div>

        ${inputBlockFor(product)}

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${cards}
        </div>

        <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div class="lg:col-span-2">
            <div class="brutal-flat p-4">
              <div class="text-[10px] font-mono uppercase text-[#8d8da3]">Catatan</div>
              <ul class="mt-2 list-disc pl-5 text-sm text-[#c4c4d4] space-y-1">${notes}</ul>
            </div>
          </div>
          <div>
            <button
              data-buy="${product.key}"
              class="buyBtn brutal-btn w-full px-5 py-3.5 bg-[#1a1a24] text-[#66667a] border-[#3a3a48]"
              disabled>
              Beli
            </button>
            <div class="mt-2 text-[11px] font-mono text-[#8d8da3]">
              tombol aktif setelah input & paket valid
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initApp() {
  $("#year").textContent = String(new Date().getFullYear());

  const root = $("#productsRoot");
  root.innerHTML = PRODUCTS.map(buildSection).join("");

  const state = {
    selected: {},
    inputs: {},
    order: null,
    pollTimer: null,
  };
  PRODUCTS.forEach((p) => { state.selected[p.key] = null; });

  function getProduct(key) { return PRODUCTS.find((p) => p.key === key); }
  function getPlan(productKey, planKey) {
    const p = getProduct(productKey);
    return p?.plans?.find((pl) => pl.key === planKey) || null;
  }

  function isValid(productKey) {
    const product = getProduct(productKey);
    const sel = state.selected[productKey];
    if (!product || !sel) return false;

    if (product.requires?.panelName) {
      const v = (state.inputs[`${productKey}:panelName`] || "").trim();
      if (!v) return false;
    }
    if (product.requires?.telegram) {
      const v = (state.inputs[`${productKey}:telegram`] || "").trim();
      if (!v) return false;
    }
    return true;
  }

  function updateBuyButton(productKey) {
    const btn = $(`[data-buy="${productKey}"]`);
    if (!btn) return;
    const ok = isValid(productKey);
    btn.disabled = !ok;
    btn.classList.toggle("bg-[#1a1a24]", !ok);
    btn.classList.toggle("text-[#66667a]", !ok);
    btn.classList.toggle("border-[#3a3a48]", !ok);
    btn.classList.toggle("bg-lime", ok);
    btn.classList.toggle("text-black", ok);
    btn.classList.toggle("border-[#f4f4f9]", ok);
  }

  PRODUCTS.forEach((p) => updateBuyButton(p.key));

  $all(".planCard").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [productKey, planKey] = (btn.dataset.plan || "").split(":");
      if (!productKey || !planKey) return;

      const section = $(`#${productKey}`);
      $all(".planCard", section).forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");

      state.selected[productKey] = planKey;
      updateBuyButton(productKey);

      const plan = getPlan(productKey, planKey);
      toast(`Paket dipilih: ${plan?.label || planKey}`, "info");
    });
  });

  $all("input[data-input]").forEach((inp) => {
    inp.addEventListener("input", () => {
      state.inputs[inp.dataset.input] = inp.value;
      const [productKey] = inp.dataset.input.split(":");
      updateBuyButton(productKey);
    });
  });

  $all(".catBtn").forEach((a) => {
    a.addEventListener("click", () => setCatActive(a.dataset.cat));
  });
  setCatActive("panel");

  const paymentEmpty = $("#paymentEmpty");
  const paymentActive = $("#paymentActive");
  const qrImage = $("#qrImage");
  const paymentString = $("#paymentString");
  const orderSummary = $("#orderSummary");
  const amountBadge = $("#amountBadge");
  const statusDetails = $("#statusDetails");

  function renderRoleFulfillment(f, product) {
    const roleLabel = product.key === "partner" ? "Partner" : "Reseller";
    return `
      <div class="mt-5 brutal-flat p-4">
        <div class="font-display font-bold uppercase text-lime">Role ${roleLabel} diproses ✅</div>
        <div class="mt-2 text-sm">Bot akan aktifkan role kamu dalam beberapa menit.</div>
        <div class="mt-1 text-sm">Cek status via <span class="text-cyan">${escapeHtml(BRAND.handle)}</span> dengan perintah <span class="text-lime">/mystatus</span>.</div>
        ${f?.message ? `<div class="mt-2 text-xs text-[#8d8da3]">${escapeHtml(String(f.message))}</div>` : ""}
      </div>
    `;
  }

  function renderPanelFulfillment(f) {
    return `
      <div class="mt-5 brutal-flat p-4">
        <div class="font-display font-bold uppercase text-lime">Server Panel dibuat ✅</div>
        ${f?.serverId ? `<div class="mt-2 text-sm">Server ID: <span class="text-cyan">${escapeHtml(String(f.serverId))}</span></div>` : ""}
        ${f?.identifier ? `<div class="mt-1 text-sm">Identifier: <span class="text-cyan">${escapeHtml(String(f.identifier))}</span></div>` : ""}
        ${f?.userCreated ? `
          <div class="mt-3 text-sm">Akun panel dibuat otomatis:</div>
          <div class="mt-1 text-sm">Email: <span class="text-cyan">${escapeHtml(String(f.userEmail || ""))}</span></div>
          ${f.userPassword ? `<div class="mt-1 text-sm">Password: <span class="text-magenta">${escapeHtml(String(f.userPassword))}</span></div>` : ""}
          <div class="mt-2 text-[11px] text-[#8d8da3]">⚠️ simpan password ini sekarang, tidak akan ditampilkan lagi</div>
        ` : `<div class="mt-3 text-xs text-[#8d8da3]">Akun panel sudah ada, server baru dibuat untuk user tersebut.</div>`}
      </div>
    `;
  }

  async function refreshStatus() {
    if (!state.order) return;
    try {
      setPayStatus({ kind: "loading", text: "Cek status..." });
      const data = await qrisDetail({ orderId: state.order.orderId, amount: state.order.amount });
      const tx = data?.transaction || data?.data || data;
      const status = tx?.status || tx?.transaction_status || tx?.state || "UNKNOWN";

      if (looksPaid(status)) {
        setPayStatus({ kind: "success", text: "Pembayaran berhasil" });
        statusDetails.innerHTML = `
          <div class="font-display font-bold uppercase text-lime">Pembayaran terkonfirmasi ✅</div>
          <div class="mt-1">Order ID: <span class="text-cyan">${escapeHtml(state.order.orderId)}</span></div>
        `;

        try {
          const key = `fulfilled:${state.order.orderId}`;
          const already = sessionStorage.getItem(key);
          if (!already) {
            sessionStorage.setItem(key, "1");
            const product = getProduct(state.order.productKey);
            const payload = {
              orderId: state.order.orderId,
              amount: state.order.amount,
              productKey: state.order.productKey,
              planKey: state.order.planKey,
              inputs: state.order.inputs || {},
            };
            const fr = await fulfillOrder(payload);
            const f = fr?.fulfillment || {};
            if (f?.type === "panel") {
              statusDetails.innerHTML += renderPanelFulfillment(f);
            } else if (f?.type === "role") {
              statusDetails.innerHTML += renderRoleFulfillment(f, product);
            } else if (f?.message) {
              statusDetails.innerHTML += `
                <div class="mt-5 brutal-flat p-4">
                  <div class="font-display font-bold uppercase">Fulfillment</div>
                  <div class="mt-1 text-sm text-[#c4c4d4]">${escapeHtml(String(f.message))}</div>
                </div>
              `;
            }
          }
        } catch (e) {
          // ignore fulfillment errors; status page still shows paid
        }

        stopAutoPoll();
        toast("Pembayaran sukses!", "success");
        return;
      }

      if (looksPending(status)) {
        setPayStatus({ kind: "pending", text: "Menunggu pembayaran" });
        statusDetails.innerHTML = `
          <div class="font-display font-bold uppercase">Status: ${escapeHtml(status)}</div>
          <div class="mt-1 text-xs text-[#8d8da3]">klik refresh lagi setelah kamu bayar</div>
        `;
        return;
      }

      setPayStatus({ kind: "pending", text: `Status: ${status}` });
      statusDetails.innerHTML = `<div class="font-display font-bold uppercase">Status: ${escapeHtml(status)}</div>`;
    } catch (err) {
      setPayStatus({ kind: "error", text: "Gagal cek status" });
      statusDetails.innerHTML = `<div class="text-magenta">Error: ${escapeHtml(err.message || "Unknown")}</div>`;
      toast(err.message || "Gagal cek status", "error");
    }
  }

  function stopAutoPoll() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  function startAutoPoll() {
    stopAutoPoll();
    state.pollTimer = setInterval(() => {
      if (document.hidden) return;
      refreshStatus().catch(() => {});
    }, UX.autoPollMs);
  }

  async function cancelOrder() {
    if (!state.order) return;
    try {
      setPayStatus({ kind: "loading", text: "Membatalkan..." });
      await qrisCancel({ orderId: state.order.orderId, amount: state.order.amount });
      setPayStatus({ kind: "canceled", text: "Dibatalkan" });
      toast("Transaksi dibatalkan.", "info");
    } catch (err) {
      setPayStatus({ kind: "error", text: "Gagal batal" });
      toast(err.message || "Gagal batal", "error");
    } finally {
      stopAutoPoll();
      state.order = null;
      paymentActive.classList.add("hidden");
      paymentEmpty.classList.remove("hidden");
      qrImage.removeAttribute("src");
      paymentString.textContent = "";
      orderSummary.innerHTML = "";
      amountBadge.innerHTML = "";
      statusDetails.innerHTML = "";
      setPayStatus({ kind: "idle", text: "Belum ada transaksi" });
    }
  }

  $("#refreshStatus").addEventListener("click", () => refreshStatus());
  $("#cancelPayment").addEventListener("click", () => cancelOrder());
  $("#copyPayment").addEventListener("click", async () => {
    const text = paymentString.textContent || "";
    if (!text) return toast("Belum ada payment string.", "error");
    try {
      await navigator.clipboard.writeText(text);
      toast("Payment string tersalin.", "success");
    } catch {
      toast("Gagal copy (izin browser).", "error");
    }
  });

  function bindBuyButtons() {
    $all(".buyBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const productKey = btn.dataset.buy;
        const product = getProduct(productKey);
        if (!product) return;

        if (!isValid(productKey)) {
          toast("Lengkapi input & pilih paket dulu.", "error");
          return;
        }

        const planKey = state.selected[productKey];
        const plan = getPlan(productKey, planKey);

        const orderId = `DZX-${Date.now()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
        const amount = plan.price;

        const panelName = product.requires?.panelName ? (state.inputs[`${productKey}:panelName`] || "").trim() : undefined;
        const telegram = product.requires?.telegram ? (state.inputs[`${productKey}:telegram`] || "").trim() : undefined;

        paymentEmpty.classList.add("hidden");
        paymentActive.classList.remove("hidden");
        qrImage.removeAttribute("src");
        paymentString.textContent = "";
        orderSummary.innerHTML = `
          <div><span class="text-[#8d8da3]">Produk:</span> ${escapeHtml(product.title)}</div>
          <div><span class="text-[#8d8da3]">Paket:</span> ${escapeHtml(plan.label)}</div>
          ${panelName ? `<div><span class="text-[#8d8da3]">Nama Panel:</span> ${escapeHtml(panelName)}</div>` : ""}
          ${telegram ? `<div><span class="text-[#8d8da3]">Telegram:</span> @${escapeHtml(telegram)}</div>` : ""}
          <div class="pt-2 perforation"><span class="text-[#8d8da3]">Order ID:</span> ${escapeHtml(orderId)}</div>
        `;
        amountBadge.innerHTML = `Total ${escapeHtml(formatIDR(amount))}`;
        statusDetails.innerHTML = `<div class="text-sm text-[#c4c4d4]">Membuat QRIS…</div>`;
        setPayStatus({ kind: "loading", text: "Membuat QRIS..." });

        $("#payment").scrollIntoView({ behavior: "smooth", block: "start" });

        const meta = {
          product: productKey,
          plan: planKey,
          label: plan.label,
          panelName,
          telegram,
          role: plan.role,
          months: plan.months,
          isExtend: !!plan.isExtend,
        };

        try {
          const data = await createQris({ orderId, amount, meta });
          const qr = data?.qr || {};
          const paymentNumber = qr?.paymentNumber || qr?.payment_number || "";
          const dataUrl = qr?.dataUrl || qr?.data_url || "";

          const inputs = { panelName: panelName || "", telegram: telegram || "" };
          state.order = { orderId, amount, productKey, planKey, meta, paymentNumber, inputs };

          if (dataUrl) qrImage.src = dataUrl;
          paymentString.textContent = paymentNumber || "(Tidak ada payment string)";
          setPayStatus({ kind: "pending", text: "Menunggu pembayaran" });
          statusDetails.innerHTML = `
            <div class="font-display font-bold uppercase">Scan QR untuk bayar</div>
            <div class="mt-1 text-xs text-[#8d8da3]">klik Refresh Status setelah bayar</div>
          `;
          toast("QRIS siap. Silakan bayar.", "success");
          startAutoPoll();
        } catch (err) {
          setPayStatus({ kind: "error", text: "Gagal membuat QRIS" });
          statusDetails.innerHTML = `<div class="text-magenta">Error: ${escapeHtml(err.message || "Unknown")}</div>`;
          toast(err.message || "Gagal membuat QRIS", "error");
        }
      });
    });
  }

  bindBuyButtons();
}
