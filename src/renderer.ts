import { ROWS, COLS, Tile, TileType, CellPos } from "./types.js";

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly tileSize: number;
  private readonly padding: number = 4;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
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

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  pixelToCell(x: number, y: number): CellPos | null {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
      return null;
    }
    return { row, col };
  }

  draw(board: Tile[][], selected: CellPos | null): void {
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

  private drawTile(row: number, col: number, tile: Tile): void {
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

    switch (tile as TileType) {
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

  private drawGrid(): void {
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

  private highlightCell(pos: CellPos): void {
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
}