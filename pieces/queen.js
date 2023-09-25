import { Piece } from "./piece";
import { movePatterns } from "./moves";
import { PieceType } from "../utils.js";
export class Queen extends Piece {
  constructor(position, color, upward) {
    super(position, color, upward);
    this.code = PieceType.QUEEN;
    this.score = 9;
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
