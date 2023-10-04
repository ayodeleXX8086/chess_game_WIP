import { Piece } from "./piece";
import { Position, Player, PieceType } from "../utils.js";
export class Pawn extends Piece {
  constructor(position, color, upward, isAI) {
    super(position, color, upward, isAI);
    this.code = PieceType.PAWN;
    this.score = 10 * this.multiplier;
  }

  enPassant(board, change) {
    const moves = [];
    for (const i of [-1, 1]) {
      const tempPos = new Position(this.position.row, this.position.col + i);
      if (board.isWithinBoard(tempPos)) {
        const pieceToCapture = board.grid[tempPos.row][tempPos.col];
        if (
          pieceToCapture instanceof Pawn &&
          this.color !== pieceToCapture.color
        ) {
          const previousMove = board.recentMove();
          if (
            previousMove &&
            previousMove[2] === this.code &&
            previousMove[4].col === this.position.col + i &&
            Math.abs(previousMove[4].row - previousMove[3].row) === 2
          ) {
            moves.push(
              new Position(this.position.row + change, this.position.col + i)
            );
          }
        }
      }
    }

    return moves;
  }

  getMoves(board) {
    const moves = [];
    const captures = [];
    const offset = this.color === Player.WHITE ? -1 : 1;
    let dx = this.position.row + offset;

    // all the possible moves of a pawn
    if (
      board.isWithinBoard(new Position(dx, this.position.col)) &&
      !board.grid[dx][this.position.col]
    ) {
      moves.push(new Position(dx, this.position.col));
      if (!this.previousMove) {
        dx += offset;
        if (!board.grid[dx][this.position.col]) {
          moves.push(new Position(dx, this.position.col));
        }
      }
    }

    dx = this.position.row + offset;
    // diagonal captures
    for (const i of [-1, 1]) {
      const dy = this.position.col + i;
      if (board.isWithinBoard(new Position(dx, dy)) && board.grid[dx][dy]) {
        if (board.grid[dx][dy].color !== this.color) {
          captures.push(new Position(dx, dy));
        }
      }
    }

    // EN PASSANT CAPTURES
    const specialMoves = this.enPassant(board, offset);
    captures.push(...specialMoves);

    return [moves, captures];
  }
}
