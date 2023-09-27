import { Bishop, King, Knight, Pawn, Queen, Rook } from "../pieces";
import { Player, GRID, PieceType, Position } from "../utils.js";
export class Board {
  constructor() {
    // Initialize an 8x8 matrix to represent the board
    this.player = Player.WHITE;
    this.computer_player =
      this.player === Player.BLACK ? Player.WHITE : Player.BLACK;
    this.grid = this.#createGrid(GRID);
    this.historic = [];
    this.score = { black: 0, white: 0 };
    this.moveIndex = 1;
    this.WhiteKing = null;
    this.BlackKing = null;
    this.checkWhiteKing = false;
    this.checkBlackKing = false;
    this.pieceToPromote = null;
    this.winner = null;
    for (let pieces of this.grid) {
      for (let piece of pieces) {
        if (piece) {
          if (piece.color === Player.WHITE && piece.code === PieceType.KING) {
            this.WhiteKing = piece;
          } else if (
            piece.color === Player.BLACK &&
            piece.code === PieceType.KING
          ) {
            this.BlackKing = piece;
          }
        }
      }
    }
  }

  switchTurn() {
    this.player = this.player === Player.BLACK ? Player.WHITE : Player.BLACK;
    this.isCheckmate();
  }

  recentMove() {
    return this.historic.length === 0
      ? null
      : this.historic[this.historic.length - 1];
  }

  recentMovePositions() {
    if (!this.historic || this.historic.length <= 1) {
      return [null, null];
    }
    const [_, __, ___, pos, oldPos] = this.historic[this.historic.length - 1];
    return [pos.getCopy(), oldPos.getCopy()];
  }

  allowedMoveList(piece, moves, isAI) {
    const allowed_moves = [];
    for (let move of moves) {
      if (this.verifyMove(piece, move.getCopy())) {
        allowed_moves.push(move.getCopy());
      }
      // console.log("Allowed moves", allowed_moves);
    }
    return allowed_moves;
  }

  getAllowedMoves(piece) {
    const [moves, captures] = piece.getMoves(this);
    const allowedMoves = this.allowedMoveList(piece, [...moves], false);
    const allowCaptures = this.allowedMoveList(piece, [...captures], false);
    // console.log("Valid moves", allowedMoves, "Valid capture", allowCaptures);
    return [allowedMoves, allowCaptures];
  }

  isValidPick(position) {
    const piece = this.grid[position.x][position.y];
    return piece && piece.color === this.player;
  }

  move(piece, position) {
    if (position) {
      position = position.getCopy();
      if (this.isCastling(piece, position.getCopy())) {
        this.castleKing(piece, position.getCopy());
      } else if (this.isEnPassant(piece, position.getCopy())) {
        this.grid[piece.position.x][position.y] = null;
        this.movePiece(piece, position);
        this.historic[this.historic.length - 1][2] = piece.code;
      } else {
        this.movePiece(piece, position);
      }

      if (
        piece instanceof Pawn &&
        (piece.position.x === 0 || piece.position.x === 7)
      ) {
        this.pieceToPromote = piece;
      } else {
        this.switchTurn();
      }

      this.check();
    }
  }

  movePiece(piece, position) {
    position = position.getCopy();
    const prevPiece = this.getPieceFromBoard(position);
    this.grid[piece.position.x][piece.position.y] = null;
    const oldPosition = piece.position.getCopy();
    piece.updatePosition(position);
    this.grid[position.x][position.y] = piece;
    this.historic.push([
      this.moveIndex,
      piece.color,
      piece.code,
      oldPosition,
      piece.position,
      piece,
    ]);
    piece.previousMove = this.moveIndex;
    this.moveIndex += 1;
    this.checkBlackKing = false;
    this.checkWhiteKing = false;
    if (prevPiece) {
      const playedId = this.player;
      const currentScore = prevPiece.score + this.score[playedId];
      this.score[playedId] = currentScore;
    }
  }

  isWithinBoard(position) {
    return (
      position.x >= 0 && position.x < 8 && position.y >= 0 && position.y < 8
    );
  }

  getPieceFromBoard(position) {
    return this.grid[position.x][position.y];
  }

  verifyMove(piece, move) {
    const position = move.getCopy();
    const oldPosition = piece.position.getCopy();
    let captureEnPassant = null;

    const capturedPiece = this.grid[position.x][position.y];

    if (this.isEnPassant(piece, position)) {
      captureEnPassant = this.grid[position.x][oldPosition.y];
      this.grid[position.x][oldPosition.y] = null;
    }

    this.grid[oldPosition.x][oldPosition.y] = null;
    this.grid[position.x][position.y] = piece;
    piece.updatePosition(move);

    const EnemyCaptures = this.getEnemyCaptures(this.player);

    if (
      (this.WhiteKing.position.isEqual(position) &&
        piece.color === Player.BLACK) ||
      (this.BlackKing.position.isEqual(position) &&
        piece.color === Player.WHITE)
    ) {
      this.undoMove(piece, capturedPiece, oldPosition, position);
      if (captureEnPassant) {
        this.grid[position.x][oldPosition.y] = captureEnPassant;
      }
      return false;
    }

    for (let pos of EnemyCaptures) {
      if (
        (this.WhiteKing.position.isEqual(pos) &&
          piece.color === Player.BLACK) ||
        (this.BlackKing.position.isEqual(pos) && piece.color === Player.WHITE)
      ) {
        this.undoMove(piece, capturedPiece, oldPosition, position);
        if (captureEnPassant) {
          this.grid[position.x][oldPosition.y] = captureEnPassant;
        }
        return false;
      }
    }

    this.undoMove(piece, capturedPiece, oldPosition, position);
    if (captureEnPassant) {
      this.grid[position.x][oldPosition.y] = captureEnPassant;
    }
    return true;
  }

  undoMove(piece, captured, oldPos, pos) {
    this.grid[oldPos.x][oldPos.y] = piece;
    this.grid[pos.x][pos.y] = captured;
    piece.updatePosition(oldPos);
  }

  getEnemyCaptures(player) {
    const captures = [];
    for (let pieces of this.grid) {
      for (let piece of pieces) {
        if (piece && piece.color !== player) {
          const [_, piececaptures] = piece.getMoves(this);
          captures.push(...piececaptures);
        }
      }
    }
    return captures;
  }

  applyPiece(piece) {
    if (this.is_within_board(piece.position)) {
      this.grid[piece.position.x][piece.position.y] = piece;
    }
  }

  #createGrid(grid) {
    const result = [];
    for (let i = 0; i < 8; i++) {
      result[i] = [];
      for (let j = 0; j < 8; j++) {
        const piece_info = grid[i][j];
        const [piece_type, player_type] = piece_info.split(",");
        if (player_type === Player.EMPTY) continue;
        var currPiece = null;
        switch (piece_type) {
          case PieceType.KING:
            currPiece = new King(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player
            );
            break;
          case PieceType.QUEEN:
            currPiece = new Queen(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player
            );
            break;
          case PieceType.ROOK:
            currPiece = new Rook(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player
            );
            break;
          case PieceType.KNIGHT:
            currPiece = new Knight(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player
            );
            break;
          case PieceType.PAWN:
            currPiece = new Pawn(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player
            );
            break;
          case PieceType.BISHOP:
            currPiece = new Bishop(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player
            );
            break;
          case PieceType.EMPTY:
          default:
            currPiece = null;
        }
        result[i][j] = currPiece;
      }
    }
    return result;
  }

  isCastling(king, position) {
    return king instanceof King && Math.abs(king.position.x - position.x) > 1;
  }

  isEnPassant(piece, newPos) {
    if (!(piece instanceof Pawn)) {
      return false;
    }

    let moves = null;
    if (piece.color === Player.BLACK) {
      moves = piece.enPassant(this, -1);
    } else {
      moves = piece.enPassant(this, 1);
    }

    return moves.some((move) => move.isEqual(newPos));
  }

  isInCheck(piece) {
    return (
      piece instanceof King &&
      ((piece.color === Player.BLACK && this.checkWhiteKing) ||
        (piece.color === Player.WHITE && this.checkBlackKing))
    );
  }

  castleKing(king, position) {
    position = position.getCopy();

    if (position.x === 2 || position.x === 6) {
      let rook;
      if (position.x === 2) {
        rook = this.grid[0][king.position.y];
        this.movePiece(king, position);
        this.grid[0][rook.position.y] = null;
        rook.position.x = 3;
      } else {
        rook = this.grid[7][king.position.y];
        this.movePiece(king, position);
        this.grid[7][rook.position.y] = null;
        rook.position.x = 5;
      }

      rook.previousMove = this.moveIndex - 1;
      this.grid[rook.position.x][rook.position.y] = rook;
      this.historic[this.historic.length - 1][2] = king.code;
    }
  }

  promotePawn(pawn, choice) {
    let newPiece = null;
    switch (choice) {
      case 0:
        newPiece = new Queen(pawn.position.getCopy(), pawn.color);
        break;
      case 1:
        newPiece = new Bishop(pawn.position.getCopy(), pawn.color);
        break;
      case 2:
        newPiece = new Knight(pawn.position.getCopy(), pawn.color);
        break;
      case 3:
        newPiece = new Rook(pawn.position.getCopy(), pawn.color);
        break;
      default:
        break;
    }

    this.grid[pawn.position.x][pawn.position.y] = newPiece;
    this.switchTurn();
    this.check();
    this.pieceToPromote = null;
  }

  moveSimulation(piece, next_pos) {
    if (!this.grid[next_pos.x][next_pos.y]) {
      this.grid[piece.position.x][piece.position.y] = null;
      piece.position = next_pos.getCopy();
      this.grid[next_pos.x][next_pos.y] = piece;
      return null;
    } else {
      const prev_piece = this.grid[next_pos.x][next_pos.y];
      this.grid[piece.position.x][piece.position.y] = null;
      piece.position = next_pos.getCopy();
      this.grid[next_pos.x][next_pos.y] = piece;
      return prev_piece;
    }
  }

  check() {
    let king = null;
    if (this.player === Player.BLACKs) {
      king = this.WhiteKing;
    } else {
      king = this.BlackKing;
    }

    for (let pieces of this.grid) {
      for (let piece of pieces) {
        if (piece && piece.color !== this.player) {
          const [moves, captures] = this.getAllowedMoves(piece);
          if (captures.some((pos) => pos.isEqual(king.position))) {
            if (this.player === 1) {
              this.checkBlackKing = true;
              return;
            } else {
              this.checkWhiteKing = true;
              return;
            }
          }
        }
      }
    }
  }

  isCheckmate() {
    for (let pieces of this.grid) {
      for (let piece of pieces) {
        if (piece && piece.color === this.player) {
          const [moves, captures] = this.getAllowedMoves(piece);
          if (moves.length > 0 || captures.length > 0) {
            return false;
          }
        }
      }
    }

    this.check();
    if (this.checkWhiteKing) {
      this.winner = 1;
    } else if (this.checkBlackKing) {
      this.winner = 0;
    } else {
      this.winner = -1;
    }

    return true;
  }
}
