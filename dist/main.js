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
    getInitialSpawnMoves() {
      const moves = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = this.grid[r][c];
          if (tile !== null) {
            moves.push({
              fromRow: -1,
              fromCol: c,
              toRow: r,
              toCol: c,
              tile
            });
          }
        }
      }
      return moves;
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
      const moves = [];
      for (let c = 0; c < COLS; c++) {
        let writeRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          const tile = this.grid[r][c];
          if (tile !== null) {
            if (writeRow !== r) {
              moves.push({
                fromRow: r,
                fromCol: c,
                toRow: writeRow,
                toCol: c,
                tile
              });
            }
            this.grid[writeRow][c] = tile;
            if (writeRow !== r) {
              this.grid[r][c] = null;
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          const tile = this.randomTile();
          this.grid[r][c] = tile;
          moves.push({
            fromRow: -1,
            fromCol: c,
            toRow: r,
            toCol: c,
            tile
          });
        }
      }
      return moves;
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
    draw(board, selected, movingTiles = [], progress = 1) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const blocked = /* @__PURE__ */ new Set();
      for (const move of movingTiles) {
        blocked.add(`${move.fromRow}:${move.fromCol}`);
        blocked.add(`${move.toRow}:${move.toCol}`);
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (blocked.has(`${r}:${c}`)) continue;
          this.drawTile(r, c, board[r][c]);
        }
      }
      this.drawGrid();
      if (selected) {
        this.highlightCell(selected);
      }
      for (const move of movingTiles) {
        const row = move.fromRow + (move.toRow - move.fromRow) * progress;
        const col = move.fromCol + (move.toCol - move.fromCol) * progress;
        this.drawTile(row, col, move.tile);
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
      this.isDragging = false;
      this.dragStart = null;
      this.dragTile = null;
      this.board = new Board();
      this.renderer = new Renderer(canvasId);
      this.scoreEl = document.getElementById("score");
      this.attachEvents();
      const spawnMoves = this.board.getInitialSpawnMoves();
      if (spawnMoves.length > 0) {
        this.isProcessing = true;
        this.animateMoves(spawnMoves, 260, "easeOut").catch((err) => console.error(err)).then(() => {
          this.isProcessing = false;
          this.renderer.draw(this.board.tiles, this.selected);
        });
      } else {
        this.renderer.draw(this.board.tiles, this.selected);
      }
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
        this.isDragging = true;
        this.dragStart = pos;
        const tile = this.board.tiles[pos.row][pos.col];
        this.dragTile = tile === null ? null : tile;
        this.selected = pos;
        this.renderer.draw(this.board.tiles, this.selected);
      });
      canvas.addEventListener("mousemove", (ev) => {
        if (!this.isDragging || this.isProcessing || this.dragStart === null || this.dragTile === null) {
          return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const pos = this.renderer.pixelToCell(x, y);
        if (!pos) {
          this.renderer.draw(this.board.tiles, this.selected);
          return;
        }
        const row = pos.row + (y - (pos.row + 0.5) * (canvas.height / 8)) / (canvas.height / 8);
        const col = pos.col + (x - (pos.col + 0.5) * (canvas.width / 8)) / (canvas.width / 8);
        const dragMove = {
          fromRow: this.dragStart.row,
          fromCol: this.dragStart.col,
          toRow: row,
          toCol: col,
          tile: this.dragTile
        };
        this.renderer.draw(this.board.tiles, this.selected, [dragMove], 1);
      });
      canvas.addEventListener("mouseup", (ev) => {
        if (this.isProcessing || !this.isDragging || this.dragStart === null) {
          return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const pos = this.renderer.pixelToCell(x, y);
        const start = this.dragStart;
        this.isDragging = false;
        this.dragStart = null;
        this.dragTile = null;
        if (!pos) {
          this.selected = null;
          this.renderer.draw(this.board.tiles, this.selected);
          return;
        }
        if (pos.row === start.row && pos.col === start.col) {
          if (this.selected && this.selected.row === pos.row && this.selected.col === pos.col) {
            this.selected = null;
          } else {
            this.selected = pos;
          }
          this.renderer.draw(this.board.tiles, this.selected);
          return;
        }
        if (this.areNeighbors(start, pos)) {
          this.handleSwap(start, pos).catch((err) => console.error(err));
        } else {
          this.selected = pos;
          this.renderer.draw(this.board.tiles, this.selected);
        }
      });
      canvas.addEventListener("mouseleave", () => {
        if (!this.isDragging || this.isProcessing) {
          return;
        }
        this.isDragging = false;
        this.dragStart = null;
        this.dragTile = null;
        this.selected = null;
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
      const tileA = this.board.tiles[a.row][a.col];
      const tileB = this.board.tiles[b.row][b.col];
      this.board.swap(a, b);
      const forwardMoves = [
        { fromRow: a.row, fromCol: a.col, toRow: b.row, toCol: b.col, tile: tileA },
        { fromRow: b.row, fromCol: b.col, toRow: a.row, toCol: a.col, tile: tileB }
      ];
      await this.animateMoves(forwardMoves, 160);
      const match = this.board.findMatches();
      if (!match.hasMatch) {
        this.board.swap(a, b);
        const backMoves = [
          { fromRow: b.row, fromCol: b.col, toRow: a.row, toCol: a.col, tile: tileA },
          { fromRow: a.row, fromCol: a.col, toRow: b.row, toCol: b.col, tile: tileB }
        ];
        await this.animateMoves(backMoves, 160);
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
        const gravityMoves = this.board.applyGravity();
        if (gravityMoves.length > 0) {
          await this.animateMoves(gravityMoves, 220, "easeOut");
        } else {
          this.renderer.draw(this.board.tiles, this.selected);
        }
        match = this.board.findMatches();
      }
    }
    wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    animateMoves(moves, duration, easing = "linear") {
      if (moves.length === 0) {
        this.renderer.draw(this.board.tiles, this.selected);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          const elapsed = now - start;
          const raw = Math.min(1, elapsed / duration);
          const t = easing === "easeOut" ? 1 - (1 - raw) * (1 - raw) : raw;
          this.renderer.draw(this.board.tiles, this.selected, moves, t);
          if (t < 1) {
            window.requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        window.requestAnimationFrame(step);
      });
    }
  };

  // src/main.ts
  window.addEventListener("load", () => {
    new Match3Game("game");
  });
})();
