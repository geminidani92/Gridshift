// ============================================================
// GRIDSHIFT — Map Scene
// Slay the Spire-style procedural map
// ============================================================

import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { SCENE_KEYS } from '../utils/Constants.js';
import { MapGenerator } from '../systems/MapGenerator.js';
import { MapNode } from '../ui/MapNode.js';

export class MapScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MAP);
  }
  
  init(data) {
    // Persist map data across returns from GameScene
    this.mapData = data.mapData || MapGenerator.generate();
    this.currentRow = data.currentRow ?? -1;  // -1 = start (pick from row 0)
    this.currentNodeId = data.currentNodeId ?? null;
    this.score = data.score || 0;
    this.completedNodes = data.completedNodes || new Set();
  }
  
  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    
    const cx = CONFIG.GAME_WIDTH / 2;
    const { nodes, rows } = this.mapData;
    
    // Title
    this.add.text(cx, 24, 'CHOOSE YOUR PATH', {
      fontFamily: 'monospace', fontSize: '16px', color: '#7c3aed',
    }).setOrigin(0.5);
    
    // Score
    this.add.text(16, 16, `SCORE: ${this.score}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#f4f4f8',
    });
    
    // Layout constants
    const mapTop = 70;
    const mapBottom = CONFIG.GAME_HEIGHT - 40;
    const rowHeight = (mapBottom - mapTop) / (rows.length - 1 || 1);
    const mapLeft = 100;
    const mapRight = CONFIG.GAME_WIDTH - 100;
    
    // Calculate positions for each node
    const nodePositions = {};
    for (const node of nodes) {
      const ry = mapTop + node.row * rowHeight;
      const colWidth = (mapRight - mapLeft) / (node.colCount - 1 || 1);
      const rx = node.colCount === 1 ? cx : mapLeft + node.col * colWidth;
      nodePositions[node.id] = { x: rx, y: ry };
    }
    
    // Draw connections
    const lineGraphics = this.add.graphics();
    for (const node of nodes) {
      const from = nodePositions[node.id];
      for (const connId of node.connections) {
        const to = nodePositions[connId];
        lineGraphics.lineStyle(2, CONFIG.COLORS.MAP_PATH, 0.4);
        lineGraphics.lineBetween(from.x, from.y, to.x, to.y);
      }
    }
    
    // Determine which nodes are selectable
    let selectableIds = new Set();
    if (this.currentRow === -1) {
      // Start: can pick any node in row 0
      selectableIds = new Set(rows[0]);
    } else if (this.currentNodeId !== null) {
      // Can pick from connections of current node
      const currentNode = nodes[this.currentNodeId];
      selectableIds = new Set(currentNode.connections);
    }
    
    // Mark completed nodes
    for (const nid of this.completedNodes) {
      nodes[nid].completed = true;
    }
    
    // Draw nodes
    this.nodeVisuals = [];
    for (const node of nodes) {
      const pos = nodePositions[node.id];
      const selectable = selectableIds.has(node.id);
      const visual = new MapNode(this, pos.x, pos.y, node, selectable);
      
      if (selectable) {
        visual.onSelect((nodeData) => this.selectNode(nodeData));
      }
      
      this.nodeVisuals.push(visual);
    }
    
    // Hint
    this.add.text(cx, CONFIG.GAME_HEIGHT - 14, 'Click a glowing node to continue', {
      fontFamily: 'monospace', fontSize: '10px', color: '#3a3a50',
    }).setOrigin(0.5);
  }
  
  selectNode(nodeData) {
    const type = nodeData.type;
    
    if (type === CONFIG.MAP_NODE_TYPES.PUZZLE || type === CONFIG.MAP_NODE_TYPES.ELITE || type === CONFIG.MAP_NODE_TYPES.BOSS) {
      // Go to puzzle
      this.scene.start(SCENE_KEYS.GAME, {
        mapData: this.mapData,
        currentRow: nodeData.row,
        currentNodeId: nodeData.id,
        score: this.score,
        completedNodes: this.completedNodes,
        nodeType: type,
      });
    } else if (type === CONFIG.MAP_NODE_TYPES.CHEST) {
      // Bonus score
      this.score += 300;
      this.completedNodes.add(nodeData.id);
      this.showEvent('CHEST! +300 points', '#f59e0b', nodeData);
    } else if (type === CONFIG.MAP_NODE_TYPES.CAMPFIRE) {
      // Rest bonus (placeholder)
      this.score += 100;
      this.completedNodes.add(nodeData.id);
      this.showEvent('CAMPFIRE — rest +100', '#22d3ee', nodeData);
    }
  }
  
  showEvent(text, color, nodeData) {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
    overlay.setDepth(50);
    
    const msg = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2, text, {
      fontFamily: 'monospace', fontSize: '22px', color: color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);
    
    const cont = this.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 50, '[ CLICK TO CONTINUE ]', {
      fontFamily: 'monospace', fontSize: '12px', color: '#888',
    }).setOrigin(0.5).setDepth(51);
    
    this.input.once('pointerdown', () => {
      // Restart map scene with updated state
      this.scene.restart({
        mapData: this.mapData,
        currentRow: nodeData.row,
        currentNodeId: nodeData.id,
        score: this.score,
        completedNodes: this.completedNodes,
      });
    });
  }
}
