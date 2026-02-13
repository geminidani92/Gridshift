// ============================================================
// GRIDSHIFT — MapNode (visual)
// Draws a node on the roguelike map
// ============================================================

import { CONFIG } from '../config.js';

const NODE_COLORS = {
  [CONFIG.MAP_NODE_TYPES.PUZZLE]: CONFIG.COLORS.MAP_NODE_PUZZLE,
  [CONFIG.MAP_NODE_TYPES.ELITE]: CONFIG.COLORS.MAP_NODE_ELITE,
  [CONFIG.MAP_NODE_TYPES.CHEST]: CONFIG.COLORS.MAP_NODE_CHEST,
  [CONFIG.MAP_NODE_TYPES.CAMPFIRE]: CONFIG.COLORS.MAP_NODE_CAMPFIRE,
  [CONFIG.MAP_NODE_TYPES.BOSS]: CONFIG.COLORS.MAP_NODE_BOSS,
};

const NODE_ICONS = {
  [CONFIG.MAP_NODE_TYPES.PUZZLE]: '⬡',
  [CONFIG.MAP_NODE_TYPES.ELITE]: '☠',
  [CONFIG.MAP_NODE_TYPES.CHEST]: '◆',
  [CONFIG.MAP_NODE_TYPES.CAMPFIRE]: '♨',
  [CONFIG.MAP_NODE_TYPES.BOSS]: '★',
};

export class MapNode {
  constructor(scene, x, y, nodeData, selectable = false) {
    this.scene = scene;
    this.nodeData = nodeData;
    this.x = x;
    this.y = y;
    this.selectable = selectable;
    
    const color = NODE_COLORS[nodeData.type] || 0xffffff;
    const size = nodeData.type === CONFIG.MAP_NODE_TYPES.BOSS ? 24 : 18;
    
    // Background circle
    this.graphics = scene.add.graphics();
    
    if (nodeData.completed) {
      this.graphics.fillStyle(color, 0.2);
      this.graphics.fillCircle(x, y, size);
      this.graphics.lineStyle(2, color, 0.4);
      this.graphics.strokeCircle(x, y, size);
    } else if (selectable) {
      // Glow for selectable
      this.graphics.fillStyle(color, 0.15);
      this.graphics.fillCircle(x, y, size + 8);
      this.graphics.fillStyle(color, 0.9);
      this.graphics.fillCircle(x, y, size);
      this.graphics.lineStyle(2, 0xffffff, 0.5);
      this.graphics.strokeCircle(x, y, size);
    } else {
      this.graphics.fillStyle(color, 0.5);
      this.graphics.fillCircle(x, y, size);
    }
    
    // Icon text
    this.icon = scene.add.text(x, y, NODE_ICONS[nodeData.type] || '?', {
      fontFamily: 'monospace',
      fontSize: nodeData.type === CONFIG.MAP_NODE_TYPES.BOSS ? '20px' : '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(15);
    
    // Make interactive if selectable
    if (selectable) {
      this.hitArea = scene.add.circle(x, y, size + 8)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.01);
      
      // Pulse animation
      scene.tweens.add({
        targets: this.graphics,
        alpha: 0.7,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }
  }
  
  onSelect(callback) {
    if (this.hitArea) {
      this.hitArea.on('pointerdown', () => callback(this.nodeData));
    }
  }
  
  destroy() {
    this.graphics.destroy();
    this.icon.destroy();
    if (this.hitArea) this.hitArea.destroy();
  }
}
