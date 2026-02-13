// ============================================================
// GRIDSHIFT — Game Configuration & Constants
// All tunable values in one place for easy balancing
// ============================================================

export const CONFIG = {
  // Display
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  
  // Grid
  GRID_COLS: 8,
  GRID_ROWS: 7,
  TILE_SIZE: 64,
  GRID_OFFSET_X: 0,   // calculated at runtime
  GRID_OFFSET_Y: 0,   // calculated at runtime
  
  // Player
  PLAYER_MOVE_SPEED: 120,  // ms per tile move (animation)
  
  // Enemies
  ENEMY_MOVE_INTERVAL: 1500,  // ms between enemy moves
  ENEMY_TYPES: {
    WANDERER: 'wanderer',     // moves randomly
    CHASER: 'chaser',         // moves toward player
    PACER: 'pacer',           // paces back and forth
  },
  
  // Timing
  LEVEL_TIME_LIMIT: 120,     // seconds per level (0 = no limit)
  FLIP_CHAIN_DELAY: 50,      // ms delay between chain flips (visual)
  
  // Scoring
  SCORE_TILE_FLIP: 10,
  SCORE_CHAIN_BONUS: 25,     // per extra tile in chain
  SCORE_LEVEL_CLEAR: 500,
  SCORE_TIME_BONUS: 5,       // per second remaining
  
  // Map (roguelike)
  MAP_ROWS: 5,               // depth of the map
  MAP_MIN_NODES: 2,          // min nodes per row
  MAP_MAX_NODES: 4,          // max nodes per row
  MAP_NODE_TYPES: {
    PUZZLE: 'puzzle',
    ELITE: 'elite',
    CHEST: 'chest',
    CAMPFIRE: 'campfire',
    BOSS: 'boss',
  },
  
  // Colors (Gridshift palette)
  COLORS: {
    BG_DARK: 0x0a0a12,
    BG_MEDIUM: 0x14141f,
    TILE_LIGHT: 0x2a2a3e,
    TILE_DARK: 0x7c3aed,
    TILE_FLIPPED: 0xa78bfa,
    PLAYER: 0x22d3ee,
    ENEMY: 0xe94560,
    BLOCK: 0x555570,
    BLOCK_MOVABLE: 0x777790,
    HOLE: 0x050508,
    UI_TEXT: 0xf4f4f8,
    UI_ACCENT: 0x7c3aed,
    UI_DIM: 0x555570,
    GRID_LINE: 0x1e1e2e,
    MAP_PATH: 0x3a3a50,
    MAP_NODE_PUZZLE: 0x7c3aed,
    MAP_NODE_ELITE: 0xe94560,
    MAP_NODE_CHEST: 0xf59e0b,
    MAP_NODE_CAMPFIRE: 0x22d3ee,
    MAP_NODE_BOSS: 0xdc2626,
  }
};

// Calculate grid offset to center it
CONFIG.GRID_OFFSET_X = Math.floor((CONFIG.GAME_WIDTH - CONFIG.GRID_COLS * CONFIG.TILE_SIZE) / 2);
CONFIG.GRID_OFFSET_Y = Math.floor((CONFIG.GAME_HEIGHT - CONFIG.GRID_ROWS * CONFIG.TILE_SIZE) / 2) + 20;
