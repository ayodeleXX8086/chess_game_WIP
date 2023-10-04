import { Piece } from "./piece.js";
import { Position, PieceType } from "../utils.js";
export class King extends Piece {
  constructor(position, color, upward, aiPlayer) {
    super(position, color, upward, aiPlayer);
    this.code = PieceType.KING;
    this.score = 900 * this.multiplier;
  }

  canCastle(piece) {
    return piece && !piece.previousMove;
  }

  castle(board) {
    const castles = [];
    const rightRook = board.grid[this.position.row][7];
    const leftRook = board.grid[this.position.row][0];

    // check if the king hasn't moved
    // check if there is no piece between the rooks and the king
    if (!this.previousMove) {
      // CASTLE LEFT
      if (
        !board.grid[this.position.row][1] &&
        !board.grid[this.position.row][2] &&
        !board.grid[this.position.row][3] &&
        this.canCastle(leftRook)
      ) {
        castles.push(new Position(this.position.row, 2));
      }
      // CASTLE RIGHT
      if (
        !board.grid[this.position.row][5] &&
        !board.grid[this.position.row][6] &&
        this.canCastle(rightRook)
      ) {
        castles.push(new Position(this.position.row, 6));
      }
    }

    return castles;
  }

  getMoves(board) {
    const moves = [];
    const captures = [];
    const castles = this.castle(board);

    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        const dx = this.position.row + x;
        const dy = this.position.col + y;
        const temp = new Position(dx, dy);
        if ((x !== 0 || y !== 0) && board.isWithinBoard(temp)) {
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
    moves.push(...castles);
    return [moves, captures];
  }
}
