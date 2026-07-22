// BioPulse Global — stock detail page
// Reads ?symbol= from the URL, looks it up in data/stocks.json /
// data/commodities.json for our own price snapshot, and embeds a live
// TradingView chart for the same symbol.

// Yahoo Finance symbol (used across this site) -> TradingView exchange:symbol
const TV_SYMBOL_MAP = {
  "MRNA": "NASDAQ:MRNA",
  "REGN": "NASDAQ:REGN",
  "VRTX": "NASDAQ:VRTX",
  "GILD": "NASDAQ:GILD",
  "LLY": "NYSE:LLY",
  "PFE": "NYSE:PFE",
  "JNJ": "NYSE:JNJ",
  "BIIB": "NASDAQ:BIIB",
  "NVS": "NYSE:NVS",
  "AZN": "NASDAQ:AZN",
  "ROG.SW": "SIX:ROG",
  "GSK": "NYSE:GSK",
  "SNY": "NASDAQ:SNY",
  "SUNPHARMA.NS": "NSE:SUNPHARMA",
  "DRREDDY.NS": "NSE:DRREDDY",
  "CIPLA.NS": "NSE:CIPLA",
  "4523.T": "TSE:4523",
  "4502.T": "TSE:4502",
  "4519.T": "TSE:4519",
  "1093.HK": "HKEX:1093",
  "1177.HK": "HKEX:1177",
  "2196.HK": "HKEX:2196",
  "XBI": "AMEX:XBI",
  "IBB": "NASDAQ:IBB",
  "ARKG": "AMEX:ARKG",
  "CL=F": "NYMEX:CL1!",
  "NG=F": "NYMEX:NG1!",
  "ZC=F": "CBOT:ZC1!",
  "ZS=F": "CBOT:ZS1!",
  "ZW=F": "CBOT:ZW1!",
  "HG=F": "COMEX:HG1!",
  "SB=F": "ICEUS:SB1!"
};

function getSymbolFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("symbol") || "";
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
    loadChart(getSymbolFromUrl());
  });
}

function renderHeader(entry, symbol) {
  const header = document.getElementById("stockHeader");
  if (!entry) {
    header.innerHTML = `
      <div class="stock-header-left">
        <h1>${symbol || "Unknown symbol"}</h1>
        <div class="stock-symbol-name">Not in BioPulse's tracked list yet — showing the live chart only.</div>
      </div>
    `;
    return;
  }

  const hasPrice = entry.price !== null && entry.price !== undefined;
  const changeClass = hasPrice && entry.change_pct != null ? (entry.change_pct >= 0 ? "up" : "down") : "";
  const changeText = hasPrice && entry.change_pct != null
    ? `${entry.change_pct >= 0 ? "▲" : "▼"} ${Math.abs(entry.change_pct)}%`
    : "—";

  header.innerHTML = `
    <div class="stock-header-left">
      <h1>${entry.name}</h1>
      <div class="stock-symbol-name">${entry.symbol}${entry.country ? ` · ${entry.country}` : ""}${entry.unit ? ` · ${entry.unit}` : ""}</div>
    </div>
    <div class="stock-header-right">
      <div class="stock-price">${hasPrice ? `${entry.currency || ""} ${entry.price}` : "Not fetched yet"}</div>
      <div class="stock-change ${changeClass}">${changeText}</div>
      <div class="stock-status">${entry.live ? "Live" : "Sample layout"} · updated ${entry.date}</div>
    </div>
  `;
}

function renderMeta(entry) {
  const meta = document.getElementById("stockMeta");
  if (!entry) { meta.innerHTML = ""; return; }
  const rows = [
    ["Symbol", entry.symbol],
    ["Country", entry.country || "—"],
    ["Currency", entry.currency || "—"],
    ["Type", entry.type || (entry.unit ? "Commodity" : "—")],
    ["Status", entry.live ? "Live" : "Sample layout"],
    ["Last updated", entry.date || "—"]
  ];
  meta.innerHTML = rows.map(([label, value]) => `
    <div class="stock-meta-item">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `).join("");
}

function renderExternalLinks(symbol) {
  const container = document.getElementById("externalLinks");
  const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  container.innerHTML = `<a href="${yahooUrl}" target="_blank" rel="noopener">View on Yahoo Finance ↗</a>`;
}

function loadChart(symbol) {
  const container = document.getElementById("tvWidgetContainer");
  const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  container.innerHTML = '<div id="tvChart"></div>';
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.text = JSON.stringify({
    autosize: true,
    symbol: tvSymbol,
    interval: "D",
    timezone: "Etc/UTC",
    theme: isDark ? "dark" : "light",
    style: "1",
    locale: "en",
    enable_publishing: false,
    allow_symbol_change: true,
    support_host: "https://www.tradingview.com"
  });
  container.appendChild(script);
}

async function init() {
  setupThemeToggle();

  const symbol = getSymbolFromUrl();
  document.title = symbol ? `${symbol} — BioPulse Global` : "Stock detail — BioPulse Global";

  const [stocksRes, commoditiesRes] = await Promise.all([
    fetch("data/stocks.json").then(r => r.ok ? r.json() : []).catch(() => []),
    fetch("data/commodities.json").then(r => r.ok ? r.json() : []).catch(() => [])
  ]);

  const entry = [...stocksRes, ...commoditiesRes].find(e => e.symbol === symbol) || null;

  renderHeader(entry, symbol);
  renderMeta(entry);
  renderExternalLinks(symbol);
  loadChart(symbol);
}

init();
