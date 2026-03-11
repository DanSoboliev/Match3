import { Board } from "./board.js";
import { Renderer } from "./renderer.js";
import { CellPos, MatchResult, MovingTile, TileType } from "./types.js";

export class Match3Game {
  private readonly board: Board;
  private readonly renderer: Renderer;

  private selected: CellPos | null = null;
  private isProcessing = false;
  private score = 0;
  private readonly scoreEl: HTMLElement | null;

  private isDragging = false;
  private dragStart: CellPos | null = null;
  private dragTile: TileType | null = null;

  constructor(canvasId: string) {
    this.board = new Board();
    this.renderer = new Renderer(canvasId);
    this.scoreEl = document.getElementById("score");

    this.attachEvents();
    const spawnMoves = this.board.getInitialSpawnMoves();
    if (spawnMoves.length > 0) {
      this.isProcessing = true;
      this.animateMoves(spawnMoves, 260, "easeOut")
        .catch((err) => console.error(err))
        .then(() => {
          this.isProcessing = false;
          this.renderer.draw(this.board.tiles, this.selected);
        });
    } else {
      this.renderer.draw(this.board.tiles, this.selected);
    }
  }

  private attachEvents(): void {
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
      this.dragTile = tile === null ? null : (tile as TileType);

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

      const dragMove: MovingTile = {
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

  private areNeighbors(a: CellPos, b: CellPos): boolean {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  private async handleSwap(a: CellPos, b: CellPos): Promise<void> {
    this.isProcessing = true;
    const tileA = this.board.tiles[a.row][a.col] as TileType;
    const tileB = this.board.tiles[b.row][b.col] as TileType;

    this.board.swap(a, b);

    const forwardMoves: MovingTile[] = [
      { fromRow: a.row, fromCol: a.col, toRow: b.row, toCol: b.col, tile: tileA },
      { fromRow: b.row, fromCol: b.col, toRow: a.row, toCol: a.col, tile: tileB }
    ];

    await this.animateMoves(forwardMoves, 160);

    const match = this.board.findMatches();

    if (!match.hasMatch) {
      this.board.swap(a, b);
      const backMoves: MovingTile[] = [
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

  private async resolveMatchesLoop(firstMatch: MatchResult): Promise<void> {
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

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private animateMoves(
    moves: MovingTile[],
    duration: number,
    easing: "linear" | "easeOut" = "linear"
  ): Promise<void> {
    if (moves.length === 0) {
      this.renderer.draw(this.board.tiles, this.selected);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const raw = Math.min(1, elapsed / duration);
        const t =
          easing === "easeOut" ? 1 - (1 - raw) * (1 - raw) : raw;
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
}

