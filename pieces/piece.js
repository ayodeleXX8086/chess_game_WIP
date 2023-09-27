import { Position, Player } from "../utils.js";
export class Piece {
  constructor(position, color, movement, aiPlayer) {
    this.aiPlayer = aiPlayer;
    this.multiplier = aiPlayer ? 1 : -1;
    this.position = position;
    this.color = color; // White,  Black
    this.previousMove = null;
    this.code = null;
    this.movement = movement;
    this.score = 0;
    this.isUser = color !== Player.EMPTY;
  }

  updatePosition(position) {
    this.position = position.getCopy();
  }

  getPatternMoves(board, patterns) {
    const moves = [];
    const captures = [];
    for (const pattern of patterns) {
      const [m, c] = this.generator(board, ...pattern.reverse());
      moves.push(...m);
      captures.push(...c);
    }
    return [moves, captures];
  }

  generator(board, dx, dy) {
    const moves = [];
    const captures = [];
    let pos = new Position(this.position.x + dx, this.position.y + dy);

    while (board.isWithinBoard(pos) && !board.grid[pos.x][pos.y]) {
      moves.push(pos.getCopy());
      pos = new Position(pos.x + dx, pos.y + dy);
    }
    if (
      board.isWithinBoard(pos) &&
      board.grid[pos.x][pos.y] &&
      board.grid[pos.x][pos.y].color !== this.color
    ) {
      captures.push(pos.getCopy());
    }

    return [moves, captures];
  }

  equals(otherPiece) {
    if (this === otherPiece) {
      return true; // They are the same object
    }

    if (!(otherPiece instanceof Piece)) {
      return false; // It's not even an instance of Piece
    }

    // Compare position, color, and code properties
    return (
      this.position.equals(otherPiece.position) &&
      this.color === otherPiece.color &&
      this.code === otherPiece.code
    );
  }
}
