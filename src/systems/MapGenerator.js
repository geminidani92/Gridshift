// ============================================================
// GRIDSHIFT — Map Generator
// Generates a Slay the Spire-style node graph
// ============================================================

import { CONFIG } from '../config.js';
import { randInt, pick } from '../utils/Helpers.js';

export class MapGenerator {
  /**
   * Generate a map with MAP_ROWS rows of nodes.
   * Returns { nodes: [{id, row, col, type, connections}], rows: [[nodeIds]] }
   */
  static generate(numRows = CONFIG.MAP_ROWS) {
    const rows = [];
    const nodes = [];
    let nodeId = 0;
    
    // Generate nodes per row
    for (let r = 0; r < numRows; r++) {
      const count = randInt(CONFIG.MAP_MIN_NODES, CONFIG.MAP_MAX_NODES);
      const row = [];
      
      for (let c = 0; c < count; c++) {
        const type = MapGenerator.getNodeType(r, numRows);
        const node = {
          id: nodeId++,
          row: r,
          col: c,
          colCount: count,
          type: type,
          connections: [],  // ids of nodes in next row
          completed: false,
        };
        nodes.push(node);
        row.push(node.id);
      }
      rows.push(row);
    }
    
    // Add boss node at the end
    const bossNode = {
      id: nodeId++,
      row: numRows,
      col: 0,
      colCount: 1,
      type: CONFIG.MAP_NODE_TYPES.BOSS,
      connections: [],
      completed: false,
    };
    nodes.push(bossNode);
    rows.push([bossNode.id]);
    
    // Connect rows: every node connects to at least 1 node in the next row
    for (let r = 0; r < rows.length - 1; r++) {
      const currentRow = rows[r];
      const nextRow = rows[r + 1];
      
      // Ensure every node has at least one connection forward
      for (const nid of currentRow) {
        const node = nodes[nid];
        // Connect to 1-2 random nodes in next row
        const connCount = Math.min(randInt(1, 2), nextRow.length);
        const targets = [...nextRow].sort(() => Math.random() - 0.5).slice(0, connCount);
        node.connections = targets;
      }
      
      // Ensure every node in next row has at least one incoming connection
      for (const nid of nextRow) {
        const hasIncoming = currentRow.some(cid => nodes[cid].connections.includes(nid));
        if (!hasIncoming) {
          // Connect a random node from current row
          const source = pick(currentRow);
          nodes[source].connections.push(nid);
        }
      }
    }
    
    return { nodes, rows };
  }
  
  static getNodeType(row, totalRows) {
    // First row: always puzzle
    if (row === 0) return CONFIG.MAP_NODE_TYPES.PUZZLE;
    
    // Last row before boss: mix of elite and puzzle
    if (row === totalRows - 1) {
      return Math.random() < 0.5 ? CONFIG.MAP_NODE_TYPES.ELITE : CONFIG.MAP_NODE_TYPES.PUZZLE;
    }
    
    // Middle rows: weighted random
    const roll = Math.random();
    if (roll < 0.50) return CONFIG.MAP_NODE_TYPES.PUZZLE;
    if (roll < 0.70) return CONFIG.MAP_NODE_TYPES.CHEST;
    if (roll < 0.85) return CONFIG.MAP_NODE_TYPES.CAMPFIRE;
    return CONFIG.MAP_NODE_TYPES.ELITE;
  }
}
