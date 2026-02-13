// ============================================================
// GRIDSHIFT — Game Over Scene
// Shows score, reason for game over, retry options
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SCENE_KEYS } from '../utils/Constants.js';
import { SaveManager } from '../systems/SaveManager.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }
  
  init(data) {
    this.finalScore = data.score || 0;
    this.message = data.message || 'GAME OVER';
    this.mapData = data.mapData;
    this.currentRow = data.currentRow;
    this.currentNodeId = data.currentNodeId;
    this.completedNodes = data.completedNodes;
  }
  
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;
    
    // Save high score
    SaveManager.saveHighScore(this.finalScore);
    const highScore = SaveManager.getHighScore();
    const isNewHigh = this.finalScore >= highScore && this.finalScore > 0;
    
    // Message
    this.add.text(cx, cy - 80, this.message, {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#e94560',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Score
    this.add.text(cx, cy - 20, `SCORE: ${this.finalScore}`, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f4f4f8',
    }).setOrigin(0.5);
    
    // High score
    if (isNewHigh) {
      const newHigh = this.add.text(cx, cy + 15, 'NEW HIGH SCORE!', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f59e0b',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: newHigh,
        alpha: 0.4,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(cx, cy + 15, `HIGH SCORE: ${highScore}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#555570',
      }).setOrigin(0.5);
    }
    
    // Retry option
    const retryText = this.add.text(cx, cy + 70, '[ ENTER — NEW RUN ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#22d3ee',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    this.tweens.add({
      targets: retryText,
      alpha: 0.4,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    
    // Menu option
    const menuText = this.add.text(cx, cy + 110, '[ ESC — MENU ]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#555570',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    // Input handlers
    this.input.keyboard.once('keydown-ENTER', () => this.newRun());
    this.input.keyboard.once('keydown-SPACE', () => this.newRun());
    this.input.keyboard.once('keydown-ESC', () => this.goToMenu());
    retryText.on('pointerdown', () => this.newRun());
    menuText.on('pointerdown', () => this.goToMenu());
  }
  
  newRun() {
    // Start fresh run with new map
    this.scene.start(SCENE_KEYS.MAP, {});
  }
  
  goToMenu() {
    this.scene.start(SCENE_KEYS.MENU);
  }
}
