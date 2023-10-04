import { Piece } from "./piece.js";
import { movePatterns } from "./moves";
import { PieceType } from "../utils.js";
export class Bishop extends Piece {
  constructor(position, color, upward, isAI) {
    super(position, color, upward, isAI);
    this.code = PieceType.BISHOP;
    this.score = 30 * this.multiplier;
  }

  getMoves(board) {
    const [moves, captures] = this.diagonalMoves(board);
    return [moves, captures];
  }

  diagonalMoves(board) {
    return this.getPatternMoves(board, movePatterns.bishop);
  }
}
