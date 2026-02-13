// ============================================================
// GRIDSHIFT — Save Manager
// Saves/loads progress to localStorage
// ============================================================

const SAVE_KEY = 'gridshift_save';

export class SaveManager {
  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('SaveManager: could not save', e);
    }
  }
  
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('SaveManager: could not load', e);
      return null;
    }
  }
  
  static clear() {
    localStorage.removeItem(SAVE_KEY);
  }
  
  static getHighScore() {
    const data = SaveManager.load();
    return data?.highScore || 0;
  }
  
  static saveHighScore(score) {
    const data = SaveManager.load() || {};
    if (score > (data.highScore || 0)) {
      data.highScore = score;
      SaveManager.save(data);
    }
  }
}
