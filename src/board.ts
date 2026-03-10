import { ROWS, COLS, TILE_TYPES, Tile, TileType, MatchResult, CellPos } from "./types.js";

export class Board {
  private grid: Tile[][] = [];

  constructor() {
    this.initWithoutMatches();
  }

  get tiles(): Tile[][] {
    return this.grid;
  }

  swap(a: CellPos, b: CellPos): void {
    const t1 = this.grid[a.row][a.col];
    const t2 = this.grid[b.row][b.col];
    this.grid[a.row][a.col] = t2;
    this.grid[b.row][b.col] = t1;
  }

  findMatches(): MatchResult {
    const toClear: boolean[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const rowMarks: boolean[] = [];
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

  clearMatches(toClear: boolean[][]): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (toClear[r][c]) {
          this.grid[r][c] = null;
        }
      }
    }
  }

  applyGravity(): void {
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

  private initWithoutMatches(): void {
    this.grid = [];
    for (let row = 0; row < ROWS; row++) {
      const line: Tile[] = [];
      for (let col = 0; col < COLS; col++) {
        let tile: TileType;
        do {
          tile = this.randomTile();
        } while (this.createsMatchAt(line, row, col, tile));
        line.push(tile);
      }
      this.grid.push(line);
    }
  }

  private randomTile(): TileType {
    return Math.floor(Math.random() * TILE_TYPES) as TileType;
  }

  private createsMatchAt(
    currentRowValues: Tile[],
    row: number,
    col: number,
    tile: TileType
  ): boolean {
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
}