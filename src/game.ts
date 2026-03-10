import { Board } from "./board.js";
import { Renderer } from "./renderer.js";
import { CellPos, MatchResult } from "./types.js";

export class Match3Game {
  private readonly board: Board;
  private readonly renderer: Renderer;

  private selected: CellPos | null = null;
  private isProcessing = false;
  private score = 0;
  private readonly scoreEl: HTMLElement | null;

  constructor(canvasId: string) {
    this.board = new Board();
    this.renderer = new Renderer(canvasId);
    this.scoreEl = document.getElementById("score");

    this.attachEvents();
    this.renderer.draw(this.board.tiles, this.selected);
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

  private areNeighbors(a: CellPos, b: CellPos): boolean {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  private async handleSwap(a: CellPos, b: CellPos): Promise<void> {
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

      this.board.applyGravity();
      this.renderer.draw(this.board.tiles, this.selected);
      await this.wait(120);

      match = this.board.findMatches();
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}