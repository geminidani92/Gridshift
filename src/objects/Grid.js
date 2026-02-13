// ============================================================
// GRIDSHIFT — Grid Object
// Manages the 7x8 tile grid and the chain-flip mechanic
// ============================================================

import { CONFIG } from '../config.js';
import { CELL, EVENTS } from '../utils/Constants.js';
import { inBounds } from '../utils/Helpers.js';
import { Tile } from './Tile.js';

export class Grid {
  constructor(scene, levelData) {
    this.scene = scene;
    this.tiles = [];  // 2D array [row][col]
    
    this.build(levelData);
  }
  
  build(levelData) {
    // Clear existing
    this.destroy();
    this.tiles = [];
    
    // Draw grid background
    this.bgGraphics = this.scene.add.graphics();
    this.bgGraphics.fillStyle(CONFIG.COLORS.BG_MEDIUM, 1);
    this.bgGraphics.fillRoundedRect(
      CONFIG.GRID_OFFSET_X - 8,
      CONFIG.GRID_OFFSET_Y - 8,
      CONFIG.GRID_COLS * CONFIG.TILE_SIZE + 16,
      CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 16,
      12
    );
    
    // Grid lines
    this.bgGraphics.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.3);
    for (let c = 0; c <= CONFIG.GRID_COLS; c++) {
      const x = CONFIG.GRID_OFFSET_X + c * CONFIG.TILE_SIZE;
      this.bgGraphics.lineBetween(x, CONFIG.GRID_OFFSET_Y, x, CONFIG.GRID_OFFSET_Y + CONFIG.GRID_ROWS * CONFIG.TILE_SIZE);
    }
    for (let r = 0; r <= CONFIG.GRID_ROWS; r++) {
      const y = CONFIG.GRID_OFFSET_Y + r * CONFIG.TILE_SIZE;
      this.bgGraphics.lineBetween(CONFIG.GRID_OFFSET_X, y, CONFIG.GRID_OFFSET_X + CONFIG.GRID_COLS * CONFIG.TILE_SIZE, y);
    }
    
    // Create tiles from level data
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const cellType = levelData[row]?.[col] ?? CELL.EMPTY;
        this.tiles[row][col] = new Tile(this.scene, col, row, cellType);
      }
    }
  }
  
  getTile(col, row) {
    if (!inBounds(col, row)) return null;
    return this.tiles[row][col];
  }
  
  /**
   * Core mechanic: flip tile at position + chain
   * If there's another flipped tile in the same row or column,
   * all tiles between them flip too.
   * Returns number of tiles flipped.
   */
  flipAt(col, row) {
    const tile = this.getTile(col, row);
    if (!tile || !tile.isFlippable()) return 0;
    
    let flippedCount = 0;
    
    // Check for chain in all 4 directions
    const chains = this.findChains(col, row);
    
    if (chains.length > 0) {
      // Chain flip: flip all tiles in the chain
      for (const chain of chains) {
        for (const t of chain) {
          if (!t.flipped) {
            t.flip();
            flippedCount++;
          }
        }
      }
      // Also flip the source tile if not already
      if (!tile.flipped) {
        tile.flip();
        flippedCount++;
      }
      
      if (flippedCount > 1) {
        this.scene.events.emit(EVENTS.CHAIN_FLIP, flippedCount);
      }
    } else {
      // Simple flip: just this tile
      tile.flip();
      flippedCount = 1;
    }
    
    if (flippedCount > 0) {
      this.scene.events.emit(EVENTS.TILE_FLIPPED, flippedCount);
    }
    
    return flippedCount;
  }
  
  /**
   * Find chain targets from a position.
   * Look in each direction for the nearest already-flipped tile.
   * If found, all tiles between source and target (inclusive) form a chain.
   */
  findChains(col, row) {
    const chains = [];
    const directions = [
      { dc: 0, dr: -1 },  // up
      { dc: 0, dr:  1 },  // down
      { dc: -1, dr: 0 },  // left
      { dc:  1, dr: 0 },  // right
    ];
    
    for (const { dc, dr } of directions) {
      const chain = [];
      let c = col + dc;
      let r = row + dr;
      
      while (inBounds(c, r)) {
        const t = this.getTile(c, r);
        
        // Blocked by wall or hole
        if (!t || !t.isFlippable()) break;
        
        chain.push(t);
        
        // Found a flipped tile — this is a valid chain
        if (t.flipped) {
          // Only include unflipped tiles in the chain (the ones that will flip)
          const toFlip = chain.filter(tile => !tile.flipped);
          if (toFlip.length > 0) {
            chains.push(toFlip);
          }
          break;
        }
        
        c += dc;
        r += dr;
      }
    }
    
    return chains;
  }
  
  /**
   * Check if all flippable tiles have been flipped (win condition)
   */
  isComplete() {
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const tile = this.tiles[row][col];
        if (tile.cellType === CELL.EMPTY) return false;
      }
    }
    return true;
  }
  
  /**
   * Count remaining unflipped tiles
   */
  remaining() {
    let count = 0;
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        if (this.tiles[row][col].cellType === CELL.EMPTY) count++;
      }
    }
    return count;
  }
  
  /**
   * Count total flippable tiles
   */
  totalFlippable() {
    let count = 0;
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const ct = this.tiles[row][col].cellType;
        if (ct === CELL.EMPTY || ct === CELL.FLIPPED) count++;
      }
    }
    return count;
  }
  
  isWalkable(col, row) {
    const tile = this.getTile(col, row);
    return tile ? tile.isWalkable() : false;
  }
  
  destroy() {
    for (const row of this.tiles) {
      for (const tile of row) {
        tile.destroy();
      }
    }
    this.tiles = [];
    if (this.bgGraphics) {
      this.bgGraphics.destroy();
      this.bgGraphics = null;
    }
  }
}
