import { BRAND, PRODUCTS, TIERS, LINKS, UX } from "./config.js";
import { createInvoice, invoiceDetail, cancelInvoice, fulfillOrder } from "./payment.js";

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function formatIDR(n) {
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `Rp${n}`;
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

function toast(message, kind = "info") {
  const root = $("#toastRoot");
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    setTimeout(() => el.remove(), 220);
  }, 2800);
}

function arrowIcon() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ---------- Access ladder (signature element) ----------
function renderLadder() {
  const root = $("#ladder");
  const order = ["panel", "reseller", "partner"];
  root.innerHTML = order.map((tierKey, i) => {
    const tier = TIERS[tierKey];
    const product = PRODUCTS.find((p) => p.tier === tierKey);
    const cheapest = product ? Math.min(...product.plans.map((p) => p.price)) : 0;
    const descMap = {
      panel: "Server sendiri buat bot atau aplikasimu, aktif otomatis.",
      reseller: "Jual ulang panel, harga & untung kamu yang atur.",
      partner: "Benefit terbesar, support paling prioritas.",
    };
    return `
      <a href="#${tierKey}" class="rung reveal" style="--rung-color:${tier.color}; transition-delay:${i * 90}ms">
        <div class="rung-step">Tahap 0${i + 1}</div>
        <div class="rung-title">${escapeHtml(tier.label)}</div>
        <div class="rung-desc">${escapeHtml(descMap[tierKey] || "")}</div>
        <div class="rung-price">mulai ${escapeHtml(formatIDR(cheapest))}</div>
        ${i < order.length - 1 ? `<span class="rung-arrow">${arrowIcon()}</span>` : ""}
      </a>
    `;
  }).join("");
}

// ---------- Product sections ----------
function planCard(product, plan) {
  const tier = TIERS[product.tier];
  const color = plan.dot || tier.color;
  return `
    <button type="button" class="plan-card" data-plan="${product.key}:${plan.key}" style="--card-color:${color}">
      <div class="plan-top">
        <div class="plan-label">${plan.dot ? `<span class="plan-dot" style="background:${plan.dot}"></span>` : ""}${escapeHtml(plan.label)}</div>
        ${plan.badge ? `<span class="plan-badge">${escapeHtml(plan.badge)}</span>` : ""}
      </div>
      <div class="plan-spec">${escapeHtml(plan.spec || "")}</div>
      <div class="plan-price">${escapeHtml(formatIDR(plan.price))}</div>
    </button>
  `;
}

function productSection(product) {
  const tier = TIERS[product.tier];
  const notes = (product.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");
  return `
    <section id="${escapeHtml(product.key)}" class="product-section reveal wrap">
      <div class="product-head">
        <div>
          <div class="product-title-row">
            <span class="tier-chip" style="--chip-color:${tier.color}">${escapeHtml(tier.label)}</span>
          </div>
          <h2 class="product-title">${escapeHtml(product.title)}</h2>
          <div class="product-sub">${escapeHtml(product.subtitle)}</div>
        </div>
      </div>

      ${product.requires?.name ? `
        <div class="field">
          <label>${escapeHtml(product.nameLabel || "Nama / Username")}</label>
          <input data-input="${product.key}:name" type="text" placeholder="${escapeHtml(product.namePlaceholder || "")}" autocomplete="off" />
        </div>
      ` : ""}

      <div class="plan-grid">
        ${product.plans.map((p) => planCard(product, p)).join("")}
      </div>

      ${notes ? `<div class="notes-box"><ul>${notes}</ul></div>` : ""}

      <div class="buy-row">
        <button class="buy-btn" data-buy="${product.key}" disabled>Beli</button>
        <span class="buy-hint">pilih paket${product.requires?.name ? " & isi username" : ""} dulu</span>
      </div>
    </section>
  `;
}

async function checkDemoMode() {
  try {
    const res = await fetch("/api/mode");
    const data = await res.json();
    if (data?.demoMode) {
      $("#demoBanner").style.display = "block";
    }
  } catch {
    // kalau gagal cek, diamkan saja — tidak kritikal untuk render halaman
  }
}

export function initApp() {
  $("#year").textContent = String(new Date().getFullYear());
  renderLadder();
  checkDemoMode();

  const root = $("#productsRoot");
  root.innerHTML = PRODUCTS.map(productSection).join("");

  const state = {
    selected: Object.fromEntries(PRODUCTS.map((p) => [p.key, null])),
    inputs: {},
    order: null,
    pollTimer: null,
  };

  function getProduct(key) { return PRODUCTS.find((p) => p.key === key); }
  function getPlan(productKey, planKey) {
    return getProduct(productKey)?.plans?.find((pl) => pl.key === planKey) || null;
  }

  function isValid(productKey) {
    const product = getProduct(productKey);
    if (!product || !state.selected[productKey]) return false;
    if (product.requires?.name) {
      const v = (state.inputs[`${productKey}:name`] || "").trim();
      if (!v) return false;
    }
    return true;
  }

  function updateBuyButton(productKey) {
    const btn = $(`[data-buy="${productKey}"]`);
    const hint = btn?.nextElementSibling;
    const ok = isValid(productKey);
    btn.disabled = !ok;
    btn.classList.toggle("ready", ok);
    if (hint) hint.style.display = ok ? "none" : "";
  }

  PRODUCTS.forEach((p) => updateBuyButton(p.key));

  $all(".plan-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [productKey, planKey] = (btn.dataset.plan || "").split(":");
      if (!productKey || !planKey) return;
      const section = $(`#${productKey}`);
      $all(".plan-card", section).forEach((c) => c.classList.remove("selected"));
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

  // nav active state on scroll
  const tabs = $all(".tab");
  const sections = PRODUCTS.map((p) => document.getElementById(p.key)).filter(Boolean);
  function setActiveTab(key) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.cat === key));
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) setActiveTab(e.target.id);
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));

  // scroll-reveal animation
  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in-view");
        revealIo.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $all(".reveal").forEach((el) => revealIo.observe(el));

  // ---------- payment ----------
  const paymentEmpty = $("#paymentEmpty");
  const paymentActive = $("#paymentActive");
  const qrImage = $("#qrImage");
  const paymentString = $("#paymentString");
  const orderReceipt = $("#orderReceipt");
  const statusDetails = $("#statusDetails");
  const payStatus = $("#payStatus");
  const payStatusText = $("#payStatusText");

  function setPayStatus(kind, text) {
    payStatus.className = `status-pill ${kind}`;
    payStatusText.textContent = text;
  }

  function looksPaid(status = "") {
    const s = String(status).toLowerCase();
    return ["paid", "success", "completed", "settlement", "settled", "done"].some((k) => s.includes(k));
  }
  function looksPending(status = "") {
    const s = String(status).toLowerCase();
    return ["pending", "process", "waiting", "unpaid"].some((k) => s.includes(k));
  }

  function stopAutoPoll() {
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
  }
  function startAutoPoll() {
    stopAutoPoll();
    state.pollTimer = setInterval(() => {
      if (document.hidden) return;
      refreshStatus().catch(() => {});
    }, UX.autoPollMs);
  }

  async function runFulfillment() {
    const key = `fulfilled:${state.order.orderId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const payload = {
      orderId: state.order.orderId,
      amount: state.order.amount,
      productKey: state.order.productKey,
      planKey: state.order.planKey,
      inputs: state.order.inputs || {},
    };

    try {
      const fr = await fulfillOrder(payload);
      const f = fr?.fulfillment || {};

      if (f.type === "panel") {
        statusDetails.innerHTML += `
          <div class="fulfill-box">
            <div class="ft">Server panel dibuat ✅</div>
            <div class="fr">Server ID: ${escapeHtml(String(f.serverId || "-"))}</div>
            ${f.identifier ? `<div class="fr">Identifier: ${escapeHtml(String(f.identifier))}</div>` : ""}
            ${f.userCreated ? `
              <div class="fr">Email: ${escapeHtml(String(f.userEmail || ""))}</div>
              ${f.userPassword ? `<div class="fr">Password: ${escapeHtml(String(f.userPassword))}</div><div class="warn">⚠️ Simpan sekarang, tidak akan ditampilkan lagi.</div>` : ""}
            ` : `<div class="fr" style="opacity:.7">Akun panel sudah ada — server baru dibuat untuk akun tersebut.</div>`}
          </div>
        `;
      } else if (f.type === "manual" && f.message) {
        statusDetails.innerHTML += `
          <div class="fulfill-box">
            <div class="ft">Konfirmasi</div>
            <div class="fr" style="white-space:normal">${escapeHtml(String(f.message))}</div>
          </div>
        `;
      }
    } catch (e) {
      // fulfillment error tidak menutupi status "paid" yang sudah tampil
    }
  }

  async function refreshStatus() {
    if (!state.order) return;
    try {
      setPayStatus("loading", "Cek status...");
      const data = await invoiceDetail({ orderId: state.order.orderId, amount: state.order.amount });
      const tx = data?.transaction || data?.data || data;
      const status = tx?.status || tx?.state || "UNKNOWN";

      if (looksPaid(status)) {
        setPayStatus("success", "Pembayaran berhasil");
        const isReseller = state.order.productKey === "reseller";
        const isPartner = state.order.productKey === "partner";
        const groupUrl = isPartner ? (LINKS.partnerGroupFallback || "").trim() : (LINKS.resellerGroupFallback || "").trim();
        const roleLabel = isPartner ? "Partner" : "Reseller";

        statusDetails.innerHTML = `
          <div style="color:var(--success);font-weight:600">Pembayaran terkonfirmasi ✅</div>
          <div style="margin-top:6px">Order ID: <span style="font-family:var(--mono)">${escapeHtml(state.order.orderId)}</span></div>
          ${(isReseller || isPartner) && groupUrl ? `
            <div style="margin-top:12px">
              <a href="${escapeHtml(groupUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Masuk Grup ${roleLabel}</a>
            </div>
          ` : ""}
        `;

        await runFulfillment();
        stopAutoPoll();
        toast("Pembayaran sukses!", "success");
        return;
      }

      if (looksPending(status)) {
        setPayStatus("pending", "Menunggu pembayaran");
        statusDetails.innerHTML = `<div>Status: <b>${escapeHtml(status)}</b></div><div style="font-size:11.5px;color:var(--text-faint);margin-top:4px">Klik refresh lagi setelah kamu bayar.</div>`;
        return;
      }

      setPayStatus("pending", `Status: ${status}`);
      statusDetails.innerHTML = `<div>Status: <b>${escapeHtml(status)}</b></div>`;
    } catch (err) {
      setPayStatus("error", "Gagal cek status");
      statusDetails.innerHTML = `<div style="color:var(--danger)">Error: ${escapeHtml(err.message || "Unknown")}</div>`;
      toast(err.message || "Gagal cek status", "error");
    }
  }

  async function cancelOrder() {
    if (!state.order) return;
    try {
      setPayStatus("loading", "Membatalkan...");
      await cancelInvoice({ orderId: state.order.orderId, amount: state.order.amount });
      toast("Transaksi dibatalkan.", "info");
    } catch (err) {
      toast(err.message || "Gagal membatalkan", "error");
    } finally {
      stopAutoPoll();
      state.order = null;
      paymentActive.style.display = "none";
      paymentEmpty.style.display = "";
      qrImage.removeAttribute("src");
      paymentString.textContent = "";
      orderReceipt.innerHTML = "";
      statusDetails.innerHTML = "";
      setPayStatus("idle", "Belum ada transaksi");
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

  $all(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productKey = btn.dataset.buy;
      const product = getProduct(productKey);
      if (!product || !isValid(productKey)) {
        toast("Lengkapi input & pilih paket dulu.", "error");
        return;
      }

      const planKey = state.selected[productKey];
      const plan = getPlan(productKey, planKey);
      const orderId = `DZ-${Date.now()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
      const amount = plan.price;
      const name = product.requires?.name ? (state.inputs[`${productKey}:name`] || "").trim() : "";

      paymentEmpty.style.display = "none";
      paymentActive.style.display = "block";
      qrImage.removeAttribute("src");
      paymentString.textContent = "";
      orderReceipt.innerHTML = `
        <div class="r-row"><span>Produk</span><b>${escapeHtml(product.title)}</b></div>
        <div class="r-row"><span>Paket</span><b>${escapeHtml(plan.label)}</b></div>
        ${name ? `<div class="r-row"><span>Nama</span><b>${escapeHtml(name)}</b></div>` : ""}
        <div class="r-row"><span>Order ID</span><b>${escapeHtml(orderId)}</b></div>
        <hr/>
        <div class="r-total"><span>Total</span><b>${escapeHtml(formatIDR(amount))}</b></div>
      `;
      statusDetails.innerHTML = `<div>Membuat invoice QRIS…</div>`;
      setPayStatus("loading", "Membuat QRIS...");
      $("#payment").scrollIntoView({ behavior: "smooth", block: "start" });

      try {
        const data = await createInvoice({ orderId, amount, meta: { product: productKey, plan: planKey, name } });
        const qr = data?.qr || {};
        const dataUrl = qr.dataUrl || "";
        const paymentNumber = qr.paymentNumber || "";

        state.order = { orderId, amount, productKey, planKey, inputs: { name } };

        if (dataUrl) qrImage.src = dataUrl;
        paymentString.textContent = paymentNumber || "(tidak ada payment string)";
        setPayStatus("pending", "Menunggu pembayaran");
        statusDetails.innerHTML = `<div>Scan QR untuk bayar, lalu klik <b>Refresh Status</b>.</div>`;
        toast("QRIS siap. Silakan bayar.", "success");
        startAutoPoll();
      } catch (err) {
        setPayStatus("error", "Gagal membuat QRIS");
        statusDetails.innerHTML = `<div style="color:var(--danger)">Error: ${escapeHtml(err.message || "Unknown")}</div>`;
        toast(err.message || "Gagal membuat QRIS", "error");
      }
    });
  });
}
