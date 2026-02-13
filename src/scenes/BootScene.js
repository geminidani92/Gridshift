// ============================================================
// GRIDSHIFT — Boot Scene
// Preloads all assets and initializes managers
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SCENE_KEYS } from '../utils/Constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }
  
  preload() {
    // Loading bar
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;
    
    const barBg = this.add.graphics();
    barBg.fillStyle(CONFIG.COLORS.BG_MEDIUM, 1);
    barBg.fillRect(w * 0.25, h / 2 - 4, w * 0.5, 8);
    
    const bar = this.add.graphics();
    
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(CONFIG.COLORS.UI_ACCENT, 1);
      bar.fillRect(w * 0.25 + 2, h / 2 - 2, (w * 0.5 - 4) * value, 4);
    });
    
    this.load.on('complete', () => {
      bar.destroy();
      barBg.destroy();
    });
    
    // Load level data
    this.load.json('levels', 'assets/data/levels.json');
  }
  
  create() {
    this.scene.start(SCENE_KEYS.MENU);
  }
}
