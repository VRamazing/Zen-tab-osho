# Rajneesh Zen Tab

A Manifest V3 Chrome extension that overrides the new tab page with calming imagery, rotating Rajneesh quotes, and a live clock. The UI is intentionally minimal and extensible so additional settings (filters, favorites view, overlays) can be layered in without refactoring the core. The new “Rajneesh Aura” background is an original vector illustration to avoid trademark or likeness issues while still evoking his presence.

## Features
- **Randomized serenity** – pulls a random quote and background on each load while honoring optional daily-lock settings.
- **Live clock** – updates every 10 seconds (`HH:MM` format) with an easy hook to hide/show it via storage-backed settings.
- **Favorites** – tap the *Favorite* button to store quotes in `localStorage`; the button state reflects whether the current quote is saved.
- **Local assets** – backgrounds and icons are bundled offline, ensuring fast renders with no network requirements.
- **Future-friendly API** – a small control surface is exposed on `window.rajneeshZenTab` so forthcoming settings UIs can toggle categories, clock visibility, daily mode, or background rotation without touching core logic.

## Project Structure
```
rajneesh-zen-tab/
├── manifest.json
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── quotes.js
└── assets/
    ├── backgrounds/
    └── icons/
```

## Getting Started
1. Open `chrome://extensions`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the project root (`rajneesh-zen-tab`).
4. Open a new tab to see the extension in action.

## Optional Controls
While no settings UI ships yet, you can wire up controls (popup, modal, options page) that call the exposed helpers:

```js
window.rajneeshZenTab.setCategoryFilter("meditation");
window.rajneeshZenTab.toggleClockVisibility(false);
window.rajneeshZenTab.setDailyMode(true);
window.rajneeshZenTab.setBackgroundRotation("daily");
```

## Testing Checklist
- Confirm the extension overrides the new tab without console errors.
- Reload the tab to ensure quotes/backgrounds randomize (or stay fixed when daily mode is enabled via the API).
- Toggle favorites and check `localStorage.getItem('rajneeshZenTab.favorites')` to verify persistence.
- Validate the clock updates every 10 seconds and respects the visibility toggle helper.

## Next Steps
- Add an options view that writes to the storage-backed settings.
- Surface a favorites drawer fed by `rajneeshZenTab.favorites`.
- Introduce background/quote transition animations beyond the current fades if desired.
