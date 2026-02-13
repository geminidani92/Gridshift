// ============================================================
// GRIDSHIFT — Player Object
// Tile-by-tile movement with snap-to-grid
// ============================================================

import { CONFIG } from '../config.js';
import { gridToPixel } from '../utils/Helpers.js';

export class Player {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.moving = false;
    
    const pos = gridToPixel(col, row);
    
    // Draw player as a circle with inner detail
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
    this.drawAt(pos.x, pos.y);
  }
  
  drawAt(x, y) {
    const g = this.graphics;
    g.clear();
    g.x = 0;
    g.y = 0;
    
    const size = CONFIG.TILE_SIZE * 0.35;
    
    // Outer glow
    g.fillStyle(CONFIG.COLORS.PLAYER, 0.15);
    g.fillCircle(x, y, size + 6);
    
    // Main body
    g.fillStyle(CONFIG.COLORS.PLAYER, 1);
    g.fillCircle(x, y, size);
    
    // Inner highlight
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.4);
  }
  
  /**
   * Move player by delta (col, row). Returns true if moved.
   */
  moveTo(newCol, newRow, grid) {
    if (this.moving) return false;
    if (!grid.isWalkable(newCol, newRow)) return false;
    
    this.moving = true;
    this.col = newCol;
    this.row = newRow;
    
    const target = gridToPixel(newCol, newRow);
    
    // Animate movement
    this.scene.tweens.add({
      targets: this,
      duration: CONFIG.PLAYER_MOVE_SPEED,
      ease: 'Power2',
      onUpdate: () => {
        // Interpolate position for smooth drawing
        const progress = this.scene.tweens.getTweensOf(this)[0]?.progress || 1;
        const currentX = this.graphics.x || target.x;
        const currentY = this.graphics.y || target.y;
        this.drawAt(target.x, target.y);
      },
      onStart: () => {
        this.drawAt(target.x, target.y);
      },
      onComplete: () => {
        this.moving = false;
        this.drawAt(target.x, target.y);
      }
    });
    
    // Quick redraw at target (since tween is mainly for timing)
    this.drawAt(target.x, target.y);
    
    return true;
  }
  
  setPosition(col, row) {
    this.col = col;
    this.row = row;
    const pos = gridToPixel(col, row);
    this.drawAt(pos.x, pos.y);
  }
  
  destroy() {
    this.graphics.destroy();
  }
}
