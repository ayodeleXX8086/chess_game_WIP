import { Piece } from "./piece.js";
import { Position, PieceType } from "../utils.js";
export class Knight extends Piece {
  constructor(position, color, upward) {
    super(position, color, upward);
    this.code = PieceType.KNIGHT;
    this.score = 3;
  }

  getMoves(board) {
    const moves = [];
    const captures = [];

    for (let i = -2; i <= 2; i++) {
      if (i !== 0) {
        for (let j = -2; j <= 2; j++) {
          if (j !== 0) {
            const dx = this.position.x + i;
            const dy = this.position.y + j;
            const temp = new Position(dx, dy);
            if (Math.abs(i) !== Math.abs(j) && board.isWithinBoard(temp)) {
              if (!board.grid[dx][dy]) {
                moves.push(temp.getCopy());
              } else {
                if (board.grid[dx][dy].color !== this.color) {
                  captures.push(temp.getCopy());
                }
              }
            }
          }
        }
      }
    }
    return [moves, captures];
  }
}
