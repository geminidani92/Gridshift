// ============================================================
// GRIDSHIFT — Level Manager
// Loads level data from JSON, tracks progress
// ============================================================

export class LevelManager {
  constructor() {
    this.levels = [];
    this.currentIndex = 0;
  }
  
  loadFromJSON(data) {
    this.levels = data.levels || [];
  }
  
  getLevel(index) {
    return this.levels[index] || null;
  }
  
  getCurrentLevel() {
    return this.getLevel(this.currentIndex);
  }
  
  nextLevel() {
    this.currentIndex++;
    return this.getCurrentLevel();
  }
  
  setLevel(index) {
    this.currentIndex = index;
  }
  
  get totalLevels() {
    return this.levels.length;
  }
  
  get isLastLevel() {
    return this.currentIndex >= this.levels.length - 1;
  }
  
  reset() {
    this.currentIndex = 0;
  }
}
