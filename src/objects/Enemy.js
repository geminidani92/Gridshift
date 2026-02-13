// ============================================================
// GRIDSHIFT — Enemy Object
// Three types: wanderer (random), chaser (follows player), pacer (back & forth)
// Enemies unflip tiles they walk over
// ============================================================

import { CONFIG } from '../config.js';
import { DIRECTION } from '../utils/Constants.js';
import { gridToPixel, inBounds, pick } from '../utils/Helpers.js';

export class Enemy {
  constructor(scene, col, row, type, options = {}) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;
    this.moving = false;
    
    // Pacer options
    this.axis = options.axis || 'horizontal';
    this.pacerDir = 1;  // 1 or -1
    
    const pos = gridToPixel(col, row);
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(8);
    this.drawAt(pos.x, pos.y);
  }
  
  drawAt(x, y) {
    const g = this.graphics;
    g.clear();
    
    const size = CONFIG.TILE_SIZE * 0.3;
    
    // Outer glow
    g.fillStyle(CONFIG.COLORS.ENEMY, 0.15);
    g.fillCircle(x, y, size + 5);
    
    // Body (diamond shape for enemies)
    g.fillStyle(CONFIG.COLORS.ENEMY, 1);
    g.beginPath();
    g.moveTo(x, y - size);
    g.lineTo(x + size, y);
    g.lineTo(x, y + size);
    g.lineTo(x - size, y);
    g.closePath();
    g.fillPath();
    
    // Eyes
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x - size * 0.25, y - size * 0.15, 3);
    g.fillCircle(x + size * 0.25, y - size * 0.15, 3);
  }
  
  /**
   * Decide next move based on enemy type
   */
  getNextMove(grid, playerCol, playerRow) {
    const dirs = Object.values(DIRECTION);
    
    switch (this.type) {
      case CONFIG.ENEMY_TYPES.WANDERER:
        return this.getWandererMove(grid, dirs);
        
      case CONFIG.ENEMY_TYPES.CHASER:
        return this.getChaserMove(grid, playerCol, playerRow);
        
      case CONFIG.ENEMY_TYPES.PACER:
        return this.getPacerMove(grid);
        
      default:
        return null;
    }
  }
  
  getWandererMove(grid, dirs) {
    // Try random directions
    const shuffled = [...dirs].sort(() => Math.random() - 0.5);
    for (const d of shuffled) {
      const nc = this.col + d.x;
      const nr = this.row + d.y;
      if (grid.isWalkable(nc, nr)) return { col: nc, row: nr };
    }
    return null;
  }
  
  getChaserMove(grid, playerCol, playerRow) {
    // Move one step closer to player (manhattan)
    const dx = Math.sign(playerCol - this.col);
    const dy = Math.sign(playerRow - this.row);
    
    // Try horizontal first, then vertical, then any
    const tries = [];
    if (dx !== 0) tries.push({ col: this.col + dx, row: this.row });
    if (dy !== 0) tries.push({ col: this.col, row: this.row + dy });
    // Add random perpendicular if stuck
    if (dx === 0 && dy !== 0) tries.push({ col: this.col + pick([-1, 1]), row: this.row });
    if (dy === 0 && dx !== 0) tries.push({ col: this.col, row: this.row + pick([-1, 1]) });
    
    for (const t of tries) {
      if (grid.isWalkable(t.col, t.row)) return t;
    }
    return null;
  }
  
  getPacerMove(grid) {
    const isH = this.axis === 'horizontal';
    const dc = isH ? this.pacerDir : 0;
    const dr = isH ? 0 : this.pacerDir;
    
    const nc = this.col + dc;
    const nr = this.row + dr;
    
    if (grid.isWalkable(nc, nr)) {
      return { col: nc, row: nr };
    } else {
      // Reverse direction
      this.pacerDir *= -1;
      const rc = this.col + (isH ? this.pacerDir : 0);
      const rr = this.row + (isH ? 0 : this.pacerDir);
      if (grid.isWalkable(rc, rr)) return { col: rc, row: rr };
      return null;
    }
  }
  
  /**
   * Execute a move. Unflips the tile it lands on.
   */
  executeMove(grid, playerCol, playerRow) {
    if (this.moving) return false;
    
    const next = this.getNextMove(grid, playerCol, playerRow);
    if (!next) return false;
    
    this.moving = true;
    this.col = next.col;
    this.row = next.row;
    
    const target = gridToPixel(next.col, next.row);
    
    this.scene.tweens.add({
      targets: this,
      duration: 200,
      ease: 'Power1',
      onComplete: () => {
        this.moving = false;
        this.drawAt(target.x, target.y);
        
        // Unflip the tile we landed on
        const tile = grid.getTile(this.col, this.row);
        if (tile && tile.flipped) {
          tile.unflip();
        }
      }
    });
    
    this.drawAt(target.x, target.y);
    return true;
  }
  
  /**
   * Check if enemy is at same position as player
   */
  isAtPlayer(playerCol, playerRow) {
    return this.col === playerCol && this.row === playerRow;
  }
  
  destroy() {
    this.graphics.destroy();
  }
}
