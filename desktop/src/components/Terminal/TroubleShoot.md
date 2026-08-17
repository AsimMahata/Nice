# Terminal Rendering Troubleshooting

If the terminal looks "ugly," characters are overlapping, or the text seems squashed (especially on initial load), here are the common culprits and how we fixed them.

## 1. The "Wildcard" Font Conflict (CRITICAL)
**The Problem:** Using `* { font-family: ... }` in your global CSS (like `App.css`).
**Why it breaks:** `xterm.js` calculates character widths by creating invisible "helper" elements in the DOM. If you use a universal selector (`*`) to set a font, it forces that font onto the terminal's internal measurement tools. This tricks the terminal into thinking every character is a different width than it actually is, leading to that messy overlap.
**The Fix:** Always set your global font-family on the `body` tag instead of `*`. 
```css
/* BAD: Breaks terminal measurement */
* { font-family: 'YourFont', sans-serif; }

/* GOOD: Terminal stays happy */
body { font-family: 'YourFont', sans-serif; }
```

## 2. The Font Loading Race
**The Problem:** The terminal initializes before the browser has finished downloading your high-quality monospace fonts (like Cascadia Code or Fira Code).
**Why it breaks:** If the browser hasn't loaded the custom font yet, it falls back to a default system font for a split second. The terminal calculates its grid based on that fallback font. When the real font finally arrives, the grid is already "locked in" with the wrong measurements.
**The Fix:** Wait for the fonts to be fully ready before calling the `fit()` method or initializing the terminal.
```typescript
const initTerminalRendering = async () => {
    await document.fonts.ready; // Wait for high-quality fonts
    setTimeout(() => {
        handleResize(); // Then fit the terminal
    }, 50); // A tiny delay helps the DOM settle
};
```

## 3. Padding and Fitting
**The Problem:** Adding padding directly to the terminal container via CSS while using the `FitAddon`.
**Why it breaks:** The Fit addon tries to fill the entire parent container. If the container has padding, the calculation can get slightly off, or the scrollbars might behave strangely.
**The Fix:** Use `padding: 0 !important` on the terminal container and handle any desired spacing by wrapping it in another `div` or adjusting the layout of the parent component.

---
**Summary for next time:** If it looks broken, check `App.css` for `*` selectors first!
