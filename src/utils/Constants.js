// ============================================================
// GRIDSHIFT — Enums & Constants
// ============================================================

export const CELL = {
  EMPTY: 0,        // walkable, unflipped tile
  FLIPPED: 1,      // flipped tile (dark)
  BLOCK: 2,        // immovable block
  HOLE: 3,         // hole (can't walk or flip)
  BLOCK_PUSH: 4,   // pushable block
};

export const DIRECTION = {
  UP:    { x:  0, y: -1 },
  DOWN:  { x:  0, y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  MAP: 'MapScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
};

export const EVENTS = {
  TILE_FLIPPED: 'tile-flipped',
  CHAIN_FLIP: 'chain-flip',
  LEVEL_COMPLETE: 'level-complete',
  PLAYER_HIT: 'player-hit',
  SCORE_UPDATE: 'score-update',
};
