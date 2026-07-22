// BioPulse Global — client-side app
// Loads data/news.json (auto-aggregated) + data/manual.json (hand-picked links),
// plus data/stocks.json and data/commodities.json for the Markets tab.
// Pin state and custom ticker requests persisted in localStorage.

const state = {
  view: "news", // "news" | "markets"
  country: "Global",
  category: "All",
  showPinnedOnly: false,
  items: [],
  marketType: "stocks", // "stocks" | "commodities"
  stocks: [],
  commodities: [],
  customTickers: []
};

const CUSTOM_TICKERS_KEY = "biopulse_custom_tickers";

function getCustomTickers() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TICKERS_KEY) || "[]"); }
  catch (e) { return []; }
}
function setCustomTickers(arr) {
  localStorage.setItem(CUSTOM_TICKERS_KEY, JSON.stringify(arr));
}

const PINS_KEY = "biopulse_pinned_ids";

function getLocalPins() {
  try { return JSON.parse(localStorage.getItem(PINS_KEY) || "[]"); }
  catch (e) { return []; }
}
function setLocalPins(arr) {
  localStorage.setItem(PINS_KEY, JSON.stringify(arr));
}

async function loadData() {
  const [newsRes, manualRes, stocksRes, commoditiesRes] = await Promise.all([
    fetch("data/news.json").then(r => r.ok ? r.json() : []).catch(() => []),
    fetch("data/manual.json").then(r => r.ok ? r.json() : []).catch(() => []),
    fetch("data/stocks.json").then(r => r.ok ? r.json() : []).catch(() => []),
    fetch("data/commodities.json").then(r => r.ok ? r.json() : []).catch(() => [])
  ]);

  const manualTagged = manualRes.map(item => ({ ...item, manual: true }));
  const combined = [...manualTagged, ...newsRes];

  const pins = new Set(getLocalPins());
  combined.forEach(item => {
    if (item.pinned) pins.add(item.id);
    item.pinned = pins.has(item.id);
  });

  combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  state.items = combined;
  state.stocks = stocksRes;
  state.commodities = commoditiesRes;
  state.customTickers = getCustomTickers();
  render();
}

function togglePin(id) {
  const pins = new Set(getLocalPins());
  if (pins.has(id)) pins.delete(id); else pins.add(id);
  setLocalPins([...pins]);
  state.items = state.items.map(item =>
    item.id === id ? { ...item, pinned: pins.has(id) } : item
  );
  render();
}

function filteredItems() {
  return state.items.filter(item => {
    if (state.showPinnedOnly && !item.pinned) return false;
    if (state.country !== "Global" && item.country !== state.country) return false;
    if (state.category !== "All" && item.category !== state.category) return false;
    return true;
  });
}

function renderNews() {
  const list = filteredItems();
  const feedList = document.getElementById("feedList");
  const feedTitle = document.getElementById("feedTitle");
  const feedMeta = document.getElementById("feedMeta");

  feedTitle.textContent = state.showPinnedOnly
    ? "My Picks"
    : (state.country === "Global" ? "Global Biotech Feed" : `${state.country} Biotech Feed`);

  feedMeta.textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    feedList.innerHTML = `<div class="empty">No items match this filter yet.</div>`;
    return;
  }

  feedList.innerHTML = list.map(item => `
    <article class="news-card">
      <div class="card-top">
        <div>
          <div class="card-tags">
            <span class="tag country">${item.country}</span>
            <span class="tag">${item.category}</span>
            ${item.manual ? '<span class="tag">★ Hand-picked</span>' : ""}
          </div>
          <h3 class="card-title"><a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></h3>
        </div>
        <button class="pin-btn ${item.pinned ? "pinned" : ""}" data-id="${item.id}" title="Pin to My Picks">★</button>
      </div>
      <p class="card-summary">${item.summary || ""}</p>
      <div class="card-bottom">
        <span>${item.source}</span>
        <span>${item.date}</span>
      </div>
    </article>
  `).join("");

  feedList.querySelectorAll(".pin-btn").forEach(btn => {
    btn.addEventListener("click", () => togglePin(btn.dataset.id));
  });
}

function marketFilteredList() {
  let list = state.marketType === "stocks" ? state.stocks : state.commodities;
  if (state.marketType === "stocks" && state.country !== "Global") {
    list = list.filter(s => s.country === state.country);
  }
  return list;
}

function renderMarkets() {
  const feedList = document.getElementById("feedList");
  const feedTitle = document.getElementById("feedTitle");
  const feedMeta = document.getElementById("feedMeta");

  const list = marketFilteredList();
  const label = state.marketType === "stocks" ? "Biotech Stocks & ETFs" : "Raw Materials & Commodities";
  feedTitle.textContent = state.marketType === "stocks" && state.country !== "Global"
    ? `${label} — ${state.country}`
    : label;
  feedMeta.textContent = `${list.length} tracked`;

  if (!list.length) {
    feedList.innerHTML = `<div class="empty">Nothing tracked in this view yet.</div>`;
    return;
  }

  feedList.innerHTML = `<div class="market-grid">${list.map(m => {
    const hasPrice = m.price !== null && m.price !== undefined;
    const changeClass = hasPrice && m.change_pct != null ? (m.change_pct >= 0 ? "up" : "down") : "";
    const changeText = hasPrice && m.change_pct != null
      ? `${m.change_pct >= 0 ? "▲" : "▼"} ${Math.abs(m.change_pct)}%`
      : "—";
    return `
      <button class="market-card" data-symbol="${m.symbol}">
        <div class="market-card-top">
          <span class="market-symbol">${m.symbol}</span>
          ${m.country ? `<span class="tag country">${m.country}</span>` : ""}
        </div>
        <p class="market-name">${m.name}${m.unit ? ` (${m.unit})` : ""}</p>
        <div class="market-price ${hasPrice ? "" : "unavailable"}">
          ${hasPrice ? `${m.currency || ""} ${m.price}` : "Not fetched yet"}
        </div>
        <div class="market-change ${changeClass}">${changeText}</div>
        <div class="market-meta">
          <span>${m.live ? "live" : "sample layout"}</span>
          <span>${m.date}</span>
        </div>
      </button>
    `;
  }).join("")}</div>`;

  feedList.querySelectorAll(".market-card").forEach(card => {
    card.addEventListener("click", () => {
      window.location.href = `stock.html?symbol=${encodeURIComponent(card.dataset.symbol)}`;
    });
  });

  const banner = document.getElementById("marketBanner");
  if (list.length) {
    const latestDate = list.reduce((max, m) => (m.date > max ? m.date : max), list[0].date);
    const anyLive = list.some(m => m.live);
    banner.textContent = anyLive
      ? `Live prices via Yahoo Finance, auto-refreshed every 6 hours. Last updated: ${latestDate}.`
      : `Sample layout — prices haven't been fetched yet.`;
  }
}

function render() {
  const isMarkets = state.view === "markets";
  document.getElementById("newsSidebar").style.display = isMarkets ? "none" : "block";
  document.getElementById("marketsSidebar").style.display = isMarkets ? "block" : "none";
  document.getElementById("marketBanner").style.display = isMarkets ? "block" : "none";

  if (isMarkets) {
    renderMarkets();
  } else {
    renderNews();
  }
}

function setupNav() {
  document.getElementById("viewTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".view-tab");
    if (!btn) return;
    document.querySelectorAll(".view-tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    state.view = btn.dataset.view;
    render();
  });

  document.getElementById("countryTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    state.country = btn.dataset.country;
    render();
  });

  document.getElementById("categoryList").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.category = chip.dataset.category;
    render();
  });

  document.getElementById("marketTypeList").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    document.querySelectorAll("#marketTypeList .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.marketType = chip.dataset.markettype;
    render();
  });

  document.getElementById("addTickerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("tickerInput");
    const symbol = input.value.trim().toUpperCase();
    if (!symbol) return;
    const custom = getCustomTickers();
    if (!custom.includes(symbol)) {
      custom.push(symbol);
      setCustomTickers(custom);
    }
    input.value = "";
    document.getElementById("addTickerNote").textContent =
      `"${symbol}" saved to your local watchlist. It'll show a price once it's added to watchlist.json and fetch_markets.py has run — send "${symbol}" in chat and I'll add it now.`;
  });

  document.getElementById("pinnedToggle").addEventListener("click", (e) => {
    state.showPinnedOnly = !state.showPinnedOnly;
    e.currentTarget.classList.toggle("active-filter", state.showPinnedOnly);
    render();
  });

  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadData();
  });

  setupThemeToggle();
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("biopulse_theme") || "light";
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "🌙";
  } else {
    themeToggle.textContent = "☀️";
  }
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("biopulse_theme", "light");
      themeToggle.textContent = "☀️";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("biopulse_theme", "dark");
      themeToggle.textContent = "🌙";
    }
  });
}

setupNav();
loadData();