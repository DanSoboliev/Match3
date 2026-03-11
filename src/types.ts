export const ROWS = 8;
export const COLS = 8;
export const TILE_TYPES = 5;

export type TileType = 0 | 1 | 2 | 3 | 4;

export type Tile = TileType | null;

export interface CellPos {
  row: number;
  col: number;
}

export interface MatchResult {
  hasMatch: boolean;
  toClear: boolean[][];
  clearedCount: number;
}

export interface MovingTile {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  tile: TileType;
}