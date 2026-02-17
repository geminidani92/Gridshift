// ============================================================
// GRIDSHIFT — Complete Game Bundle v2
// Wave-based flip, keyboard-only, roguelike map
// ============================================================

(function() {
'use strict';

// ============================================================
// CONFIG
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
  WAVE_STEP_TIME: 80,
  SCORE_TILE_FLIP: 10,
  SCORE_CHAIN_BONUS: 25,
  SCORE_LEVEL_CLEAR: 500,
  SCORE_TIME_BONUS: 5,
  MAP_ROWS: 5,
  MAP_MIN_NODES: 2,
  MAP_MAX_NODES: 4,
  NODE_TYPES: { PUZZLE: 'puzzle', ELITE: 'elite', CHEST: 'chest', CAMPFIRE: 'campfire', BOSS: 'boss' },
  COLORS: {
    BG_DARK: 0x0a0a12, BG_MEDIUM: 0x14141f,
    TILE_LIGHT: 0x2a2a3e, TILE_DARK: 0x7c3aed, TILE_FLIPPED: 0xa78bfa, TILE_WAVE: 0x22d3ee,
    PLAYER: 0x22d3ee, ENEMY: 0xe94560, BLOCK: 0x555570, HOLE: 0x050508,
    UI_TEXT: 0xf4f4f8, UI_ACCENT: 0x7c3aed, UI_DIM: 0x555570, GRID_LINE: 0x1e1e2e,
    MAP_PATH: 0x3a3a50,
    NODE_PUZZLE: 0x7c3aed, NODE_ELITE: 0xe94560, NODE_CHEST: 0xf59e0b, NODE_CAMPFIRE: 0x22d3ee, NODE_BOSS: 0xdc2626,
  }
};
CONFIG.GRID_OFFSET_X = Math.floor((CONFIG.GAME_WIDTH - CONFIG.GRID_COLS * CONFIG.TILE_SIZE) / 2);
CONFIG.GRID_OFFSET_Y = Math.floor((CONFIG.GAME_HEIGHT - CONFIG.GRID_ROWS * CONFIG.TILE_SIZE) / 2) + 20;

const CELL = { EMPTY: 0, FLIPPED: 1, BLOCK: 2, HOLE: 3 };
const DIR = { UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 } };

function gridToPixel(c, r) { return { x: CONFIG.GRID_OFFSET_X + c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, y: CONFIG.GRID_OFFSET_Y + r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 }; }
function inBounds(c, r) { return c >= 0 && c < CONFIG.GRID_COLS && r >= 0 && r < CONFIG.GRID_ROWS; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

const SaveManager = {
  KEY: 'gridshift_save',
  getHighScore() { try { return (JSON.parse(localStorage.getItem(this.KEY)))?.highScore || 0; } catch { return 0; } },
  saveHighScore(s) { try { const d = JSON.parse(localStorage.getItem(this.KEY)) || {}; if (s > (d.highScore || 0)) { d.highScore = s; localStorage.setItem(this.KEY, JSON.stringify(d)); } } catch {} }
};

// ============================================================
// TILE — with wave glow
// ============================================================
class Tile {
  constructor(scene, col, row, cellType) {
    this.scene = scene; this.col = col; this.row = row;
    this.cellType = cellType; this.flipped = false; this.waveGlow = 0;
    const p = gridToPixel(col, row); this.x = p.x; this.y = p.y;
    this.graphics = scene.add.graphics(); this.draw();
  }
  draw() {
    const g = this.graphics; g.clear();
    const sz = CONFIG.TILE_SIZE - 4, h = sz / 2, x = this.x - h, y = this.y - h, r = 6;
    switch (this.cellType) {
      case CELL.BLOCK:
        g.fillStyle(CONFIG.COLORS.BLOCK, 1); g.fillRoundedRect(x, y, sz, sz, r);
        g.lineStyle(2, CONFIG.COLORS.BG_MEDIUM, 0.4);
        g.lineBetween(x+8,y+8,x+sz-8,y+sz-8); g.lineBetween(x+sz-8,y+8,x+8,y+sz-8); break;
      case CELL.HOLE:
        g.fillStyle(CONFIG.COLORS.HOLE, 1); g.fillRoundedRect(x+6,y+6,sz-12,sz-12,r); break;
      default:
        if (this.flipped) {
          g.fillStyle(CONFIG.COLORS.TILE_DARK, 1); g.fillRoundedRect(x,y,sz,sz,r);
          g.fillStyle(CONFIG.COLORS.TILE_FLIPPED, 0.15); g.fillRoundedRect(x+4,y+4,sz-8,sz-8,r-2);
        } else {
          g.fillStyle(CONFIG.COLORS.TILE_LIGHT, 1); g.fillRoundedRect(x,y,sz,sz,r);
          g.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.5); g.strokeRoundedRect(x+2,y+2,sz-4,sz-4,r-1);
        }
    }
    if (this.waveGlow > 0) {
      g.fillStyle(CONFIG.COLORS.TILE_WAVE, this.waveGlow * 0.4); g.fillRoundedRect(x,y,sz,sz,r);
      g.lineStyle(2, CONFIG.COLORS.TILE_WAVE, this.waveGlow * 0.8); g.strokeRoundedRect(x+2,y+2,sz-4,sz-4,r);
    }
  }
  flip() {
    if (this.cellType !== CELL.EMPTY && this.cellType !== CELL.FLIPPED) return false;
    this.flipped = !this.flipped;
    this.cellType = this.flipped ? CELL.FLIPPED : CELL.EMPTY;
    this.graphics.setScale(1);
    this.scene.tweens.add({ targets: this.graphics, scaleX: 0.85, scaleY: 0.85, duration: 60, yoyo: true, ease: 'Quad.easeOut', onStart: () => this.draw(), onComplete: () => { this.graphics.setScale(1); this.draw(); } });
    return true;
  }
  playWaveEffect() {
    this.waveGlow = 1; this.draw();
    this.scene.tweens.add({ targets: this, waveGlow: 0, duration: 400, ease: 'Quad.easeOut', onUpdate: () => this.draw() });
  }
  unflip() { if (!this.flipped) return; this.flipped = false; this.cellType = CELL.EMPTY; this.draw(); }
  isWalkable() { return this.cellType === CELL.EMPTY || this.cellType === CELL.FLIPPED; }
  isFlippable() { return this.cellType === CELL.EMPTY || this.cellType === CELL.FLIPPED; }
  destroy() { this.graphics.destroy(); }
}

// ============================================================
// GRID — wave propagation flip
// ============================================================
class Grid {
  constructor(scene, levelData) { this.scene = scene; this.tiles = []; this.waveActive = false; this.build(levelData); }
  build(levelData) {
    this.destroy(); this.tiles = []; this.waveActive = false;
    this.bgGraphics = this.scene.add.graphics();
    this.bgGraphics.fillStyle(CONFIG.COLORS.BG_MEDIUM, 1);
    this.bgGraphics.fillRoundedRect(CONFIG.GRID_OFFSET_X-8, CONFIG.GRID_OFFSET_Y-8, CONFIG.GRID_COLS*CONFIG.TILE_SIZE+16, CONFIG.GRID_ROWS*CONFIG.TILE_SIZE+16, 12);
    this.bgGraphics.lineStyle(1, CONFIG.COLORS.GRID_LINE, 0.3);
    for (let c=0;c<=CONFIG.GRID_COLS;c++) { const x=CONFIG.GRID_OFFSET_X+c*CONFIG.TILE_SIZE; this.bgGraphics.lineBetween(x,CONFIG.GRID_OFFSET_Y,x,CONFIG.GRID_OFFSET_Y+CONFIG.GRID_ROWS*CONFIG.TILE_SIZE); }
    for (let r=0;r<=CONFIG.GRID_ROWS;r++) { const y=CONFIG.GRID_OFFSET_Y+r*CONFIG.TILE_SIZE; this.bgGraphics.lineBetween(CONFIG.GRID_OFFSET_X,y,CONFIG.GRID_OFFSET_X+CONFIG.GRID_COLS*CONFIG.TILE_SIZE,y); }
    for (let row=0;row<CONFIG.GRID_ROWS;row++) { this.tiles[row]=[]; for (let col=0;col<CONFIG.GRID_COLS;col++) { this.tiles[row][col]=new Tile(this.scene,col,row,levelData[row]?.[col]??CELL.EMPTY); } }
  }
  getTile(c,r) { return inBounds(c,r) ? this.tiles[r][c] : null; }

  flipAt(col, row) {
    const tile = this.getTile(col, row);
    if (!tile || !tile.isFlippable()) return 0;
    if (this.waveActive) return 0;

    // Snapshot
    const prev = [];
    for (let r=0;r<CONFIG.GRID_ROWS;r++) { prev[r]=[]; for (let c=0;c<CONFIG.GRID_COLS;c++) prev[r][c]=this.tiles[r][c].flipped; }

    // Find chains in 4 dirs
    const segs = [];
    const dirs = [{dc:0,dr:-1},{dc:0,dr:1},{dc:-1,dr:0},{dc:1,dr:0}];
    for (const {dc,dr} of dirs) {
      let c=col+dc, r=row+dr, steps=1;
      const pending = [];
      while (inBounds(c,r)) {
        const t = this.getTile(c,r);
        if (!t || !t.isFlippable()) break;
        pending.push({col:c, row:r, steps});
        if (prev[r][c]) { for (const p of pending) { if (!prev[p.row][p.col]) segs.push(p); } break; }
        c+=dc; r+=dr; steps++;
      }
    }

    // Flip source immediately
    tile.flip(); tile.playWaveEffect();
    let total = 1;

    if (segs.length > 0) {
      this.waveActive = true;
      let maxD = 0;
      for (const s of segs) {
        const d = s.steps * CONFIG.WAVE_STEP_TIME;
        if (d > maxD) maxD = d;
        this.scene.time.delayedCall(d, () => { const t=this.getTile(s.col,s.row); if (t&&!t.flipped) { t.flip(); t.playWaveEffect(); } });
      }
      total += segs.length;
      this.scene.time.delayedCall(maxD+100, () => {
        this.waveActive = false;
        this.scene.events.emit('chain-flip', total);
        this.scene.events.emit('tile-flipped', total);
      });
    } else {
      this.scene.events.emit('tile-flipped', 1);
    }
    return total;
  }

  isComplete() { for (let r=0;r<CONFIG.GRID_ROWS;r++) for (let c=0;c<CONFIG.GRID_COLS;c++) if (this.tiles[r][c].cellType===CELL.EMPTY) return false; return true; }
  remaining() { let n=0; for (let r=0;r<CONFIG.GRID_ROWS;r++) for (let c=0;c<CONFIG.GRID_COLS;c++) if (this.tiles[r][c].cellType===CELL.EMPTY) n++; return n; }
  totalFlippable() { let n=0; for (let r=0;r<CONFIG.GRID_ROWS;r++) for (let c=0;c<CONFIG.GRID_COLS;c++) { const ct=this.tiles[r][c].cellType; if (ct===CELL.EMPTY||ct===CELL.FLIPPED) n++; } return n; }
  isWalkable(c,r) { const t=this.getTile(c,r); return t ? t.isWalkable() : false; }
  destroy() { for (const row of this.tiles) for (const t of row) t.destroy(); this.tiles=[]; if (this.bgGraphics) { this.bgGraphics.destroy(); this.bgGraphics=null; } }
}

// ============================================================
// PLAYER
// ============================================================
class Player {
  constructor(scene,col,row) { this.scene=scene; this.col=col; this.row=row; this.moving=false; this.graphics=scene.add.graphics().setDepth(10); this.drawAt(gridToPixel(col,row)); }
  drawAt(p) { const g=this.graphics; g.clear(); const s=CONFIG.TILE_SIZE*0.35; g.fillStyle(CONFIG.COLORS.PLAYER,0.15); g.fillCircle(p.x,p.y,s+6); g.fillStyle(CONFIG.COLORS.PLAYER,1); g.fillCircle(p.x,p.y,s); g.fillStyle(0xffffff,0.3); g.fillCircle(p.x-s*0.2,p.y-s*0.2,s*0.4); }
  moveTo(nc,nr,grid) { if (this.moving||!grid.isWalkable(nc,nr)) return false; this.moving=true; this.col=nc; this.row=nr; this.drawAt(gridToPixel(nc,nr)); this.scene.time.delayedCall(CONFIG.PLAYER_MOVE_SPEED,()=>{this.moving=false;}); return true; }
  destroy() { this.graphics.destroy(); }
}

// ============================================================
// ENEMY
// ============================================================
class Enemy {
  constructor(scene,col,row,type,opts={}) { this.scene=scene; this.col=col; this.row=row; this.type=type; this.moving=false; this.axis=opts.axis||'horizontal'; this.pacerDir=1; this.graphics=scene.add.graphics().setDepth(8); this.drawAt(gridToPixel(col,row)); }
  drawAt(p) { const g=this.graphics; g.clear(); const s=CONFIG.TILE_SIZE*0.3; g.fillStyle(CONFIG.COLORS.ENEMY,0.15); g.fillCircle(p.x,p.y,s+5); g.fillStyle(CONFIG.COLORS.ENEMY,1); g.beginPath(); g.moveTo(p.x,p.y-s); g.lineTo(p.x+s,p.y); g.lineTo(p.x,p.y+s); g.lineTo(p.x-s,p.y); g.closePath(); g.fillPath(); g.fillStyle(0xffffff,0.9); g.fillCircle(p.x-s*0.25,p.y-s*0.15,3); g.fillCircle(p.x+s*0.25,p.y-s*0.15,3); }
  getNextMove(grid,pc,pr) {
    if (this.type==='wanderer') { const ds=Object.values(DIR).sort(()=>Math.random()-0.5); for (const d of ds) { const nc=this.col+d.x,nr=this.row+d.y; if (grid.isWalkable(nc,nr)) return {col:nc,row:nr}; } return null; }
    if (this.type==='chaser') { const dx=Math.sign(pc-this.col),dy=Math.sign(pr-this.row); const ts=[]; if(dx)ts.push({col:this.col+dx,row:this.row}); if(dy)ts.push({col:this.col,row:this.row+dy}); for (const t of ts) if (grid.isWalkable(t.col,t.row)) return t; return null; }
    if (this.type==='pacer') { const isH=this.axis==='horizontal'; let dc=isH?this.pacerDir:0,dr=isH?0:this.pacerDir; let nc=this.col+dc,nr=this.row+dr; if (grid.isWalkable(nc,nr)) return {col:nc,row:nr}; this.pacerDir*=-1; dc=isH?this.pacerDir:0; dr=isH?0:this.pacerDir; nc=this.col+dc; nr=this.row+dr; if (grid.isWalkable(nc,nr)) return {col:nc,row:nr}; return null; }
    return null;
  }
  executeMove(grid,pc,pr) { if (this.moving) return; const n=this.getNextMove(grid,pc,pr); if (!n) return; this.moving=true; this.col=n.col; this.row=n.row; this.drawAt(gridToPixel(n.col,n.row)); this.scene.time.delayedCall(200,()=>{ this.moving=false; const t=grid.getTile(this.col,this.row); if (t&&t.flipped) t.unflip(); }); }
  destroy() { this.graphics.destroy(); }
}

// ============================================================
// HUD
// ============================================================
class HUD {
  constructor(scene) {
    this.scene=scene;
    const s={fontFamily:'monospace',fontSize:'14px',color:'#f4f4f8'}, d={fontFamily:'monospace',fontSize:'11px',color:'#555570'};
    this.levelText=scene.add.text(CONFIG.GAME_WIDTH/2,16,'',{...s,fontSize:'16px'}).setOrigin(0.5,0).setDepth(20);
    this.scoreLabel=scene.add.text(16,10,'SCORE',d).setDepth(20);
    this.scoreText=scene.add.text(16,24,'0',s).setDepth(20);
    this.tilesLabel=scene.add.text(CONFIG.GAME_WIDTH-16,10,'TILES',d).setOrigin(1,0).setDepth(20);
    this.tilesText=scene.add.text(CONFIG.GAME_WIDTH-16,24,'0',s).setOrigin(1,0).setDepth(20);
    this.timerText=scene.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT-16,'',{...d,fontSize:'13px'}).setOrigin(0.5,1).setDepth(20);
    this.hintText=scene.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT-4,'← → ↑ ↓ move    SPACE flip wave    ESC back',{...d,fontSize:'9px'}).setOrigin(0.5,1).setDepth(20);
  }
  updateLevel(n){this.levelText.setText(n);} updateScore(s){this.scoreText.setText(s.toString());}
  updateTiles(rem,tot){this.tilesText.setText(`${rem}/${tot}`); this.tilesText.setColor(rem<=3&&rem>0?'#22d3ee':'#f4f4f8');}
  updateTimer(sec){if(sec<=0){this.timerText.setText('');return;} const m=Math.floor(sec/60),s=sec%60; this.timerText.setText(`${m}:${s.toString().padStart(2,'0')}`); this.timerText.setColor(sec<=10?'#e94560':sec<=30?'#f59e0b':'#555570');}
  showChainBonus(c){const b=this.scene.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT/2-40,`WAVE x${c}!`,{fontFamily:'monospace',fontSize:'20px',color:'#22d3ee',fontStyle:'bold'}).setOrigin(0.5).setDepth(30); this.scene.tweens.add({targets:b,y:b.y-40,alpha:0,duration:800,ease:'Power2',onComplete:()=>b.destroy()});}
  destroy(){[this.levelText,this.scoreLabel,this.scoreText,this.tilesLabel,this.tilesText,this.timerText,this.hintText].forEach(t=>t.destroy());}
}

// ============================================================
// MAP GENERATOR
// ============================================================
function generateMap(numRows) {
  numRows=numRows||CONFIG.MAP_ROWS; const rows=[],nodes=[]; let nid=0;
  for (let r=0;r<numRows;r++) { const cnt=randInt(CONFIG.MAP_MIN_NODES,CONFIG.MAP_MAX_NODES); const row=[]; for (let c=0;c<cnt;c++) { let type; if(r===0)type='puzzle'; else if(r===numRows-1)type=Math.random()<0.5?'elite':'puzzle'; else{const roll=Math.random(); type=roll<0.50?'puzzle':roll<0.70?'chest':roll<0.85?'campfire':'elite';} nodes.push({id:nid,row:r,col:c,colCount:cnt,type,connections:[],completed:false}); row.push(nid++); } rows.push(row); }
  nodes.push({id:nid,row:numRows,col:0,colCount:1,type:'boss',connections:[],completed:false}); rows.push([nid++]);
  for (let r=0;r<rows.length-1;r++) { for (const id of rows[r]) { const cnt=Math.min(randInt(1,2),rows[r+1].length); nodes[id].connections=[...rows[r+1]].sort(()=>Math.random()-0.5).slice(0,cnt); } for (const id of rows[r+1]) { if (!rows[r].some(cid=>nodes[cid].connections.includes(id))) nodes[pick(rows[r])].connections.push(id); } }
  return {nodes,rows};
}

class LevelManager { constructor(){this.levels=[];} loadFromJSON(d){this.levels=d.levels||[];} getLevel(i){return this.levels[i]||null;} get totalLevels(){return this.levels.length;} }

// ============================================================
// SCENES
// ============================================================
class BootScene extends Phaser.Scene {
  constructor(){super('BootScene');}
  preload(){const w=CONFIG.GAME_WIDTH,h=CONFIG.GAME_HEIGHT; const bg=this.add.graphics(); bg.fillStyle(CONFIG.COLORS.BG_MEDIUM,1); bg.fillRect(w*0.25,h/2-4,w*0.5,8); const bar=this.add.graphics(); this.load.on('progress',v=>{bar.clear();bar.fillStyle(CONFIG.COLORS.UI_ACCENT,1);bar.fillRect(w*0.25+2,h/2-2,(w*0.5-4)*v,4);}); this.load.on('complete',()=>{bar.destroy();bg.destroy();}); this.load.json('levels','assets/data/levels.json');}
  create(){this.scene.start('MenuScene');}
}

class MenuScene extends Phaser.Scene {
  constructor(){super('MenuScene');}
  create(){
    const cx=CONFIG.GAME_WIDTH/2,cy=CONFIG.GAME_HEIGHT/2;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    const g=this.add.graphics(); g.lineStyle(1,CONFIG.COLORS.GRID_LINE,0.15); for(let x=0;x<CONFIG.GAME_WIDTH;x+=64)g.lineBetween(x,0,x,CONFIG.GAME_HEIGHT); for(let y=0;y<CONFIG.GAME_HEIGHT;y+=64)g.lineBetween(0,y,CONFIG.GAME_WIDTH,y);
    this.add.text(cx,cy-100,'GRIDSHIFT',{fontFamily:'monospace',fontSize:'48px',color:'#7c3aed',fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(cx,cy-55,'a puzzle roguelike',{fontFamily:'monospace',fontSize:'14px',color:'#555570'}).setOrigin(0.5);
    const hs=SaveManager.getHighScore(); if(hs>0)this.add.text(cx,cy-10,`HIGH SCORE: ${hs}`,{fontFamily:'monospace',fontSize:'12px',color:'#f59e0b'}).setOrigin(0.5);
    const st=this.add.text(cx,cy+50,'[ PRESS ENTER OR SPACE ]',{fontFamily:'monospace',fontSize:'16px',color:'#22d3ee',fontStyle:'bold'}).setOrigin(0.5);
    this.tweens.add({targets:st,alpha:0.3,duration:700,yoyo:true,repeat:-1});
    this.add.text(cx,cy+110,'ARROW KEYS  move\nSPACE  flip wave\nENTER  confirm\nESC  back',{fontFamily:'monospace',fontSize:'11px',color:'#555570',align:'center',lineSpacing:6}).setOrigin(0.5);
    this.add.text(cx,cy+180,'Goal: flip all tiles to complete each level',{fontFamily:'monospace',fontSize:'10px',color:'#3a3a50'}).setOrigin(0.5);
    const go=()=>this.scene.start('MapScene');
    this.input.keyboard.once('keydown-ENTER',go); this.input.keyboard.once('keydown-SPACE',go);
  }
}

// ============================================================
// MAP SCENE — keyboard navigation with cursor
// ============================================================
class MapScene extends Phaser.Scene {
  constructor(){super('MapScene');}
  init(data){
    this.mapData=data.mapData||generateMap(); this.currentRow=data.currentRow??-1;
    this.currentNodeId=data.currentNodeId??null; this.score=data.score||0;
    this.completedNodes=data.completedNodes||new Set();
  }
  create(){
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    const cx=CONFIG.GAME_WIDTH/2, {nodes,rows}=this.mapData;
    this.add.text(cx,18,'CHOOSE YOUR PATH',{fontFamily:'monospace',fontSize:'18px',color:'#7c3aed',fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(16,14,`SCORE: ${this.score}`,{fontFamily:'monospace',fontSize:'13px',color:'#f4f4f8'});

    // Legend
    [{l:'P Puzzle',c:'#7c3aed'},{l:'E Elite',c:'#e94560'},{l:'? Chest',c:'#f59e0b'},{l:'R Rest',c:'#22d3ee'},{l:'B BOSS',c:'#dc2626'}].forEach((it,i)=>{
      this.add.text(CONFIG.GAME_WIDTH-16,8+i*15,it.l,{fontFamily:'monospace',fontSize:'10px',color:it.c}).setOrigin(1,0);
    });

    const mapTop=95,mapBot=CONFIG.GAME_HEIGHT-60,rowH=(mapBot-mapTop)/(rows.length-1||1),mL=80,mR=CONFIG.GAME_WIDTH-80;
    this.nodePos={};
    for (const n of nodes) { const ry=mapTop+n.row*rowH, cw=(mR-mL)/(n.colCount-1||1); this.nodePos[n.id]={x:n.colCount===1?cx:mL+n.col*cw, y:ry}; }

    // Lines
    const lg=this.add.graphics();
    for (const n of nodes) { const f=this.nodePos[n.id]; for (const cid of n.connections) { lg.lineStyle(2,CONFIG.COLORS.MAP_PATH,0.35); lg.lineBetween(f.x,f.y,this.nodePos[cid].x,this.nodePos[cid].y); } }

    // Selectable
    this.selIds=[]; if(this.currentRow===-1)this.selIds=[...rows[0]]; else if(this.currentNodeId!==null)this.selIds=[...nodes[this.currentNodeId].connections];
    const selSet=new Set(this.selIds);
    for (const nid of this.completedNodes) nodes[nid].completed=true;

    const nColors={puzzle:CONFIG.COLORS.NODE_PUZZLE,elite:CONFIG.COLORS.NODE_ELITE,chest:CONFIG.COLORS.NODE_CHEST,campfire:CONFIG.COLORS.NODE_CAMPFIRE,boss:CONFIG.COLORS.NODE_BOSS};
    const nLabels={puzzle:'P',elite:'E',chest:'?',campfire:'R',boss:'B'};

    for (const n of nodes) {
      const p=this.nodePos[n.id], sel=selSet.has(n.id), color=nColors[n.type]||0xffffff, sz=n.type==='boss'?26:20;
      const g=this.add.graphics();
      if (n.completed) {
        g.fillStyle(color,0.15); g.fillCircle(p.x,p.y,sz); g.lineStyle(2,color,0.3); g.strokeCircle(p.x,p.y,sz);
        this.add.text(p.x,p.y,'✓',{fontFamily:'monospace',fontSize:'14px',color:'#555570'}).setOrigin(0.5).setDepth(15);
      } else if (sel) {
        g.fillStyle(color,1); g.fillCircle(p.x,p.y,sz); g.lineStyle(2,0xffffff,0.5); g.strokeCircle(p.x,p.y,sz);
        this.add.text(p.x,p.y-1,nLabels[n.type],{fontFamily:'monospace',fontSize:n.type==='boss'?'22px':'16px',color:'#ffffff',fontStyle:'bold'}).setOrigin(0.5).setDepth(15);
      } else {
        g.fillStyle(color,0.3); g.fillCircle(p.x,p.y,sz);
        this.add.text(p.x,p.y-1,nLabels[n.type],{fontFamily:'monospace',fontSize:'13px',color:'#ffffff',fontStyle:'bold'}).setOrigin(0.5).setDepth(15).setAlpha(0.4);
      }
    }

    // Cursor
    this.curIdx=0;
    this.curGfx=this.add.graphics().setDepth(25);
    this.drawCursor();
    this.tweens.add({targets:this.curGfx,alpha:0.4,duration:400,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    this.cursors=this.input.keyboard.createCursorKeys();
    this.enterKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.escKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    const hb=this.add.graphics(); hb.fillStyle(0x7c3aed,0.15); hb.fillRoundedRect(cx-180,CONFIG.GAME_HEIGHT-48,360,28,6);
    this.add.text(cx,CONFIG.GAME_HEIGHT-34,'← → select    ENTER / SPACE confirm    ESC menu',{fontFamily:'monospace',fontSize:'11px',color:'#a78bfa',fontStyle:'bold'}).setOrigin(0.5);
  }

  drawCursor(){
    this.curGfx.clear(); if(!this.selIds.length)return;
    const p=this.nodePos[this.selIds[this.curIdx]]; if(!p)return;
    this.curGfx.lineStyle(4,0xffffff,1); this.curGfx.strokeCircle(p.x,p.y,30);
    this.curGfx.lineStyle(2,0x22d3ee,0.6); this.curGfx.strokeCircle(p.x,p.y,36);
    this.curGfx.fillStyle(0xffffff,0.9); this.curGfx.fillTriangle(p.x-6,p.y+42,p.x+6,p.y+42,p.x,p.y+34);
  }

  update(){
    if(!this.selIds.length)return;
    const {nodes}=this.mapData;
    if(Phaser.Input.Keyboard.JustDown(this.cursors.right)||Phaser.Input.Keyboard.JustDown(this.cursors.down)){this.curIdx=(this.curIdx+1)%this.selIds.length;this.drawCursor();}
    if(Phaser.Input.Keyboard.JustDown(this.cursors.left)||Phaser.Input.Keyboard.JustDown(this.cursors.up)){this.curIdx=(this.curIdx-1+this.selIds.length)%this.selIds.length;this.drawCursor();}
    if(Phaser.Input.Keyboard.JustDown(this.enterKey)||Phaser.Input.Keyboard.JustDown(this.spaceKey)){this.selectNode(nodes[this.selIds[this.curIdx]]);}
    if(Phaser.Input.Keyboard.JustDown(this.escKey)){this.scene.start('MenuScene');}
  }

  selectNode(n){
    if(n.type==='puzzle'||n.type==='elite'||n.type==='boss'){
      this.scene.start('GameScene',{mapData:this.mapData,currentRow:n.row,currentNodeId:n.id,score:this.score,completedNodes:this.completedNodes,nodeType:n.type});
    } else if(n.type==='chest'){this.score+=300;this.completedNodes.add(n.id);this.showEvent('CHEST! +300 points','#f59e0b',n);
    } else if(n.type==='campfire'){this.score+=100;this.completedNodes.add(n.id);this.showEvent('CAMPFIRE — rest +100','#22d3ee',n);}
  }
  showEvent(text,color,node){
    const ov=this.add.graphics().setDepth(50); ov.fillStyle(0x000000,0.7); ov.fillRect(0,0,CONFIG.GAME_WIDTH,CONFIG.GAME_HEIGHT);
    this.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT/2,text,{fontFamily:'monospace',fontSize:'22px',color,fontStyle:'bold'}).setOrigin(0.5).setDepth(51);
    this.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT/2+50,'[ PRESS ENTER ]',{fontFamily:'monospace',fontSize:'12px',color:'#888'}).setOrigin(0.5).setDepth(51);
    const restart=()=>this.scene.restart({mapData:this.mapData,currentRow:node.row,currentNodeId:node.id,score:this.score,completedNodes:this.completedNodes});
    this.input.keyboard.once('keydown-ENTER',restart); this.input.keyboard.once('keydown-SPACE',restart);
  }
}

// ============================================================
// GAME SCENE
// ============================================================
class GameScene extends Phaser.Scene {
  constructor(){super('GameScene');}
  init(data){this.mapData=data.mapData;this.currentRow=data.currentRow;this.currentNodeId=data.currentNodeId;this.score=data.score||0;this.completedNodes=data.completedNodes||new Set();this.nodeType=data.nodeType||'puzzle';}
  create(){
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    this.cursors=this.input.keyboard.createCursorKeys(); this.spaceKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); this.escKey=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.moveDelay=180; this.lastMoveTime=0;

    this.levelMgr=new LevelManager(); this.levelMgr.loadFromJSON(this.cache.json.get('levels'));
    const total=this.levelMgr.totalLevels;
    let li; if(this.nodeType==='elite')li=randInt(Math.floor(total*0.6),total-1); else if(this.nodeType==='boss')li=total-1; else li=randInt(0,Math.floor(total*0.7));
    const level=this.levelMgr.getLevel(li); if(!level){this.scene.start('MenuScene');return;}

    this.grid=new Grid(this,level.grid);
    this.player=new Player(this,level.playerStart.col,level.playerStart.row);
    this.enemies=[]; for(const e of level.enemies)this.enemies.push(new Enemy(this,e.col,e.row,e.type,{axis:e.axis}));
    this.enemyTimer=this.time.addEvent({delay:CONFIG.ENEMY_MOVE_INTERVAL,loop:true,callback:()=>this.moveEnemies()});
    this.timeRemaining=level.timeLimit||0;
    if(this.timeRemaining>0)this.levelTimer=this.time.addEvent({delay:1000,loop:true,callback:()=>{this.timeRemaining--;this.hud.updateTimer(this.timeRemaining);if(this.timeRemaining<=0)this.gameOver('TIME UP');}});

    this.hud=new HUD(this); this.hud.updateLevel(level.name); this.hud.updateScore(this.score); this.hud.updateTiles(this.grid.remaining(),this.grid.totalFlippable()); this.hud.updateTimer(this.timeRemaining);

    this.events.on('tile-flipped',count=>{this.score+=CONFIG.SCORE_TILE_FLIP*count;this.hud.updateScore(this.score);this.hud.updateTiles(this.grid.remaining(),this.grid.totalFlippable());if(this.grid.isComplete())this.time.delayedCall(400,()=>this.levelComplete());});
    this.events.on('chain-flip',count=>{this.score+=CONFIG.SCORE_CHAIN_BONUS*count;this.hud.updateScore(this.score);this.hud.showChainBonus(count);});
    this.gameActive=true;
    this.grid.flipAt(level.playerStart.col,level.playerStart.row);
  }

  update(time){
    if(!this.gameActive)return;
    const el=time-this.lastMoveTime; let dir=null;
    if(Phaser.Input.Keyboard.JustDown(this.cursors.up))dir=DIR.UP; else if(Phaser.Input.Keyboard.JustDown(this.cursors.down))dir=DIR.DOWN; else if(Phaser.Input.Keyboard.JustDown(this.cursors.left))dir=DIR.LEFT; else if(Phaser.Input.Keyboard.JustDown(this.cursors.right))dir=DIR.RIGHT;
    else if(el>=this.moveDelay){if(this.cursors.up.isDown)dir=DIR.UP;else if(this.cursors.down.isDown)dir=DIR.DOWN;else if(this.cursors.left.isDown)dir=DIR.LEFT;else if(this.cursors.right.isDown)dir=DIR.RIGHT;}
    if(dir&&!this.player.moving){const nc=this.player.col+dir.x,nr=this.player.row+dir.y;if(this.player.moveTo(nc,nr,this.grid)){this.lastMoveTime=time;this.checkEnemyCollision();}}
    if(Phaser.Input.Keyboard.JustDown(this.spaceKey)&&!this.player.moving)this.grid.flipAt(this.player.col,this.player.row);
    if(Phaser.Input.Keyboard.JustDown(this.escKey))this.returnToMap(false);
  }

  moveEnemies(){if(!this.gameActive)return;for(const e of this.enemies)e.executeMove(this.grid,this.player.col,this.player.row);this.time.delayedCall(250,()=>{if(this.gameActive)this.hud.updateTiles(this.grid.remaining(),this.grid.totalFlippable());});this.time.delayedCall(220,()=>{if(this.gameActive)this.checkEnemyCollision();});}
  checkEnemyCollision(){for(const e of this.enemies)if(e.col===this.player.col&&e.row===this.player.row){this.gameOver('CAUGHT!');return;}}

  levelComplete(){
    this.gameActive=false; if(this.enemyTimer)this.enemyTimer.remove(); if(this.levelTimer)this.levelTimer.remove();
    if(this.timeRemaining>0)this.score+=CONFIG.SCORE_TIME_BONUS*this.timeRemaining; this.score+=CONFIG.SCORE_LEVEL_CLEAR;
    this.cameras.main.flash(300,124,58,237);
    const ov=this.add.graphics().setDepth(50); ov.fillStyle(0x000000,0.6); ov.fillRect(0,0,CONFIG.GAME_WIDTH,CONFIG.GAME_HEIGHT);
    this.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT/2-30,'LEVEL COMPLETE!',{fontFamily:'monospace',fontSize:'28px',color:'#7c3aed',fontStyle:'bold'}).setOrigin(0.5).setDepth(51);
    this.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT/2+10,`+${CONFIG.SCORE_LEVEL_CLEAR} points`,{fontFamily:'monospace',fontSize:'14px',color:'#a78bfa'}).setOrigin(0.5).setDepth(51);
    this.add.text(CONFIG.GAME_WIDTH/2,CONFIG.GAME_HEIGHT/2+50,'[ PRESS ENTER ]',{fontFamily:'monospace',fontSize:'12px',color:'#888'}).setOrigin(0.5).setDepth(51);
    this.time.delayedCall(500,()=>{this.input.keyboard.once('keydown-ENTER',()=>this.returnToMap(true));this.input.keyboard.once('keydown-SPACE',()=>this.returnToMap(true));});
  }

  gameOver(msg){this.gameActive=false;if(this.enemyTimer)this.enemyTimer.remove();if(this.levelTimer)this.levelTimer.remove();this.scene.start('GameOverScene',{score:this.score,message:msg,mapData:this.mapData,currentRow:this.currentRow,currentNodeId:this.currentNodeId,completedNodes:this.completedNodes});}
  returnToMap(ok){if(ok)this.completedNodes.add(this.currentNodeId);this.scene.start('MapScene',{mapData:this.mapData,currentRow:this.currentRow,currentNodeId:this.currentNodeId,score:this.score,completedNodes:this.completedNodes});}
}

// ============================================================
// GAME OVER — keyboard only
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor(){super('GameOverScene');}
  init(data){this.finalScore=data.score||0;this.message=data.message||'GAME OVER';}
  create(){
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);
    const cx=CONFIG.GAME_WIDTH/2,cy=CONFIG.GAME_HEIGHT/2;
    SaveManager.saveHighScore(this.finalScore); const hs=SaveManager.getHighScore(); const isNew=this.finalScore>=hs&&this.finalScore>0;
    this.add.text(cx,cy-80,this.message,{fontFamily:'monospace',fontSize:'32px',color:'#e94560',fontStyle:'bold'}).setOrigin(0.5);
    this.add.text(cx,cy-20,`SCORE: ${this.finalScore}`,{fontFamily:'monospace',fontSize:'20px',color:'#f4f4f8'}).setOrigin(0.5);
    if(isNew){const nh=this.add.text(cx,cy+15,'NEW HIGH SCORE!',{fontFamily:'monospace',fontSize:'14px',color:'#f59e0b',fontStyle:'bold'}).setOrigin(0.5);this.tweens.add({targets:nh,alpha:0.4,duration:500,yoyo:true,repeat:-1});}
    else this.add.text(cx,cy+15,`HIGH SCORE: ${hs}`,{fontFamily:'monospace',fontSize:'12px',color:'#555570'}).setOrigin(0.5);
    const rt=this.add.text(cx,cy+70,'[ ENTER — NEW RUN ]',{fontFamily:'monospace',fontSize:'14px',color:'#22d3ee'}).setOrigin(0.5);
    this.tweens.add({targets:rt,alpha:0.4,duration:700,yoyo:true,repeat:-1});
    this.add.text(cx,cy+110,'[ ESC — MENU ]',{fontFamily:'monospace',fontSize:'12px',color:'#555570'}).setOrigin(0.5);
    this.input.keyboard.once('keydown-ENTER',()=>this.scene.start('MapScene',{}));
    this.input.keyboard.once('keydown-SPACE',()=>this.scene.start('MapScene',{}));
    this.input.keyboard.once('keydown-ESC',()=>this.scene.start('MenuScene'));
  }
}

// ============================================================
// LAUNCH
// ============================================================
new Phaser.Game({
  type: Phaser.AUTO, parent: 'game-container',
  width: CONFIG.GAME_WIDTH, height: CONFIG.GAME_HEIGHT, backgroundColor: CONFIG.COLORS.BG_DARK,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, MapScene, GameScene, GameOverScene],
});

})();
