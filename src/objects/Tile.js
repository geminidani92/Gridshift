// ============================================================
// GRIDSHIFT — Tile Object
// Represents a single cell on the grid
// ============================================================

import { CONFIG } from '../config.js';
import { CELL } from '../utils/Constants.js';
import { gridToPixel } from '../utils/Helpers.js';

export class Tile {
  constructor(scene, col, row, cellType) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.cellType = cellType;
    this.flipped = false;
    
    const pos = gridToPixel(col, row);
    this.x = pos.x;
    this.y = pos.y;
    
    // Create the visual
    this.graphics = scene.add.graphics();
    this.draw();
  }
  
  draw() {
    const g = this.graphics;
    g.clear();
    
    const size = CONFIG.TILE_SIZE - 4;
    const half = size / 2;
    const x = this.x - half;
    const y = this.y - half;
    const r = 6; // corner radius
    
    switch (this.cellType) {
      case CELL.BLOCK:
        g.fillStyle(CONFIG.COLORS.BLOCK, 1);
        g.fillRoundedRect(x, y, size, size, r);
        // Cross pattern
        g.lineStyle(2, CONFIG.COLORS.BG_MEDIUM, 0.4);
        g.lineBetween(x + 8, y + 8, x + size - 8, y + size - 8);
        g.lineBetween(x + size - 8, y + 8, x + 8, y + size - 8);
        break;
        
      case CELL.HOLE:
        g.fillStyle(CONFIG.COLORS.HOLE, 1);
        g.fillRoundedRect(x + 6, y + 6, size - 12, size - 12, r);
        break;
        
      case CELL.EMPTY:
      case CELL.FLIPPED:
        if (this.flipped) {
          g.fillStyle(CONFIG.COLORS.TILE_DARK, 1);
          g.fillRoundedRect(x, y, size, size, r);
          // Inner glow
          g.fillStyle(CONFIG.COLORS.TILE_FLIPPED, 0.15);
          g.fillRoundedRect(x + 4, y + 4, size - 8, size - 8, r - 2);
        } else {
          g.fillStyle(CONFIG.COLORS.TILE_LIGHT, 1);
          g.fillRoundedRect(x, y, size, size, r);
          // Subtle inner border
          g.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.5);
          g.strokeRoundedRect(x + 2, y + 2, size - 4, size - 4, r - 1);
        }
        break;
    }
  }
  
  flip() {
    if (this.cellType !== CELL.EMPTY && this.cellType !== CELL.FLIPPED) return false;
    
    this.flipped = !this.flipped;
    this.cellType = this.flipped ? CELL.FLIPPED : CELL.EMPTY;
    
    // Animate
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 0,
      duration: 80,
      yoyo: true,
      onYoyo: () => this.draw(),
      onComplete: () => {
        this.graphics.setScale(1);
      }
    });
    
    return true;
  }
  
  /** Unflip (used by enemies) */
  unflip() {
    if (!this.flipped) return;
    this.flipped = false;
    this.cellType = CELL.EMPTY;
    this.draw();
  }
  
  isWalkable() {
    return this.cellType === CELL.EMPTY || this.cellType === CELL.FLIPPED;
  }
  
  isFlippable() {
    return this.cellType === CELL.EMPTY || this.cellType === CELL.FLIPPED;
  }
  
  destroy() {
    this.graphics.destroy();
  }
}
