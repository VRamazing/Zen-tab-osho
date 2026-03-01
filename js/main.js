import { quotes } from "./quotes.js";

const SELECTORS = {
  background: document.querySelector(".background"),
  quoteText: document.getElementById("quoteText"),
  quoteAuthor: document.getElementById("quoteAuthor"),
  newQuoteBtn: document.getElementById("newQuoteBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  clockDisplay: document.getElementById("clockDisplay"),
  dateDisplay: document.getElementById("dateDisplay"),
  toast: document.getElementById("toast")
};

const STORAGE_KEYS = {
  settings: "rajneeshZenTab.settings",
  daily: "rajneeshZenTab.dailyPayload"
};

const DEFAULT_SETTINGS = {
  showClock: true,
  quoteCategory: "all",
  backgroundRotation: "per-tab",
  dailyMode: false
};

const BACKGROUNDS = [
  { id: "horizon", path: "assets/backgrounds/bg-horizon.svg", tone: "light" },
  { id: "lotus", path: "assets/backgrounds/bg-lotus.svg", tone: "light" },
  { id: "saffron", path: "assets/backgrounds/bg-saffron.svg", tone: "light" },
  { id: "orchid", path: "assets/backgrounds/bg-orchid.svg", tone: "light" },
  { id: "dawn", path: "assets/backgrounds/bg-dawn.svg", tone: "light" },
  { id: "aurora", path: "assets/backgrounds/bg-aurora.svg", tone: "light" },
  { id: "meadow", path: "assets/backgrounds/bg-meadow.svg", tone: "light" },
  { id: "halo", path: "assets/backgrounds/bg-halo.svg", tone: "light" },
  { id: "serene", path: "assets/backgrounds/bg-serene.svg", tone: "light" },
  { id: "lagoon", path: "assets/backgrounds/bg-lagoon.svg", tone: "light" }
];

const OSHO_IMAGE_PATH = "assets/images/osho.png";
const QUOTE_SIGNATURE = "— Rajneesh Osho";

const BACKGROUND_FADE_CLASS = "is-fading";
const BACKGROUND_FADE_DELAY = 180;

const state = {
  settings: DEFAULT_SETTINGS,
  currentQuote: null,
  currentBackground: null,
  backgroundTimer: null
};
const Storage = {
  // Minimal guard rails around localStorage serialization.
  read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("Storage read failed", error);
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Storage write failed", error);
    }
  }
};

function loadSettings() {
  const persisted = Storage.read(STORAGE_KEYS.settings, {});
  state.settings = { ...DEFAULT_SETTINGS, ...persisted };
}

function persistSettings(partial) {
  state.settings = { ...state.settings, ...partial };
  Storage.write(STORAGE_KEYS.settings, state.settings);
}

function getQuotesPool() {
  if (state.settings.quoteCategory === "all") {
    return quotes;
  }
  return quotes.filter(
    (quote) => quote.category === state.settings.quoteCategory
  );
}

function getRandomQuote() {
  const pool = getQuotesPool();
  if (!pool.length) {
    return null;
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function applyResponsiveQuoteSize(text = "") {
  if (!SELECTORS.quoteText) {
    return;
  }
  const length = text.length;
  let fontSize = "";
  let lineHeight = "";
  if (length > 240) {
    fontSize = "clamp(1.3rem, 3vw, 2.2rem)";
    lineHeight = "1.25";
  } else if (length > 180) {
    fontSize = "clamp(1.5rem, 3.4vw, 2.6rem)";
    lineHeight = "1.28";
  }
  SELECTORS.quoteText.style.fontSize = fontSize;
  SELECTORS.quoteText.style.lineHeight = lineHeight || "";
}

function setQuote(quote) {
  if (!quote || !SELECTORS.quoteText) {
    return;
  }
  state.currentQuote = quote;
  SELECTORS.quoteText.classList.remove("visible");
  requestAnimationFrame(() => {
    SELECTORS.quoteText.textContent = quote.text;
    applyResponsiveQuoteSize(quote.text);
    SELECTORS.quoteText.classList.add("visible");
    if (SELECTORS.quoteAuthor) {
      SELECTORS.quoteAuthor.textContent = QUOTE_SIGNATURE;
    }
  });
}

function setBackground(background) {
  if (!background || !SELECTORS.background) {
    return;
  }
  state.currentBackground = background;
  if (document.body) {
    document.body.dataset.bgTone = background.tone || "light";
  }
  SELECTORS.background.classList.add(BACKGROUND_FADE_CLASS);
  clearTimeout(state.backgroundTimer);
  state.backgroundTimer = window.setTimeout(() => {
    SELECTORS.background.style.backgroundImage = `url(${background.path})`;
    SELECTORS.background.style.backgroundPosition = background.position || "center";
    SELECTORS.background.style.backgroundSize = background.size || "cover";
    SELECTORS.background.style.backgroundRepeat = background.repeat || "no-repeat";
    SELECTORS.background.style.backgroundColor = background.color || "transparent";
    requestAnimationFrame(() => {
      SELECTORS.background.classList.remove(BACKGROUND_FADE_CLASS);
    });
  }, BACKGROUND_FADE_DELAY);
}

function applyClockVisibility(isVisible) {
  const visibility = isVisible ? "visible" : "hidden";
  if (SELECTORS.clockDisplay) {
    SELECTORS.clockDisplay.style.visibility = visibility;
  }
  if (SELECTORS.dateDisplay) {
    SELECTORS.dateDisplay.style.visibility = visibility;
  }
}

function updateClock() {
  if (!SELECTORS.clockDisplay && !SELECTORS.dateDisplay) {
    return;
  }
  if (!state.settings.showClock) {
    applyClockVisibility(false);
    return;
  }
  applyClockVisibility(true);
  const now = new Date();
  const timeOptions = { hour: "2-digit", minute: "2-digit" };
  if (SELECTORS.clockDisplay) {
    SELECTORS.clockDisplay.textContent = now.toLocaleTimeString([], timeOptions);
  }
  if (SELECTORS.dateDisplay) {
    const dateOptions = { weekday: "long", month: "long", day: "numeric" };
    SELECTORS.dateDisplay.textContent = now.toLocaleDateString([], dateOptions);
  }
}

function scheduleClock() {
  updateClock();
  setInterval(updateClock, 10000);
}

function pickBackground() {
  const index = Math.floor(Math.random() * BACKGROUNDS.length);
  return BACKGROUNDS[index];
}

function getDailyPayload() {
  return Storage.read(STORAGE_KEYS.daily, null);
}

function persistDailyPayload(payload) {
  Storage.write(STORAGE_KEYS.daily, payload);
}

function hasValidDailyPayload(payload) {
  if (!payload) {
    return false;
  }
  return payload.date === new Date().toDateString();
}

function refreshExperience({ forceNew = false } = {}) {
  const payload = getDailyPayload();
  const payloadValid = hasValidDailyPayload(payload);
  const lockQuote = payloadValid && state.settings.dailyMode && !forceNew;
  const lockBackground =
    payloadValid && !forceNew && (state.settings.dailyMode || state.settings.backgroundRotation === "daily");

  const quote = lockQuote ? payload.quote : getRandomQuote();
  const background = lockBackground && payload.background ? payload.background : pickBackground();

  if (quote) {
    setQuote(quote);
  }
  if (background) {
    setBackground(background);
  }

  const shouldPersist = state.settings.dailyMode || state.settings.backgroundRotation === "daily";
  if (shouldPersist && quote && background) {
    persistDailyPayload({
      date: new Date().toDateString(),
      quote,
      background
    });
  } else if (!shouldPersist) {
    persistDailyPayload(null);
  }
}

function showToast(message) {
  if (!SELECTORS.toast) {
    return;
  }
  SELECTORS.toast.textContent = message;
  SELECTORS.toast.classList.add("visible");
  setTimeout(() => {
    SELECTORS.toast.classList.remove("visible");
  }, 2000);
}

function getViewportDimensions() {
  const width = Math.max(window.innerWidth, 1280);
  const height = Math.max(window.innerHeight, 720);
  return { width, height };
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  words.forEach((word, index) => {
    const testLine = `${line}${word} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && index > 0) {
      ctx.fillText(line.trimEnd(), x, cursorY);
      line = `${word} `;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line.trim()) {
    ctx.fillText(line.trimEnd(), x, cursorY);
  }
  return cursorY;
}

function measureWrappedTextHeight(ctx, text, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lines = 1;
  words.forEach((word, index) => {
    const testLine = `${line}${word} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && index > 0) {
      line = `${word} `;
      lines += 1;
    } else {
      line = testLine;
    }
  });
  return lines * lineHeight;
}

function drawRoundedRect(ctx, x, y, width, height, radius = 32) {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCoverImage(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

async function downloadCurrentQuoteWallpaper() {
  if (!state.currentQuote || !state.currentBackground) {
    showToast("Generate a quote first");
    return;
  }
  try {
    const { width, height } = getViewportDimensions();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const backgroundSrc = new URL(state.currentBackground.path, window.location.href).toString();
    const oshoSrc = new URL(OSHO_IMAGE_PATH, window.location.href).toString();
    const [background, osho] = await Promise.all([loadImage(backgroundSrc), loadImage(oshoSrc)]);
    drawCoverImage(ctx, background, width, height);

    const sceneGradient = ctx.createLinearGradient(0, 0, 0, height);
    sceneGradient.addColorStop(0, "rgba(7, 9, 24, 0.25)");
    sceneGradient.addColorStop(1, "rgba(7, 9, 24, 0.7)");
    ctx.fillStyle = sceneGradient;
    ctx.fillRect(0, 0, width, height);

    // Recreate the card + time layout so the export matches the UI closely.
    const margin = Math.round(width * 0.08);
    const cardWidth = Math.min(width * 0.55, 780);
    const cardX = margin;
    const cardY = Math.round(height * 0.2);
    const cardPadding = Math.max(32, Math.round(cardWidth * 0.12));
    const textMaxWidth = cardWidth - cardPadding * 2;
    const baseFontSize = Math.min(56, Math.max(32, width * 0.028));
    ctx.font = `600 ${baseFontSize}px "Playfair Display", "Times New Roman", serif`;
    const lineHeight = baseFontSize * 1.32;
    const quoteHeight = measureWrappedTextHeight(ctx, state.currentQuote.text, textMaxWidth, lineHeight);
    const metaBlock = lineHeight * 1.8;
    const cardHeight = quoteHeight + cardPadding * 2 + metaBlock;

    ctx.save();
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 38);
    const glassGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
    glassGradient.addColorStop(0, "rgba(8, 10, 24, 0.78)");
    glassGradient.addColorStop(1, "rgba(11, 14, 28, 0.62)");
    ctx.fillStyle = glassGradient;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();
    ctx.restore();

    const textX = cardX + cardPadding;
    const quoteStartY = cardY + cardPadding;
    ctx.fillStyle = "#fef9f2";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(2, 2, 12, 0.55)";
    ctx.shadowBlur = 18;
    ctx.font = `600 ${baseFontSize}px "Playfair Display", "Times New Roman", serif`;
    const lastLineY = wrapText(ctx, state.currentQuote.text, textX, quoteStartY, textMaxWidth, lineHeight);
    ctx.shadowBlur = 10;
    ctx.font = `500 ${Math.round(baseFontSize * 0.55)}px "Inter", "Helvetica", sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(QUOTE_SIGNATURE, textX, lastLineY + lineHeight * 1.2);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.shadowBlur = 0;

    const panelGap = Math.round(width * 0.05);
    const panelX = cardX + cardWidth + panelGap;
    const panelWidth = Math.max(width - panelX - margin, 0);
    if (panelWidth > 0) {
      const haloRadius = Math.min(panelWidth * 0.75, height * 0.32);
      const haloCenterX = panelX + panelWidth / 2;
      const haloCenterY = cardY + haloRadius * 0.9;
      const haloGradient = ctx.createRadialGradient(
        haloCenterX,
        haloCenterY,
        haloRadius * 0.2,
        haloCenterX,
        haloCenterY,
        haloRadius
      );
      haloGradient.addColorStop(0, "rgba(255, 255, 255, 0.25)");
      haloGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(haloCenterX, haloCenterY, haloRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const desiredHeight = Math.min(height * 0.55, osho.height * 1.1);
    const oshoScale = desiredHeight / osho.height;
    const oshoHeight = desiredHeight;
    const oshoWidth = osho.width * oshoScale;
    const oshoX = width - margin - oshoWidth;
    const oshoY = Math.max(cardY + cardHeight - oshoHeight * 0.4, height - margin - oshoHeight);
    ctx.save();
    ctx.shadowColor = "rgba(5, 6, 18, 0.65)";
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 24;
    ctx.drawImage(osho, oshoX, oshoY, oshoWidth, oshoHeight);
    ctx.restore();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `zen-wallpaper-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Wallpaper saved");
  } catch (error) {
    console.warn("Wallpaper download failed", error);
    showToast("Couldn't create wallpaper");
  }
}

function handleQuoteActivation(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    refreshExperience({ forceNew: true });
  }
}

function bindEvents() {
  SELECTORS.newQuoteBtn?.addEventListener("click", () => refreshExperience({ forceNew: true }));
  SELECTORS.downloadBtn?.addEventListener("click", downloadCurrentQuoteWallpaper);
  SELECTORS.quoteText?.addEventListener("click", () => refreshExperience({ forceNew: true }));
  SELECTORS.quoteText?.addEventListener("keydown", handleQuoteActivation);
}

// Surface minimal hooks so future settings UIs can reuse the same logic.
function createControlSurface() {
  const api = {
    setCategoryFilter(category = "all") {
      persistSettings({ quoteCategory: category || "all" });
      refreshExperience({ forceNew: true });
    },
    toggleClockVisibility(showClock = true) {
      persistSettings({ showClock: Boolean(showClock) });
      updateClock();
    },
    setDailyMode(enabled = false) {
      persistSettings({ dailyMode: Boolean(enabled) });
      refreshExperience({ forceNew: !enabled });
    },
    setBackgroundRotation(strategy = "per-tab") {
      persistSettings({ backgroundRotation: strategy });
      refreshExperience({ forceNew: true });
    }
  };
  window.rajneeshZenTab = Object.freeze(api);
}

function init() {
  loadSettings();
  bindEvents();
  createControlSurface();
  refreshExperience();
  scheduleClock();
}

document.addEventListener("DOMContentLoaded", init);
