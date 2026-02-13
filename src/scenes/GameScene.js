// ============================================================
// GRIDSHIFT — Game Scene
// Main puzzle gameplay: grid, player, enemies, flip mechanic
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SCENE_KEYS, EVENTS } from '../utils/Constants.js';
import { Grid } from '../objects/Grid.js';
import { Player } from '../objects/Player.js';
import { Enemy } from '../objects/Enemy.js';
import { InputManager } from '../systems/InputManager.js';
import { LevelManager } from '../systems/LevelManager.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME);
  }
  
  init(data) {
    this.mapData = data.mapData;
    this.currentRow = data.currentRow;
    this.currentNodeId = data.currentNodeId;
    this.score = data.score || 0;
    this.completedNodes = data.completedNodes || new Set();
    this.nodeType = data.nodeType || CONFIG.MAP_NODE_TYPES.PUZZLE;
  }
  
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    
    // Initialize managers
    this.inputManager = new InputManager(this);
    this.levelManager = new LevelManager();
    this.levelManager.loadFromJSON(this.cache.json.get('levels'));
    
    // Pick a level based on node type
    const levelIndex = this.pickLevel();
    this.levelManager.setLevel(levelIndex);
    const levelData = this.levelManager.getCurrentLevel();
    
    if (!levelData) {
      console.error('No level data found!');
      this.scene.start(SCENE_KEYS.MENU);
      return;
    }
    
    // Build grid
    this.grid = new Grid(this, levelData.grid);
    
    // Create player
    this.player = new Player(this, levelData.playerStart.col, levelData.playerStart.row);
    
    // Create enemies
    this.enemies = [];
    for (const enemyData of levelData.enemies) {
      const enemy = new Enemy(this, enemyData.col, enemyData.row, enemyData.type, {
        axis: enemyData.axis,
      });
      this.enemies.push(enemy);
    }
    
    // Enemy move timer
    this.enemyTimer = this.time.addEvent({
      delay: CONFIG.ENEMY_MOVE_INTERVAL,
      callback: this.moveEnemies,
      callbackScope: this,
      loop: true,
    });
    
    // Level timer
    this.timeRemaining = levelData.timeLimit || 0;
    if (this.timeRemaining > 0) {
      this.levelTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.timeRemaining--;
          this.hud.updateTimer(this.timeRemaining);
          if (this.timeRemaining <= 0) {
            this.gameOver(false, 'TIME UP');
          }
        },
        loop: true,
      });
    }
    
    // HUD
    this.hud = new HUD(this);
    this.hud.updateLevel(levelData.name);
    this.hud.updateScore(this.score);
    this.hud.updateTiles(this.grid.remaining(), this.grid.totalFlippable());
    this.hud.updateTimer(this.timeRemaining);
    
    // Events
    this.events.on(EVENTS.TILE_FLIPPED, (count) => {
      this.score += CONFIG.SCORE_TILE_FLIP * count;
      this.hud.updateScore(this.score);
      this.hud.updateTiles(this.grid.remaining(), this.grid.totalFlippable());
      
      // Check win
      if (this.grid.isComplete()) {
        this.time.delayedCall(300, () => this.levelComplete());
      }
    });
    
    this.events.on(EVENTS.CHAIN_FLIP, (count) => {
      this.score += CONFIG.SCORE_CHAIN_BONUS * count;
      this.hud.updateScore(this.score);
      this.hud.showChainBonus(count);
    });
    
    this.gameActive = true;
    
    // Flip the starting tile
    this.grid.flipAt(levelData.playerStart.col, levelData.playerStart.row);
  }
  
  pickLevel() {
    const total = this.levelManager.totalLevels;
    if (this.nodeType === CONFIG.MAP_NODE_TYPES.ELITE) {
      // Harder levels (last third)
      return Phaser.Math.Between(Math.floor(total * 0.6), total - 1);
    } else if (this.nodeType === CONFIG.MAP_NODE_TYPES.BOSS) {
      // Hardest level
      return total - 1;
    }
    // Normal: random from first 70%
    return Phaser.Math.Between(0, Math.floor(total * 0.7));
  }
  
  update(time) {
    if (!this.gameActive) return;
    
    // Player movement
    const dir = this.inputManager.getDirection(time);
    if (dir && !this.player.moving) {
      const newCol = this.player.col + dir.x;
      const newRow = this.player.row + dir.y;
      
      if (this.player.moveTo(newCol, newRow, this.grid)) {
        // Check enemy collision after move
        this.checkEnemyCollision();
      }
    }
    
    // Flip action
    if (this.inputManager.isActionPressed() && !this.player.moving) {
      this.grid.flipAt(this.player.col, this.player.row);
    }
    
    // Escape to map
    if (this.inputManager.isCancelPressed()) {
      this.returnToMap(false);
    }
  }
  
  moveEnemies() {
    if (!this.gameActive) return;
    
    for (const enemy of this.enemies) {
      enemy.executeMove(this.grid, this.player.col, this.player.row);
    }
    
    // Update tile count after enemies potentially unflipped tiles
    this.time.delayedCall(250, () => {
      if (this.gameActive) {
        this.hud.updateTiles(this.grid.remaining(), this.grid.totalFlippable());
      }
    });
    
    // Check collision
    this.time.delayedCall(220, () => {
      if (this.gameActive) this.checkEnemyCollision();
    });
  }
  
  checkEnemyCollision() {
    for (const enemy of this.enemies) {
      if (enemy.isAtPlayer(this.player.col, this.player.row)) {
        this.gameOver(false, 'CAUGHT!');
        return;
      }
    }
  }
  
  levelComplete() {
    this.gameActive = false;
    if (this.enemyTimer) this.enemyTimer.remove();
    if (this.levelTimer) this.levelTimer.remove();
    
    // Time bonus
    if (this.timeRemaining > 0) {
      this.score += CONFIG.SCORE_TIME_BONUS * this.timeRemaining;
    }
    this.score += CONFIG.SCORE_LEVEL_CLEAR;
    
    // Flash effect
    this.cameras.main.flash(300, 124, 58, 237);
    
    // Show completion
    const overlay = this.add.graphics().setDepth(50);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 30, 'LEVEL COMPLETE!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#7c3aed', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);
    
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 10, `+${CONFIG.SCORE_LEVEL_CLEAR} points`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#a78bfa',
    }).setOrigin(0.5).setDepth(51);
    
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 50, '[ CLICK TO CONTINUE ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888',
    }).setOrigin(0.5).setDepth(51);
    
    this.time.delayedCall(500, () => {
      this.input.once('pointerdown', () => this.returnToMap(true));
      this.input.keyboard.once('keydown-ENTER', () => this.returnToMap(true));
      this.input.keyboard.once('keydown-SPACE', () => this.returnToMap(true));
    });
  }
  
  gameOver(won, message) {
    this.gameActive = false;
    if (this.enemyTimer) this.enemyTimer.remove();
    if (this.levelTimer) this.levelTimer.remove();
    
    this.scene.start(SCENE_KEYS.GAME_OVER, {
      score: this.score,
      message: message || 'GAME OVER',
      mapData: this.mapData,
      currentRow: this.currentRow,
      currentNodeId: this.currentNodeId,
      completedNodes: this.completedNodes,
    });
  }
  
  returnToMap(completed) {
    if (completed) {
      this.completedNodes.add(this.currentNodeId);
    }
    
    this.scene.start(SCENE_KEYS.MAP, {
      mapData: this.mapData,
      currentRow: this.currentRow,
      currentNodeId: this.currentNodeId,
      score: this.score,
      completedNodes: this.completedNodes,
    });
  }
}
