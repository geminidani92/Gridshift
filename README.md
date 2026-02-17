# Gridshift

A puzzle roguelike built with Phaser 3. Flip all tiles dark to complete each level.

## How to Play

- **Arrow keys** — Move on the grid
- **Space** — Flip the tile you're standing on
- **Chain flip** — If there's another flipped tile in the same row/column, all tiles between them flip too!
- **Goal** — Flip every tile dark before time runs out
- **Watch out** — Enemies walk around and unflip your tiles

## Node Types (Roguelike Map)

- ⬡ **Puzzle** — Normal puzzle level
- ☠ **Elite** — Harder puzzle, more enemies
- ◆ **Chest** — Free bonus points
- ♨ **Campfire** — Rest stop, small bonus
- ★ **Boss** — The hardest puzzle

## Setup (GitHub Pages)

1. Create a new repository on GitHub
2. Upload all files maintaining the folder structure
3. Go to Settings → Pages → Source: Deploy from branch → Branch: main → Folder: / (root)
4. Save. Your game will be live at `https://yourusername.github.io/gridshift/`

No build step needed. No Node.js. No bundler. Just static files.

## Setup (Local)

Just open `index.html` in a browser — it works directly, no server needed.

## Project Structure

```
gridshift/
├── index.html              ← Entry point
├── assets/
│   └── data/
│       └── levels.json     ← Level definitions
├── src/
│   ├── main.js             ← Phaser config & bootstrap
│   ├── config.js           ← Game constants
│   ├── scenes/
│   │   ├── BootScene.js    ← Asset preloading
│   │   ├── MenuScene.js    ← Title screen
│   │   ├── MapScene.js     ← Roguelike node map
│   │   ├── GameScene.js    ← Main gameplay
│   │   └── GameOverScene.js
│   ├── objects/
│   │   ├── Grid.js         ← 7x8 grid + chain flip logic
│   │   ├── Tile.js         ← Individual tile
│   │   ├── Player.js       ← Player movement
│   │   ├── Enemy.js        ← Enemy AI (3 types)
│   │   └── Block.js        ← Blocks (placeholder)
│   ├── systems/
│   │   ├── InputManager.js ← Keyboard input
│   │   ├── LevelManager.js ← Level loading
│   │   ├── MapGenerator.js ← Procedural map generation
│   │   └── SaveManager.js  ← localStorage persistence
│   ├── ui/
│   │   ├── HUD.js          ← Score, timer, tile count
│   │   └── MapNode.js      ← Map node visual
│   └── utils/
│       ├── Constants.js    ← Enums
│       └── Helpers.js      ← Utility functions
```

## Project Architecture

The project has two layers:

- **`src/`** — Source code organized in modules (objects, scenes, systems, ui, utils). This is where you develop and read the code. Each file has a single responsibility.
- **`game.js`** — Production bundle that runs in the browser. This is built from the src/ modules. When you make changes in src/, update game.js accordingly.

## Tech Stack

- **Phaser 3.80.1** via CDN
- All visuals drawn with Phaser Graphics (no external images)
- Responsive with Scale.FIT
- No bundler needed, no Node.js required

## For AI Agents

This project is designed as a template for the AI Game Factory system. Agents can:
- Modify `assets/data/levels.json` to add/change levels
- Edit `src/config.js` to rebalance gameplay
- Add new enemy types in `src/objects/Enemy.js`
- Extend the map system in `src/systems/MapGenerator.js`
- Add new scenes in `src/scenes/`
