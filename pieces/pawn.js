import { Piece } from "./piece";
import { Position, Player, PieceType } from "../utils.js";
export class Pawn extends Piece {
  constructor(position, color, upward) {
    super(position, color, upward);
    this.code = PieceType.PAWN;
    this.score = 1;
  }

  enPassant(board, change) {
    const moves = [];
    for (const i of [-1, 1]) {
      const tempPos = new Position(this.position.x + i, this.position.y);
      if (board.isWithinBoard(tempPos)) {
        const pieceToCapture = board.grid[tempPos.x][tempPos.y];
        if (
          pieceToCapture instanceof Pawn &&
          this.color !== pieceToCapture.color
        ) {
          const previousMove = board.recentMove();
          if (
            previousMove !== null &&
            previousMove[2] === this.code &&
            previousMove[4].x === this.position.x + i &&
            Math.abs(previousMove[4].y - previousMove[3].y) === 2
          ) {
            moves.push(
              new Position(this.position.x + i, this.position.y + change)
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
    let dx = this.position.x + offset;

    // all the possible moves of a pawn
    if (
      board.isWithinBoard(new Position(dx, this.position.y)) &&
      !board.grid[dx][this.position.y]
    ) {
      moves.push(new Position(dx, this.position.y));
      if (!this.previousMove) {
        dx += offset;
        if (!board.grid[dx][this.position.y]) {
          moves.push(new Position(dx, this.position.y));
        }
      }
    }

    dx = this.position.x + offset;
    // diagonal captures
    for (const i of [-1, 1]) {
      const dy = this.position.y + i;
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
