import { Piece } from "./piece.js";
import { Position, PieceType } from "../utils.js";
export class King extends Piece {
  constructor(position, color, upward) {
    super(position, color, upward);
    this.code = PieceType.KING;
    this.score = 100;
  }

  canCastle(piece) {
    return piece !== null && !piece.previousMove;
  }

  castle(board) {
    const castles = [];
    const rightRook = board.grid[7][this.position.y];
    const leftRook = board.grid[0][this.position.y];

    // check if the king hasn't moved
    // check if there is no piece between the rooks and the king
    if (!this.previousMove) {
      // CASTLE LEFT
      if (
        !board.grid[1][this.position.y] &&
        !board.grid[2][this.position.y] &&
        !board.grid[3][this.position.y] &&
        this.canCastle(leftRook)
      ) {
        castles.push(new Position(2, this.position.y));
      }
      // CASTLE RIGHT
      if (
        !board.grid[5][this.position.y] &&
        !board.grid[6][this.position.y] &&
        this.canCastle(rightRook)
      ) {
        castles.push(new Position(6, this.position.y));
      }
    }

    return castles;
  }

  getMoves(board) {
    const moves = [];
    const captures = [];
    const castles = this.castle(board);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const dx = this.position.x + x;
        const dy = this.position.y + y;
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
