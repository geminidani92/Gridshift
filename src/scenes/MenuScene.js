// ============================================================
// GRIDSHIFT — Menu Scene
// Title screen with start option
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SCENE_KEYS } from '../utils/Constants.js';
import { SaveManager } from '../systems/SaveManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }
  
  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;
    
    // Background
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    
    // Decorative grid pattern
    const grid = this.add.graphics();
    grid.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.15);
    for (let x = 0; x < CONFIG.GAME_WIDTH; x += 64) {
      grid.lineBetween(x, 0, x, CONFIG.GAME_HEIGHT);
    }
    for (let y = 0; y < CONFIG.GAME_HEIGHT; y += 64) {
      grid.lineBetween(0, y, CONFIG.GAME_WIDTH, y);
    }
    
    // Title
    this.add.text(cx, cy - 100, 'GRIDSHIFT', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#7c3aed',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(cx, cy - 55, 'a puzzle roguelike', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#555570',
    }).setOrigin(0.5);
    
    // High score
    const highScore = SaveManager.getHighScore();
    if (highScore > 0) {
      this.add.text(cx, cy, `HIGH SCORE: ${highScore}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#f59e0b',
      }).setOrigin(0.5);
    }
    
    // Start prompt
    const startText = this.add.text(cx, cy + 60, '[ PRESS ENTER OR CLICK TO START ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#22d3ee',
    }).setOrigin(0.5);
    
    // Blink animation
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    
    // Controls info
    this.add.text(cx, cy + 130, '← → ↑ ↓  move\nSPACE  flip tile\nGoal: flip all tiles dark', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#3a3a50',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);
    
    // Input
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }
  
  startGame() {
    this.scene.start(SCENE_KEYS.MAP);
  }
}
