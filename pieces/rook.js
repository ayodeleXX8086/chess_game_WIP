import { Piece } from "./piece";
import { movePatterns } from "./moves";
import { PieceType } from "../utils.js";
export class Rook extends Piece {
  constructor(position, color, upward) {
    super(position, color, upward);
    this.code = PieceType.ROOK;
    this.score = 5;
  }

  getMoves(board) {
    const [moves, captures] = this.vertHorzMoves(board);
    return [moves, captures];
  }

  vertHorzMoves(board) {
    return this.getPatternMoves(board, movePatterns.rook);
  }
}
