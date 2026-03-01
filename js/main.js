import { quotes } from "./quotes.js";

const SELECTORS = {
  background: document.querySelector(".background"),
  quoteText: document.getElementById("quoteText"),
  quoteCategory: document.getElementById("quoteCategory"),
  newQuoteBtn: document.getElementById("newQuoteBtn"),
  favoriteBtn: document.getElementById("favoriteBtn"),
  clockDisplay: document.getElementById("clockDisplay"),
  dateDisplay: document.getElementById("dateDisplay"),
  toast: document.getElementById("toast")
};

const STORAGE_KEYS = {
  settings: "rajneeshZenTab.settings",
  favorites: "rajneeshZenTab.favorites",
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

const BACKGROUND_FADE_CLASS = "is-fading";
const BACKGROUND_FADE_DELAY = 180;

const state = {
  settings: DEFAULT_SETTINGS,
  currentQuote: null,
  currentBackground: null,
  favorites: new Set(),
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

function loadFavorites() {
  const favoriteList = Storage.read(STORAGE_KEYS.favorites, []);
  state.favorites = new Set(favoriteList);
}

function persistFavorites() {
  Storage.write(STORAGE_KEYS.favorites, Array.from(state.favorites));
}

function formatCategory(label) {
  if (!label) {
    return "";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
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

function setQuote(quote) {
  if (!quote || !SELECTORS.quoteText) {
    return;
  }
  state.currentQuote = quote;
  SELECTORS.quoteText.classList.remove("visible");
  requestAnimationFrame(() => {
    SELECTORS.quoteText.textContent = quote.text;
    SELECTORS.quoteCategory.textContent = formatCategory(quote.category);
    SELECTORS.quoteText.classList.add("visible");
    const isFavorite = state.favorites.has(quote.text);
    SELECTORS.favoriteBtn?.setAttribute("aria-pressed", String(isFavorite));
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

function toggleFavorite() {
  if (!state.currentQuote) {
    return;
  }
  const key = state.currentQuote.text;
  if (state.favorites.has(key)) {
    state.favorites.delete(key);
    showToast("Removed from favorites");
  } else {
    state.favorites.add(key);
    showToast("Saved to favorites");
  }
  persistFavorites();
  const isFavorite = state.favorites.has(key);
  SELECTORS.favoriteBtn?.setAttribute("aria-pressed", String(isFavorite));
}

function handleQuoteActivation(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    refreshExperience({ forceNew: true });
  }
}

function bindEvents() {
  SELECTORS.newQuoteBtn?.addEventListener("click", () => refreshExperience({ forceNew: true }));
  SELECTORS.favoriteBtn?.addEventListener("click", toggleFavorite);
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
  loadFavorites();
  bindEvents();
  createControlSurface();
  refreshExperience();
  scheduleClock();
}

document.addEventListener("DOMContentLoaded", init);
