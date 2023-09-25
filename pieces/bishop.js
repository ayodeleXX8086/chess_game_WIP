import { Piece } from "./piece.js";
import { movePatterns } from "./moves";
import { PieceType } from "../utils.js";
export class Bishop extends Piece {
  constructor(position, color, upward) {
    super(position, color, upward);
    this.code = PieceType.BISHOP;
    this.score = 3;
  }

  getMoves(board) {
    const [moves, captures] = this.diagonalMoves(board);
    return [moves, captures];
  }

  diagonalMoves(board) {
    return this.getPatternMoves(board, movePatterns.bishop);
  }
}
