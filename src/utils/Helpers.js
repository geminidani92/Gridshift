// ============================================================
// GRIDSHIFT — Utility Helpers
// ============================================================

import { CONFIG } from '../config.js';

/** Convert grid col/row to pixel x/y (center of tile) */
export function gridToPixel(col, row) {
  return {
    x: CONFIG.GRID_OFFSET_X + col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
    y: CONFIG.GRID_OFFSET_Y + row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
  };
}

/** Convert pixel x/y to grid col/row */
export function pixelToGrid(x, y) {
  return {
    col: Math.floor((x - CONFIG.GRID_OFFSET_X) / CONFIG.TILE_SIZE),
    row: Math.floor((y - CONFIG.GRID_OFFSET_Y) / CONFIG.TILE_SIZE),
  };
}

/** Check if col/row is within grid bounds */
export function inBounds(col, row) {
  return col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS;
}

/** Shuffle array in place (Fisher-Yates) */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random int between min and max (inclusive) */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick random element from array */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Lerp */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Convert hex color number to CSS string */
export function hexToCSS(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}
