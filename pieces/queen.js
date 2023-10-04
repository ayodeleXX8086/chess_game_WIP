import { Piece } from "./piece";
import { movePatterns } from "./moves";
import { PieceType } from "../utils.js";
export class Queen extends Piece {
  constructor(position, color, upward, aiPlayer) {
    super(position, color, upward, aiPlayer);
    this.code = PieceType.QUEEN;
    this.score = 90 * this.multiplier;
  }

  getMoves(board) {
    const [diagonalMoves, diagonalCaptures] = this.diagonalMoves(board);
    const [rMoves, rCaptures] = this.vertHorzMoves(board);
    const moves = diagonalMoves.concat(rMoves);
    const captures = diagonalCaptures.concat(rCaptures);

    return [moves, captures];
  }

  vertHorzMoves(board) {
    return this.getPatternMoves(board, movePatterns.rook);
  }

  diagonalMoves(board) {
    return this.getPatternMoves(board, movePatterns.bishop);
  }
}
