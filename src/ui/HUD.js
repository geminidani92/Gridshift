// ============================================================
// GRIDSHIFT — HUD
// Displays score, level name, remaining tiles, timer
// ============================================================

import { CONFIG } from '../config.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    
    const style = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f4f4f8',
    };
    
    const dimStyle = {
      ...style,
      fontSize: '11px',
      color: '#555570',
    };
    
    // Level name (top center)
    this.levelText = scene.add.text(CONFIG.GAME_WIDTH / 2, 16, '', {
      ...style,
      fontSize: '16px',
    }).setOrigin(0.5, 0).setDepth(20);
    
    // Score (top left)
    this.scoreLabel = scene.add.text(16, 10, 'SCORE', dimStyle).setDepth(20);
    this.scoreText = scene.add.text(16, 24, '0', style).setDepth(20);
    
    // Remaining tiles (top right)
    this.tilesLabel = scene.add.text(CONFIG.GAME_WIDTH - 16, 10, 'TILES', dimStyle)
      .setOrigin(1, 0).setDepth(20);
    this.tilesText = scene.add.text(CONFIG.GAME_WIDTH - 16, 24, '0', style)
      .setOrigin(1, 0).setDepth(20);
    
    // Timer (bottom center)
    this.timerText = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 16, '', {
      ...dimStyle,
      fontSize: '13px',
    }).setOrigin(0.5, 1).setDepth(20);
    
    // Controls hint (bottom)
    this.hintText = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 4, '← → ↑ ↓ move   SPACE flip', {
      ...dimStyle,
      fontSize: '9px',
    }).setOrigin(0.5, 1).setDepth(20);
  }
  
  updateLevel(name) {
    this.levelText.setText(name);
  }
  
  updateScore(score) {
    this.scoreText.setText(score.toString());
  }
  
  updateTiles(remaining, total) {
    this.tilesText.setText(`${remaining}/${total}`);
    // Color change when close to completion
    if (remaining <= 3 && remaining > 0) {
      this.tilesText.setColor('#22d3ee');
    } else {
      this.tilesText.setColor('#f4f4f8');
    }
  }
  
  updateTimer(seconds) {
    if (seconds <= 0) {
      this.timerText.setText('');
      return;
    }
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    const text = `${min}:${sec.toString().padStart(2, '0')}`;
    this.timerText.setText(text);
    
    // Urgency color
    if (seconds <= 10) {
      this.timerText.setColor('#e94560');
    } else if (seconds <= 30) {
      this.timerText.setColor('#f59e0b');
    } else {
      this.timerText.setColor('#555570');
    }
  }
  
  showChainBonus(count) {
    const bonus = this.scene.add.text(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 40,
      `CHAIN x${count}!`,
      { fontFamily: 'monospace', fontSize: '20px', color: '#a78bfa', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(30);
    
    this.scene.tweens.add({
      targets: bonus,
      y: bonus.y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => bonus.destroy(),
    });
  }
  
  destroy() {
    this.levelText.destroy();
    this.scoreLabel.destroy();
    this.scoreText.destroy();
    this.tilesLabel.destroy();
    this.tilesText.destroy();
    this.timerText.destroy();
    this.hintText.destroy();
  }
}
