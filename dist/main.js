"use strict";
(() => {
  // src/types.ts
  var ROWS = 8;
  var COLS = 8;
  var TILE_TYPES = 5;

  // src/board.ts
  var Board = class {
    constructor() {
      this.grid = [];
      this.initWithoutMatches();
    }
    get tiles() {
      return this.grid;
    }
    swap(a, b) {
      const t1 = this.grid[a.row][a.col];
      const t2 = this.grid[b.row][b.col];
      this.grid[a.row][a.col] = t2;
      this.grid[b.row][b.col] = t1;
    }
    findMatches() {
      const toClear = [];
      for (let r = 0; r < ROWS; r++) {
        const rowMarks = [];
        for (let c = 0; c < COLS; c++) {
          rowMarks.push(false);
        }
        toClear.push(rowMarks);
      }
      let hasMatch = false;
      let clearedCount = 0;
      for (let r = 0; r < ROWS; r++) {
        let runStart = 0;
        for (let c = 1; c <= COLS; c++) {
          const prev = this.grid[r][c - 1];
          const curr = c < COLS ? this.grid[r][c] : null;
          if (curr !== prev || curr === null) {
            const runLength = c - runStart;
            if (prev !== null && runLength >= 3) {
              hasMatch = true;
              for (let k = runStart; k < c; k++) {
                if (!toClear[r][k]) {
                  toClear[r][k] = true;
                  clearedCount++;
                }
              }
            }
            runStart = c;
          }
        }
      }
      for (let c = 0; c < COLS; c++) {
        let runStart = 0;
        for (let r = 1; r <= ROWS; r++) {
          const prev = this.grid[r - 1][c];
          const curr = r < ROWS ? this.grid[r][c] : null;
          if (curr !== prev || curr === null) {
            const runLength = r - runStart;
            if (prev !== null && runLength >= 3) {
              hasMatch = true;
              for (let k = runStart; k < r; k++) {
                if (!toClear[k][c]) {
                  toClear[k][c] = true;
                  clearedCount++;
                }
              }
            }
            runStart = r;
          }
        }
      }
      return { hasMatch, toClear, clearedCount };
    }
    clearMatches(toClear) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (toClear[r][c]) {
            this.grid[r][c] = null;
          }
        }
      }
    }
    applyGravity() {
      for (let c = 0; c < COLS; c++) {
        let writeRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          const tile = this.grid[r][c];
          if (tile !== null) {
            this.grid[writeRow][c] = tile;
            if (writeRow !== r) {
              this.grid[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          this.grid[r][c] = this.randomTile();
        }
      }
    }
    initWithoutMatches() {
      this.grid = [];
      for (let row = 0; row < ROWS; row++) {
        const line = [];
        for (let col = 0; col < COLS; col++) {
          let tile;
          do {
            tile = this.randomTile();
          } while (this.createsMatchAt(line, row, col, tile));
          line.push(tile);
        }
        this.grid.push(line);
      }
    }
    randomTile() {
      return Math.floor(Math.random() * TILE_TYPES);
    }
    createsMatchAt(currentRowValues, row, col, tile) {
      if (col >= 2) {
        const t1 = currentRowValues[col - 1];
        const t2 = currentRowValues[col - 2];
        if (t1 === tile && t2 === tile) {
          return true;
        }
      }
      if (row >= 2) {
        const t1 = this.grid[row - 1][col];
        const t2 = this.grid[row - 2][col];
        if (t1 === tile && t2 === tile) {
          return true;
        }
      }
      return false;
    }
  };

  // src/renderer.ts
  var Renderer = class {
    constructor(canvasId) {
      this.padding = 4;
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        throw new Error("Canvas element not found");
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Cannot get 2D context");
      }
      this.canvas = canvas;
      this.ctx = ctx;
      this.tileSize = Math.min(
        this.canvas.width / COLS,
        this.canvas.height / ROWS
      );
    }
    getCanvas() {
      return this.canvas;
    }
    pixelToCell(x, y) {
      const col = Math.floor(x / this.tileSize);
      const row = Math.floor(y / this.tileSize);
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
        return null;
      }
      return { row, col };
    }
    draw(board, selected) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          this.drawTile(r, c, board[r][c]);
        }
      }
      this.drawGrid();
      if (selected) {
        this.highlightCell(selected);
      }
    }
    drawTile(row, col, tile) {
      if (tile === null) {
        return;
      }
      const x = col * this.tileSize;
      const y = row * this.tileSize;
      const inner = this.tileSize - this.padding * 2;
      const radius = inner * 0.4;
      const palette = [
        "#f97373",
        "#38bdf8",
        "#a855f7",
        "#facc15",
        "#4ade80"
      ];
      const strokePalette = [
        "#b91c1c",
        "#0369a1",
        "#7e22ce",
        "#a16207",
        "#15803d"
      ];
      const color = palette[tile];
      const strokeColor = strokePalette[tile];
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;
      switch (tile) {
        case 0: {
          this.ctx.beginPath();
          this.ctx.arc(this.tileSize / 2, this.tileSize / 2, radius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          break;
        }
        case 1: {
          const s = inner * 0.9;
          const ox = (this.tileSize - s) / 2;
          const oy = (this.tileSize - s) / 2;
          this.ctx.beginPath();
          this.ctx.roundRect(ox, oy, s, s, 6);
          this.ctx.fill();
          this.ctx.stroke();
          break;
        }
        case 2: {
          const h = inner * 0.95;
          const w = h * 0.8;
          const ox = (this.tileSize - w) / 2;
          const oy = (this.tileSize - h) / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(ox + w / 2, oy);
          this.ctx.lineTo(ox + w, oy + h);
          this.ctx.lineTo(ox, oy + h);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
        }
        case 3: {
          const s = inner * 0.85;
          const ox = (this.tileSize - s) / 2;
          const oy = (this.tileSize - s) / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(ox + s / 2, oy);
          this.ctx.lineTo(ox + s, oy + s / 2);
          this.ctx.lineTo(ox + s / 2, oy + s);
          this.ctx.lineTo(ox, oy + s / 2);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
        }
        case 4: {
          const w = inner * 0.9;
          const h = inner * 0.55;
          const ox = (this.tileSize - w) / 2;
          const oy = (this.tileSize - h) / 2;
          this.ctx.beginPath();
          this.ctx.roundRect(ox, oy, w, h, 10);
          this.ctx.fill();
          this.ctx.stroke();
          break;
        }
      }
      this.ctx.restore();
    }
    drawGrid() {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = "rgba(148,163,184,0.6)";
      ctx.lineWidth = 1;
      for (let r = 0; r <= ROWS; r++) {
        const y = r * this.tileSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width, y);
        ctx.stroke();
      }
      for (let c = 0; c <= COLS; c++) {
        const x = c * this.tileSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvas.height);
        ctx.stroke();
      }
      ctx.restore();
    }
    highlightCell(pos) {
      const ctx = this.ctx;
      const x = pos.col * this.tileSize;
      const y = pos.row * this.tileSize;
      ctx.save();
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(249,115,22,0.8)";
      ctx.shadowBlur = 12;
      ctx.strokeRect(
        x + this.padding / 2,
        y + this.padding / 2,
        this.tileSize - this.padding,
        this.tileSize - this.padding
      );
      ctx.restore();
    }
  };

  // src/game.ts
  var Match3Game = class {
    constructor(canvasId) {
      this.selected = null;
      this.isProcessing = false;
      this.score = 0;
      this.board = new Board();
      this.renderer = new Renderer(canvasId);
      this.scoreEl = document.getElementById("score");
      this.attachEvents();
      this.renderer.draw(this.board.tiles, this.selected);
    }
    attachEvents() {
      const canvas = this.renderer.getCanvas();
      canvas.addEventListener("mousedown", (ev) => {
        if (this.isProcessing) return;
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const pos = this.renderer.pixelToCell(x, y);
        if (!pos) return;
        if (!this.selected) {
          this.selected = pos;
        } else {
          const sel = this.selected;
          if (sel.row === pos.row && sel.col === pos.col) {
            this.selected = null;
          } else if (this.areNeighbors(sel, pos)) {
            this.handleSwap(sel, pos).catch((err) => {
              console.error(err);
            });
          } else {
            this.selected = pos;
          }
        }
        this.renderer.draw(this.board.tiles, this.selected);
      });
    }
    areNeighbors(a, b) {
      const dr = Math.abs(a.row - b.row);
      const dc = Math.abs(a.col - b.col);
      return dr === 1 && dc === 0 || dr === 0 && dc === 1;
    }
    async handleSwap(a, b) {
      this.isProcessing = true;
      this.board.swap(a, b);
      const match = this.board.findMatches();
      if (!match.hasMatch) {
        this.board.swap(a, b);
        this.selected = null;
        this.isProcessing = false;
        this.renderer.draw(this.board.tiles, this.selected);
        return;
      }
      this.selected = null;
      await this.resolveMatchesLoop(match);
      this.isProcessing = false;
    }
    async resolveMatchesLoop(firstMatch) {
      let match = firstMatch;
      while (match.hasMatch) {
        this.score += match.clearedCount;
        if (this.scoreEl) {
          this.scoreEl.textContent = String(this.score);
        }
        this.board.clearMatches(match.toClear);
        this.renderer.draw(this.board.tiles, this.selected);
        await this.wait(120);
        this.board.applyGravity();
        this.renderer.draw(this.board.tiles, this.selected);
        await this.wait(120);
        match = this.board.findMatches();
      }
    }
    wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  };

  // src/main.ts
  window.addEventListener("load", () => {
    new Match3Game("game");
  });
})();
