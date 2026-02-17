// ============================================================
// GRIDSHIFT — Complete Game Bundle
// A puzzle roguelike built with Phaser 3
// ============================================================

(function() {
'use strict';

// ============================================================
// CONFIG — All tunable values
// ============================================================
const CONFIG = {
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  GRID_COLS: 8,
  GRID_ROWS: 7,
  TILE_SIZE: 64,
  GRID_OFFSET_X: 0,
  GRID_OFFSET_Y: 0,
  PLAYER_MOVE_SPEED: 120,
  ENEMY_MOVE_INTERVAL: 1500,
  ENEMY_TYPES: { WANDERER: 'wanderer', CHASER: 'chaser', PACER: 'pacer' },
  FLIP_CHAIN_DELAY: 50,
  SCORE_TILE_FLIP: 10,
  SCORE_CHAIN_BONUS: 25,
  SCORE_LEVEL_CLEAR: 500,
  SCORE_TIME_BONUS: 5,
  MAP_ROWS: 5,
  MAP_MIN_NODES: 2,
  MAP_MAX_NODES: 4,
  NODE_TYPES: { PUZZLE: 'puzzle', ELITE: 'elite', CHEST: 'chest', CAMPFIRE: 'campfire', BOSS: 'boss' },
  COLORS: {
    BG_DARK: 0x0a0a12,
    BG_MEDIUM: 0x14141f,
    TILE_LIGHT: 0x2a2a3e,
    TILE_DARK: 0x7c3aed,
    TILE_FLIPPED: 0xa78bfa,
    PLAYER: 0x22d3ee,
    ENEMY: 0xe94560,
    BLOCK: 0x555570,
    HOLE: 0x050508,
    UI_TEXT: 0xf4f4f8,
    UI_ACCENT: 0x7c3aed,
    UI_DIM: 0x555570,
    GRID_LINE: 0x1e1e2e,
    MAP_PATH: 0x3a3a50,
    NODE_PUZZLE: 0x7c3aed,
    NODE_ELITE: 0xe94560,
    NODE_CHEST: 0xf59e0b,
    NODE_CAMPFIRE: 0x22d3ee,
    NODE_BOSS: 0xdc2626,
  }
};
CONFIG.GRID_OFFSET_X = Math.floor((CONFIG.GAME_WIDTH - CONFIG.GRID_COLS * CONFIG.TILE_SIZE) / 2);
CONFIG.GRID_OFFSET_Y = Math.floor((CONFIG.GAME_HEIGHT - CONFIG.GRID_ROWS * CONFIG.TILE_SIZE) / 2) + 20;

// ============================================================
// CONSTANTS
// ============================================================
const CELL = { EMPTY: 0, FLIPPED: 1, BLOCK: 2, HOLE: 3 };
const DIR = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};
const EVENTS = {
  TILE_FLIPPED: 'tile-flipped',
  CHAIN_FLIP: 'chain-flip',
};

// ============================================================
// HELPERS
// ============================================================
function gridToPixel(col, row) {
  return {
    x: CONFIG.GRID_OFFSET_X + col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
    y: CONFIG.GRID_OFFSET_Y + row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
  };
}

function inBounds(col, row) {
  return col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// SAVE MANAGER
// ============================================================
const SaveManager = {
  KEY: 'gridshift_save',
  getHighScore() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY));
      return d?.highScore || 0;
    } catch { return 0; }
  },
  saveHighScore(score) {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY)) || {};
      if (score > (d.highScore || 0)) {
        d.highScore = score;
        localStorage.setItem(this.KEY, JSON.stringify(d));
      }
    } catch {}
  }
};

// ============================================================
// TILE
// ============================================================
class Tile {
  constructor(scene, col, row, cellType) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.cellType = cellType;
    this.flipped = false;
    const pos = gridToPixel(col, row);
    this.x = pos.x;
    this.y = pos.y;
    this.graphics = scene.add.graphics();
    this.draw();
  }

  draw() {
    const g = this.graphics;
    g.clear();
    const size = CONFIG.TILE_SIZE - 4;
    const half = size / 2;
    const x = this.x - half;
    const y = this.y - half;
    const r = 6;

    switch (this.cellType) {
      case CELL.BLOCK:
        g.fillStyle(CONFIG.COLORS.BLOCK, 1);
        g.fillRoundedRect(x, y, size, size, r);
        g.lineStyle(2, CONFIG.COLORS.BG_MEDIUM, 0.4);
        g.lineBetween(x + 8, y + 8, x + size - 8, y + size - 8);
        g.lineBetween(x + size - 8, y + 8, x + 8, y + size - 8);
        break;
      case CELL.HOLE:
        g.fillStyle(CONFIG.COLORS.HOLE, 1);
        g.fillRoundedRect(x + 6, y + 6, size - 12, size - 12, r);
        break;
      default:
        if (this.flipped) {
          g.fillStyle(CONFIG.COLORS.TILE_DARK, 1);
          g.fillRoundedRect(x, y, size, size, r);
          g.fillStyle(CONFIG.COLORS.TILE_FLIPPED, 0.15);
          g.fillRoundedRect(x + 4, y + 4, size - 8, size - 8, r - 2);
        } else {
          g.fillStyle(CONFIG.COLORS.TILE_LIGHT, 1);
          g.fillRoundedRect(x, y, size, size, r);
          g.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.5);
          g.strokeRoundedRect(x + 2, y + 2, size - 4, size - 4, r - 1);
        }
    }
  }

  flip() {
    if (this.cellType !== CELL.EMPTY && this.cellType !== CELL.FLIPPED) return false;
    this.flipped = !this.flipped;
    this.cellType = this.flipped ? CELL.FLIPPED : CELL.EMPTY;
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 0,
      duration: 80,
      yoyo: true,
      onYoyo: () => this.draw(),
      onComplete: () => this.graphics.setScale(1),
    });
    return true;
  }

  unflip() {
    if (!this.flipped) return;
    this.flipped = false;
    this.cellType = CELL.EMPTY;
    this.draw();
  }

  isWalkable() { return this.cellType === CELL.EMPTY || this.cellType === CELL.FLIPPED; }
  isFlippable() { return this.cellType === CELL.EMPTY || this.cellType === CELL.FLIPPED; }
  destroy() { this.graphics.destroy(); }
}

// ============================================================
// GRID — 7x8 grid + chain flip mechanic
// ============================================================
class Grid {
  constructor(scene, levelData) {
    this.scene = scene;
    this.tiles = [];
    this.build(levelData);
  }

  build(levelData) {
    this.destroy();
    this.tiles = [];

    // Background
    this.bgGraphics = this.scene.add.graphics();
    this.bgGraphics.fillStyle(CONFIG.COLORS.BG_MEDIUM, 1);
    this.bgGraphics.fillRoundedRect(
      CONFIG.GRID_OFFSET_X - 8, CONFIG.GRID_OFFSET_Y - 8,
      CONFIG.GRID_COLS * CONFIG.TILE_SIZE + 16, CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 16, 12
    );
    this.bgGraphics.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.3);
    for (let c = 0; c <= CONFIG.GRID_COLS; c++) {
      const x = CONFIG.GRID_OFFSET_X + c * CONFIG.TILE_SIZE;
      this.bgGraphics.lineBetween(x, CONFIG.GRID_OFFSET_Y, x, CONFIG.GRID_OFFSET_Y + CONFIG.GRID_ROWS * CONFIG.TILE_SIZE);
    }
    for (let r = 0; r <= CONFIG.GRID_ROWS; r++) {
      const y = CONFIG.GRID_OFFSET_Y + r * CONFIG.TILE_SIZE;
      this.bgGraphics.lineBetween(CONFIG.GRID_OFFSET_X, y, CONFIG.GRID_OFFSET_X + CONFIG.GRID_COLS * CONFIG.TILE_SIZE, y);
    }

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const ct = levelData[row]?.[col] ?? CELL.EMPTY;
        this.tiles[row][col] = new Tile(this.scene, col, row, ct);
      }
    }
  }

  getTile(col, row) {
    if (!inBounds(col, row)) return null;
    return this.tiles[row][col];
  }

  flipAt(col, row) {
    const tile = this.getTile(col, row);
    if (!tile || !tile.isFlippable()) return 0;

    let count = 0;
    const chains = this.findChains(col, row);

    if (chains.length > 0) {
      for (const chain of chains) {
        for (const t of chain) {
          if (!t.flipped) { t.flip(); count++; }
        }
      }
      if (!tile.flipped) { tile.flip(); count++; }
      if (count > 1) this.scene.events.emit(EVENTS.CHAIN_FLIP, count);
    } else {
      tile.flip();
      count = 1;
    }

    if (count > 0) this.scene.events.emit(EVENTS.TILE_FLIPPED, count);
    return count;
  }

  findChains(col, row) {
    const chains = [];
    const directions = [{ dc: 0, dr: -1 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }];

    for (const { dc, dr } of directions) {
      const chain = [];
      let c = col + dc, r = row + dr;
      while (inBounds(c, r)) {
        const t = this.getTile(c, r);
        if (!t || !t.isFlippable()) break;
        chain.push(t);
        if (t.flipped) {
          const toFlip = chain.filter(tile => !tile.flipped);
          if (toFlip.length > 0) chains.push(toFlip);
          break;
        }
        c += dc; r += dr;
      }
    }
    return chains;
  }

  isComplete() {
    for (let r = 0; r < CONFIG.GRID_ROWS; r++)
      for (let c = 0; c < CONFIG.GRID_COLS; c++)
        if (this.tiles[r][c].cellType === CELL.EMPTY) return false;
    return true;
  }

  remaining() {
    let n = 0;
    for (let r = 0; r < CONFIG.GRID_ROWS; r++)
      for (let c = 0; c < CONFIG.GRID_COLS; c++)
        if (this.tiles[r][c].cellType === CELL.EMPTY) n++;
    return n;
  }

  totalFlippable() {
    let n = 0;
    for (let r = 0; r < CONFIG.GRID_ROWS; r++)
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const ct = this.tiles[r][c].cellType;
        if (ct === CELL.EMPTY || ct === CELL.FLIPPED) n++;
      }
    return n;
  }

  isWalkable(col, row) {
    const t = this.getTile(col, row);
    return t ? t.isWalkable() : false;
  }

  destroy() {
    for (const row of this.tiles) for (const t of row) t.destroy();
    this.tiles = [];
    if (this.bgGraphics) { this.bgGraphics.destroy(); this.bgGraphics = null; }
  }
}

// ============================================================
// PLAYER
// ============================================================
class Player {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.moving = false;
    this.graphics = scene.add.graphics().setDepth(10);
    this.drawAt(gridToPixel(col, row));
  }

  drawAt(pos) {
    const g = this.graphics;
    g.clear();
    const size = CONFIG.TILE_SIZE * 0.35;
    g.fillStyle(CONFIG.COLORS.PLAYER, 0.15);
    g.fillCircle(pos.x, pos.y, size + 6);
    g.fillStyle(CONFIG.COLORS.PLAYER, 1);
    g.fillCircle(pos.x, pos.y, size);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(pos.x - size * 0.2, pos.y - size * 0.2, size * 0.4);
  }

  moveTo(newCol, newRow, grid) {
    if (this.moving) return false;
    if (!grid.isWalkable(newCol, newRow)) return false;
    this.moving = true;
    this.col = newCol;
    this.row = newRow;
    const target = gridToPixel(newCol, newRow);
    this.drawAt(target);
    // Small delay to prevent instant repeat
    this.scene.time.delayedCall(CONFIG.PLAYER_MOVE_SPEED, () => { this.moving = false; });
    return true;
  }

  setPosition(col, row) {
    this.col = col; this.row = row;
    this.drawAt(gridToPixel(col, row));
  }

  destroy() { this.graphics.destroy(); }
}

// ============================================================
// ENEMY — wanderer, chaser, pacer
// ============================================================
class Enemy {
  constructor(scene, col, row, type, options = {}) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;
    this.moving = false;
    this.axis = options.axis || 'horizontal';
    this.pacerDir = 1;
    this.graphics = scene.add.graphics().setDepth(8);
    this.drawAt(gridToPixel(col, row));
  }

  drawAt(pos) {
    const g = this.graphics;
    g.clear();
    const size = CONFIG.TILE_SIZE * 0.3;
    g.fillStyle(CONFIG.COLORS.ENEMY, 0.15);
    g.fillCircle(pos.x, pos.y, size + 5);
    g.fillStyle(CONFIG.COLORS.ENEMY, 1);
    g.beginPath();
    g.moveTo(pos.x, pos.y - size);
    g.lineTo(pos.x + size, pos.y);
    g.lineTo(pos.x, pos.y + size);
    g.lineTo(pos.x - size, pos.y);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(pos.x - size * 0.25, pos.y - size * 0.15, 3);
    g.fillCircle(pos.x + size * 0.25, pos.y - size * 0.15, 3);
  }

  getNextMove(grid, playerCol, playerRow) {
    switch (this.type) {
      case 'wanderer': return this.wandererMove(grid);
      case 'chaser': return this.chaserMove(grid, playerCol, playerRow);
      case 'pacer': return this.pacerMove(grid);
      default: return null;
    }
  }

  wandererMove(grid) {
    const dirs = Object.values(DIR).sort(() => Math.random() - 0.5);
    for (const d of dirs) {
      const nc = this.col + d.x, nr = this.row + d.y;
      if (grid.isWalkable(nc, nr)) return { col: nc, row: nr };
    }
    return null;
  }

  chaserMove(grid, pc, pr) {
    const dx = Math.sign(pc - this.col), dy = Math.sign(pr - this.row);
    const tries = [];
    if (dx !== 0) tries.push({ col: this.col + dx, row: this.row });
    if (dy !== 0) tries.push({ col: this.col, row: this.row + dy });
    if (dx === 0 && dy !== 0) tries.push({ col: this.col + pick([-1, 1]), row: this.row });
    if (dy === 0 && dx !== 0) tries.push({ col: this.col, row: this.row + pick([-1, 1]) });
    for (const t of tries) if (grid.isWalkable(t.col, t.row)) return t;
    return null;
  }

  pacerMove(grid) {
    const isH = this.axis === 'horizontal';
    const dc = isH ? this.pacerDir : 0, dr = isH ? 0 : this.pacerDir;
    let nc = this.col + dc, nr = this.row + dr;
    if (grid.isWalkable(nc, nr)) return { col: nc, row: nr };
    this.pacerDir *= -1;
    nc = this.col + (isH ? this.pacerDir : 0);
    nr = this.row + (isH ? 0 : this.pacerDir);
    if (grid.isWalkable(nc, nr)) return { col: nc, row: nr };
    return null;
  }

  executeMove(grid, playerCol, playerRow) {
    if (this.moving) return false;
    const next = this.getNextMove(grid, playerCol, playerRow);
    if (!next) return false;
    this.moving = true;
    this.col = next.col;
    this.row = next.row;
    const target = gridToPixel(next.col, next.row);
    this.drawAt(target);
    this.scene.time.delayedCall(200, () => {
      this.moving = false;
      const tile = grid.getTile(this.col, this.row);
      if (tile && tile.flipped) tile.unflip();
    });
    return true;
  }

  destroy() { this.graphics.destroy(); }
}

// ============================================================
// HUD
// ============================================================
class HUD {
  constructor(scene) {
    this.scene = scene;
    const style = { fontFamily: 'monospace', fontSize: '14px', color: '#f4f4f8' };
    const dim = { fontFamily: 'monospace', fontSize: '11px', color: '#555570' };

    this.levelText = scene.add.text(CONFIG.GAME_WIDTH / 2, 16, '', { ...style, fontSize: '16px' }).setOrigin(0.5, 0).setDepth(20);
    this.scoreLabel = scene.add.text(16, 10, 'SCORE', dim).setDepth(20);
    this.scoreText = scene.add.text(16, 24, '0', style).setDepth(20);
    this.tilesLabel = scene.add.text(CONFIG.GAME_WIDTH - 16, 10, 'TILES', dim).setOrigin(1, 0).setDepth(20);
    this.tilesText = scene.add.text(CONFIG.GAME_WIDTH - 16, 24, '0', style).setOrigin(1, 0).setDepth(20);
    this.timerText = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 16, '', { ...dim, fontSize: '13px' }).setOrigin(0.5, 1).setDepth(20);
    this.hintText = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 4, '← → ↑ ↓ move   SPACE flip', { ...dim, fontSize: '9px' }).setOrigin(0.5, 1).setDepth(20);
  }

  updateLevel(name) { this.levelText.setText(name); }
  updateScore(score) { this.scoreText.setText(score.toString()); }

  updateTiles(remaining, total) {
    this.tilesText.setText(`${remaining}/${total}`);
    this.tilesText.setColor(remaining <= 3 && remaining > 0 ? '#22d3ee' : '#f4f4f8');
  }

  updateTimer(seconds) {
    if (seconds <= 0) { this.timerText.setText(''); return; }
    const m = Math.floor(seconds / 60), s = seconds % 60;
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);
    this.timerText.setColor(seconds <= 10 ? '#e94560' : seconds <= 30 ? '#f59e0b' : '#555570');
  }

  showChainBonus(count) {
    const bonus = this.scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 40,
      `CHAIN x${count}!`, { fontFamily: 'monospace', fontSize: '20px', color: '#a78bfa', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(30);
    this.scene.tweens.add({ targets: bonus, y: bonus.y - 40, alpha: 0, duration: 800, ease: 'Power2', onComplete: () => bonus.destroy() });
  }

  destroy() {
    [this.levelText, this.scoreLabel, this.scoreText, this.tilesLabel, this.tilesText, this.timerText, this.hintText].forEach(t => t.destroy());
  }
}

// ============================================================
// MAP GENERATOR
// ============================================================
function generateMap(numRows) {
  numRows = numRows || CONFIG.MAP_ROWS;
  const rows = [], nodes = [];
  let nid = 0;

  for (let r = 0; r < numRows; r++) {
    const count = randInt(CONFIG.MAP_MIN_NODES, CONFIG.MAP_MAX_NODES);
    const row = [];
    for (let c = 0; c < count; c++) {
      let type;
      if (r === 0) type = CONFIG.NODE_TYPES.PUZZLE;
      else if (r === numRows - 1) type = Math.random() < 0.5 ? CONFIG.NODE_TYPES.ELITE : CONFIG.NODE_TYPES.PUZZLE;
      else {
        const roll = Math.random();
        if (roll < 0.50) type = CONFIG.NODE_TYPES.PUZZLE;
        else if (roll < 0.70) type = CONFIG.NODE_TYPES.CHEST;
        else if (roll < 0.85) type = CONFIG.NODE_TYPES.CAMPFIRE;
        else type = CONFIG.NODE_TYPES.ELITE;
      }
      nodes.push({ id: nid, row: r, col: c, colCount: count, type, connections: [], completed: false });
      row.push(nid++);
    }
    rows.push(row);
  }

  // Boss
  nodes.push({ id: nid, row: numRows, col: 0, colCount: 1, type: CONFIG.NODE_TYPES.BOSS, connections: [], completed: false });
  rows.push([nid++]);

  // Connect
  for (let r = 0; r < rows.length - 1; r++) {
    for (const nid of rows[r]) {
      const connCount = Math.min(randInt(1, 2), rows[r + 1].length);
      nodes[nid].connections = [...rows[r + 1]].sort(() => Math.random() - 0.5).slice(0, connCount);
    }
    for (const nid of rows[r + 1]) {
      if (!rows[r].some(cid => nodes[cid].connections.includes(nid))) {
        nodes[pick(rows[r])].connections.push(nid);
      }
    }
  }
  return { nodes, rows };
}

// ============================================================
// LEVEL MANAGER
// ============================================================
class LevelManager {
  constructor() { this.levels = []; }
  loadFromJSON(data) { this.levels = data.levels || []; }
  getLevel(i) { return this.levels[i] || null; }
  get totalLevels() { return this.levels.length; }
}

// ============================================================
// SCENE: BOOT
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const w = CONFIG.GAME_WIDTH, h = CONFIG.GAME_HEIGHT;
    const bg = this.add.graphics();
    bg.fillStyle(CONFIG.COLORS.BG_MEDIUM, 1);
    bg.fillRect(w * 0.25, h / 2 - 4, w * 0.5, 8);
    const bar = this.add.graphics();
    this.load.on('progress', v => {
      bar.clear();
      bar.fillStyle(CONFIG.COLORS.UI_ACCENT, 1);
      bar.fillRect(w * 0.25 + 2, h / 2 - 2, (w * 0.5 - 4) * v, 4);
    });
    this.load.on('complete', () => { bar.destroy(); bg.destroy(); });
    this.load.json('levels', 'assets/data/levels.json');
  }

  create() { this.scene.start('MenuScene'); }
}

// ============================================================
// SCENE: MENU
// ============================================================
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2, cy = CONFIG.GAME_HEIGHT / 2;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);

    // Grid decor
    const grid = this.add.graphics();
    grid.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.15);
    for (let x = 0; x < CONFIG.GAME_WIDTH; x += 64) grid.lineBetween(x, 0, x, CONFIG.GAME_HEIGHT);
    for (let y = 0; y < CONFIG.GAME_HEIGHT; y += 64) grid.lineBetween(0, y, CONFIG.GAME_WIDTH, y);

    this.add.text(cx, cy - 100, 'GRIDSHIFT', { fontFamily: 'monospace', fontSize: '48px', color: '#7c3aed', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 55, 'a puzzle roguelike', { fontFamily: 'monospace', fontSize: '14px', color: '#555570' }).setOrigin(0.5);

    const hs = SaveManager.getHighScore();
    if (hs > 0) this.add.text(cx, cy, `HIGH SCORE: ${hs}`, { fontFamily: 'monospace', fontSize: '12px', color: '#f59e0b' }).setOrigin(0.5);

    const start = this.add.text(cx, cy + 60, '[ PRESS ENTER OR CLICK TO START ]', { fontFamily: 'monospace', fontSize: '14px', color: '#22d3ee' }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(cx, cy + 130, '← → ↑ ↓  move\nSPACE  flip tile\nGoal: flip all tiles dark', {
      fontFamily: 'monospace', fontSize: '11px', color: '#3a3a50', align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    const go = () => this.scene.start('MapScene');
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.once('pointerdown', go);
  }
}

// ============================================================
// SCENE: MAP (Slay the Spire style)
// ============================================================
class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  init(data) {
    this.mapData = data.mapData || generateMap();
    this.currentRow = data.currentRow ?? -1;
    this.currentNodeId = data.currentNodeId ?? null;
    this.score = data.score || 0;
    this.completedNodes = data.completedNodes || new Set();
  }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    const cx = CONFIG.GAME_WIDTH / 2;
    const { nodes, rows } = this.mapData;

    // Header
    this.add.text(cx, 18, 'CHOOSE YOUR PATH', { fontFamily: 'monospace', fontSize: '18px', color: '#7c3aed', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(16, 14, `SCORE: ${this.score}`, { fontFamily: 'monospace', fontSize: '13px', color: '#f4f4f8' });

    // Legend (top right)
    const legendItems = [
      { label: 'P  Puzzle', color: '#7c3aed' },
      { label: 'E  Elite', color: '#e94560' },
      { label: '?  Chest', color: '#f59e0b' },
      { label: 'R  Rest', color: '#22d3ee' },
      { label: 'B  BOSS', color: '#dc2626' },
    ];
    const lx = CONFIG.GAME_WIDTH - 16;
    legendItems.forEach((item, i) => {
      this.add.text(lx, 8 + i * 16, item.label, {
        fontFamily: 'monospace', fontSize: '10px', color: item.color,
      }).setOrigin(1, 0);
    });

    // Map layout
    const mapTop = 95, mapBottom = CONFIG.GAME_HEIGHT - 55;
    const rowH = (mapBottom - mapTop) / (rows.length - 1 || 1);
    const mL = 80, mR = CONFIG.GAME_WIDTH - 80;

    const pos = {};
    for (const n of nodes) {
      const ry = mapTop + n.row * rowH;
      const cw = (mR - mL) / (n.colCount - 1 || 1);
      pos[n.id] = { x: n.colCount === 1 ? cx : mL + n.col * cw, y: ry };
    }

    // Connection lines
    const lineG = this.add.graphics();
    for (const n of nodes) {
      const from = pos[n.id];
      for (const cid of n.connections) {
        lineG.lineStyle(2, CONFIG.COLORS.MAP_PATH, 0.35);
        lineG.lineBetween(from.x, from.y, pos[cid].x, pos[cid].y);
      }
    }

    // Selectable nodes
    let selectable = new Set();
    if (this.currentRow === -1) selectable = new Set(rows[0]);
    else if (this.currentNodeId !== null) selectable = new Set(nodes[this.currentNodeId].connections);

    for (const nid of this.completedNodes) nodes[nid].completed = true;

    const nodeColors = {
      puzzle: CONFIG.COLORS.NODE_PUZZLE, elite: CONFIG.COLORS.NODE_ELITE,
      chest: CONFIG.COLORS.NODE_CHEST, campfire: CONFIG.COLORS.NODE_CAMPFIRE, boss: CONFIG.COLORS.NODE_BOSS,
    };
    const nodeLabels = { puzzle: 'P', elite: 'E', chest: '?', campfire: 'R', boss: 'B' };
    const nodeNames = { puzzle: 'PUZZLE', elite: 'ELITE', chest: 'CHEST', campfire: 'REST', boss: 'BOSS' };

    for (const n of nodes) {
      const p = pos[n.id];
      const sel = selectable.has(n.id);
      const color = nodeColors[n.type] || 0xffffff;
      const sz = n.type === 'boss' ? 26 : 20;

      const g = this.add.graphics();

      if (n.completed) {
        // Completed: dim with checkmark
        g.fillStyle(color, 0.15); g.fillCircle(p.x, p.y, sz);
        g.lineStyle(2, color, 0.3); g.strokeCircle(p.x, p.y, sz);
        this.add.text(p.x, p.y, '✓', {
          fontFamily: 'monospace', fontSize: '14px', color: '#555570',
        }).setOrigin(0.5).setDepth(15);

      } else if (sel) {
        // SELECTABLE: aggressive glow
        // Outer pulse ring
        const ring = this.add.graphics();
        ring.lineStyle(3, color, 0.8);
        ring.strokeCircle(p.x, p.y, sz + 14);
        this.tweens.add({ targets: ring, alpha: 0.2, scaleX: 1.15, scaleY: 1.15, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Bright glow
        g.fillStyle(color, 0.3); g.fillCircle(p.x, p.y, sz + 10);
        g.fillStyle(color, 1); g.fillCircle(p.x, p.y, sz);
        g.lineStyle(3, 0xffffff, 0.8); g.strokeCircle(p.x, p.y, sz);

        // Pulse the node itself
        this.tweens.add({ targets: g, alpha: 0.6, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // Label
        this.add.text(p.x, p.y - 1, nodeLabels[n.type] || '?', {
          fontFamily: 'monospace', fontSize: n.type === 'boss' ? '22px' : '16px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(15);

        // Type name below node
        this.add.text(p.x, p.y + sz + 8, nodeNames[n.type] || '', {
          fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(15);

        // Big hit area
        const hit = this.add.circle(p.x, p.y, sz + 16).setInteractive({ useHandCursor: true }).setAlpha(0.01);
        hit.on('pointerdown', () => this.selectNode(n));

      } else {
        // Locked: dim
        g.fillStyle(color, 0.35); g.fillCircle(p.x, p.y, sz);
        this.add.text(p.x, p.y - 1, nodeLabels[n.type] || '?', {
          fontFamily: 'monospace', fontSize: n.type === 'boss' ? '18px' : '13px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(15).setAlpha(0.5);
      }
    }

    // Help text (big and visible)
    const helpBg = this.add.graphics();
    helpBg.fillStyle(0x7c3aed, 0.15);
    helpBg.fillRoundedRect(cx - 160, CONFIG.GAME_HEIGHT - 48, 320, 28, 6);
    this.add.text(cx, CONFIG.GAME_HEIGHT - 34, 'CLICK a glowing node to start', {
      fontFamily: 'monospace', fontSize: '13px', color: '#a78bfa', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  selectNode(n) {
    if (n.type === 'puzzle' || n.type === 'elite' || n.type === 'boss') {
      this.scene.start('GameScene', {
        mapData: this.mapData, currentRow: n.row, currentNodeId: n.id,
        score: this.score, completedNodes: this.completedNodes, nodeType: n.type,
      });
    } else if (n.type === 'chest') {
      this.score += 300;
      this.completedNodes.add(n.id);
      this.showEvent('CHEST! +300 points', '#f59e0b', n);
    } else if (n.type === 'campfire') {
      this.score += 100;
      this.completedNodes.add(n.id);
      this.showEvent('CAMPFIRE — rest +100', '#22d3ee', n);
    }
  }

  showEvent(text, color, node) {
    const ov = this.add.graphics().setDepth(50);
    ov.fillStyle(0x000000, 0.7); ov.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, text, {
      fontFamily: 'monospace', fontSize: '22px', color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 50, '[ CLICK TO CONTINUE ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888'
    }).setOrigin(0.5).setDepth(51);

    this.input.once('pointerdown', () => {
      this.scene.restart({
        mapData: this.mapData, currentRow: node.row, currentNodeId: node.id,
        score: this.score, completedNodes: this.completedNodes,
      });
    });
  }
}

// ============================================================
// SCENE: GAME (main puzzle)
// ============================================================
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.mapData = data.mapData;
    this.currentRow = data.currentRow;
    this.currentNodeId = data.currentNodeId;
    this.score = data.score || 0;
    this.completedNodes = data.completedNodes || new Set();
    this.nodeType = data.nodeType || 'puzzle';
  }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.moveDelay = 180;
    this.lastMoveTime = 0;

    // Level
    this.levelMgr = new LevelManager();
    this.levelMgr.loadFromJSON(this.cache.json.get('levels'));
    const total = this.levelMgr.totalLevels;

    let li;
    if (this.nodeType === 'elite') li = randInt(Math.floor(total * 0.6), total - 1);
    else if (this.nodeType === 'boss') li = total - 1;
    else li = randInt(0, Math.floor(total * 0.7));

    const level = this.levelMgr.getLevel(li);
    if (!level) { this.scene.start('MenuScene'); return; }

    // Build
    this.grid = new Grid(this, level.grid);
    this.player = new Player(this, level.playerStart.col, level.playerStart.row);

    this.enemies = [];
    for (const e of level.enemies) {
      this.enemies.push(new Enemy(this, e.col, e.row, e.type, { axis: e.axis }));
    }

    this.enemyTimer = this.time.addEvent({
      delay: CONFIG.ENEMY_MOVE_INTERVAL, loop: true,
      callback: () => this.moveEnemies(),
    });

    this.timeRemaining = level.timeLimit || 0;
    if (this.timeRemaining > 0) {
      this.levelTimer = this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => {
          this.timeRemaining--;
          this.hud.updateTimer(this.timeRemaining);
          if (this.timeRemaining <= 0) this.gameOver('TIME UP');
        },
      });
    }

    this.hud = new HUD(this);
    this.hud.updateLevel(level.name);
    this.hud.updateScore(this.score);
    this.hud.updateTiles(this.grid.remaining(), this.grid.totalFlippable());
    this.hud.updateTimer(this.timeRemaining);

    this.events.on(EVENTS.TILE_FLIPPED, count => {
      this.score += CONFIG.SCORE_TILE_FLIP * count;
      this.hud.updateScore(this.score);
      this.hud.updateTiles(this.grid.remaining(), this.grid.totalFlippable());
      if (this.grid.isComplete()) this.time.delayedCall(300, () => this.levelComplete());
    });

    this.events.on(EVENTS.CHAIN_FLIP, count => {
      this.score += CONFIG.SCORE_CHAIN_BONUS * count;
      this.hud.updateScore(this.score);
      this.hud.showChainBonus(count);
    });

    this.gameActive = true;
    this.grid.flipAt(level.playerStart.col, level.playerStart.row);
  }

  update(time) {
    if (!this.gameActive) return;

    // Movement
    const elapsed = time - this.lastMoveTime;
    let dir = null;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) dir = DIR.UP;
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) dir = DIR.DOWN;
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) dir = DIR.LEFT;
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) dir = DIR.RIGHT;
    else if (elapsed >= this.moveDelay) {
      if (this.cursors.up.isDown) dir = DIR.UP;
      else if (this.cursors.down.isDown) dir = DIR.DOWN;
      else if (this.cursors.left.isDown) dir = DIR.LEFT;
      else if (this.cursors.right.isDown) dir = DIR.RIGHT;
    }

    if (dir && !this.player.moving) {
      const nc = this.player.col + dir.x, nr = this.player.row + dir.y;
      if (this.player.moveTo(nc, nr, this.grid)) {
        this.lastMoveTime = time;
        this.checkEnemyCollision();
      }
    }

    // Flip
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.player.moving) {
      this.grid.flipAt(this.player.col, this.player.row);
    }

    // Escape
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.returnToMap(false);
    }
  }

  moveEnemies() {
    if (!this.gameActive) return;
    for (const e of this.enemies) e.executeMove(this.grid, this.player.col, this.player.row);
    this.time.delayedCall(250, () => {
      if (this.gameActive) this.hud.updateTiles(this.grid.remaining(), this.grid.totalFlippable());
    });
    this.time.delayedCall(220, () => { if (this.gameActive) this.checkEnemyCollision(); });
  }

  checkEnemyCollision() {
    for (const e of this.enemies)
      if (e.col === this.player.col && e.row === this.player.row) { this.gameOver('CAUGHT!'); return; }
  }

  levelComplete() {
    this.gameActive = false;
    if (this.enemyTimer) this.enemyTimer.remove();
    if (this.levelTimer) this.levelTimer.remove();
    if (this.timeRemaining > 0) this.score += CONFIG.SCORE_TIME_BONUS * this.timeRemaining;
    this.score += CONFIG.SCORE_LEVEL_CLEAR;
    this.cameras.main.flash(300, 124, 58, 237);

    const ov = this.add.graphics().setDepth(50);
    ov.fillStyle(0x000000, 0.6); ov.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 30, 'LEVEL COMPLETE!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#7c3aed', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(51);
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 10, `+${CONFIG.SCORE_LEVEL_CLEAR} points`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#a78bfa'
    }).setOrigin(0.5).setDepth(51);
    this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 50, '[ CLICK TO CONTINUE ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888'
    }).setOrigin(0.5).setDepth(51);

    this.time.delayedCall(500, () => {
      this.input.once('pointerdown', () => this.returnToMap(true));
      this.input.keyboard.once('keydown-ENTER', () => this.returnToMap(true));
      this.input.keyboard.once('keydown-SPACE', () => this.returnToMap(true));
    });
  }

  gameOver(message) {
    this.gameActive = false;
    if (this.enemyTimer) this.enemyTimer.remove();
    if (this.levelTimer) this.levelTimer.remove();
    this.scene.start('GameOverScene', {
      score: this.score, message,
      mapData: this.mapData, currentRow: this.currentRow,
      currentNodeId: this.currentNodeId, completedNodes: this.completedNodes,
    });
  }

  returnToMap(completed) {
    if (completed) this.completedNodes.add(this.currentNodeId);
    this.scene.start('MapScene', {
      mapData: this.mapData, currentRow: this.currentRow,
      currentNodeId: this.currentNodeId, score: this.score, completedNodes: this.completedNodes,
    });
  }
}

// ============================================================
// SCENE: GAME OVER
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.message = data.message || 'GAME OVER';
  }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    const cx = CONFIG.GAME_WIDTH / 2, cy = CONFIG.GAME_HEIGHT / 2;

    SaveManager.saveHighScore(this.finalScore);
    const hs = SaveManager.getHighScore();
    const isNew = this.finalScore >= hs && this.finalScore > 0;

    this.add.text(cx, cy - 80, this.message, {
      fontFamily: 'monospace', fontSize: '32px', color: '#e94560', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(cx, cy - 20, `SCORE: ${this.finalScore}`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#f4f4f8'
    }).setOrigin(0.5);

    if (isNew) {
      const nh = this.add.text(cx, cy + 15, 'NEW HIGH SCORE!', {
        fontFamily: 'monospace', fontSize: '14px', color: '#f59e0b', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tweens.add({ targets: nh, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    } else {
      this.add.text(cx, cy + 15, `HIGH SCORE: ${hs}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#555570'
      }).setOrigin(0.5);
    }

    const retry = this.add.text(cx, cy + 70, '[ ENTER — NEW RUN ]', {
      fontFamily: 'monospace', fontSize: '14px', color: '#22d3ee'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: retry, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });

    const menu = this.add.text(cx, cy + 110, '[ ESC — MENU ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#555570'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const newRun = () => this.scene.start('MapScene', {});
    const goMenu = () => this.scene.start('MenuScene');
    this.input.keyboard.once('keydown-ENTER', newRun);
    this.input.keyboard.once('keydown-SPACE', newRun);
    this.input.keyboard.once('keydown-ESC', goMenu);
    retry.on('pointerdown', newRun);
    menu.on('pointerdown', goMenu);
  }
}

// ============================================================
// PHASER CONFIG & LAUNCH
// ============================================================
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  backgroundColor: CONFIG.COLORS.BG_DARK,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, MapScene, GameScene, GameOverScene],
});

})();
