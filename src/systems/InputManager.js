// ============================================================
// GRIDSHIFT — Input Manager
// Handles keyboard input with press-vs-hold distinction
// ============================================================

import { DIRECTION } from '../utils/Constants.js';

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    // Repeat rate limiting for held keys
    this.repeatDelay = 180;  // ms between repeated moves
    this.lastMoveTime = 0;
  }
  
  /**
   * Get direction if a movement key was just pressed or held long enough
   */
  getDirection(time) {
    const elapsed = time - this.lastMoveTime;
    
    // Check for just-pressed first (instant response)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.lastMoveTime = time;
      return DIRECTION.UP;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.lastMoveTime = time;
      return DIRECTION.DOWN;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.lastMoveTime = time;
      return DIRECTION.LEFT;
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.lastMoveTime = time;
      return DIRECTION.RIGHT;
    }
    
    // Check for held keys with repeat rate
    if (elapsed < this.repeatDelay) return null;
    
    if (this.cursors.up.isDown) { this.lastMoveTime = time; return DIRECTION.UP; }
    if (this.cursors.down.isDown) { this.lastMoveTime = time; return DIRECTION.DOWN; }
    if (this.cursors.left.isDown) { this.lastMoveTime = time; return DIRECTION.LEFT; }
    if (this.cursors.right.isDown) { this.lastMoveTime = time; return DIRECTION.RIGHT; }
    
    return null;
  }
  
  /** Space just pressed */
  isActionPressed() {
    return Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }
  
  /** Enter just pressed */
  isConfirmPressed() {
    return Phaser.Input.Keyboard.JustDown(this.enterKey);
  }
  
  /** Escape just pressed */
  isCancelPressed() {
    return Phaser.Input.Keyboard.JustDown(this.escKey);
  }
  
  destroy() {
    // Phaser handles cleanup
  }
}
