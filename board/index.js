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
    this.whiteKing = null;
    this.blackKing = null;
    this.checkWhiteKing = false;
    this.checkBlackKing = false;
    this.pieceToPromote = null;
    this.winner = null;
    this.whitePromotions = {};
    this.blackPromotions = {};
    this.promos = [
      PieceType.BISHOP,
      PieceType.QUEEN,
      PieceType.KNIGHT,
      PieceType.QUEEN,
    ];
    for (let pieces of this.grid) {
      for (let piece of pieces) {
        if (piece) {
          if (
            piece.color === Player.WHITE &&
            this.promos.includes(piece.code)
          ) {
            this.whitePromotions[piece.code] = piece;
          }
          if (
            piece.color === Player.BLACK &&
            this.promos.includes(piece.code)
          ) {
            this.blackPromotions[piece.code] = piece;
          }
          if (piece.color === Player.WHITE && piece.code === PieceType.KING) {
            this.whiteKing = piece;
          } else if (
            piece.color === Player.BLACK &&
            piece.code === PieceType.KING
          ) {
            this.blackKing = piece;
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
    const piece = this.grid[position.row][position.col];
    return piece && piece.color === this.player;
  }

  move(piece, position) {
    if (position) {
      position = position.getCopy();
      if (this.isCastling(piece, position.getCopy())) {
        this.castleKing(piece, position.getCopy());
      } else if (this.isEnPassant(piece, position.getCopy())) {
        this.grid[piece.position.row][position.col] = null;
        this.movePiece(piece, position);
        this.historic[this.historic.length - 1][2] = piece.code;
      } else {
        this.movePiece(piece, position);
      }

      if (
        piece instanceof Pawn &&
        (piece.position.row === 0 || piece.position.row === 7)
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
    this.grid[piece.position.row][piece.position.col] = null;
    const oldPosition = piece.position.getCopy();
    piece.updatePosition(position);
    this.grid[position.row][position.col] = piece;
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
      const currentScore = Math.abs(prevPiece.score) + this.score[playedId];
      this.score[playedId] = currentScore;
    }
  }

  isWithinBoard(position) {
    return (
      position.row >= 0 &&
      position.row < 8 &&
      position.col >= 0 &&
      position.col < 8
    );
  }

  getPieceFromBoard(position) {
    return this.grid[position.row][position.col];
  }

  verifyMove(piece, move) {
    const position = move.getCopy();
    const oldPosition = piece.position.getCopy();
    let captureEnPassant = null;

    const capturedPiece = this.grid[position.row][position.col];

    if (this.isEnPassant(piece, position)) {
      captureEnPassant = this.grid[oldPosition.row][position.col];
      this.grid[oldPosition.row][position.col] = null;
    }

    this.grid[oldPosition.row][oldPosition.col] = null;
    this.grid[position.row][position.col] = piece;
    piece.updatePosition(move);

    const EnemyCaptures = this.getEnemyCaptures(this.player);
    if (this.isCastling(piece, oldPosition)) {
      if (
        (Math.abs(position.col - oldPosition.col) === 2 &&
          !this.verifyMove(piece, new Position(position.row, 5))) ||
        (Math.abs(position.col - oldPosition.col) === 3 &&
          !this.verifyMove(piece, new Position(position.row, 3))) ||
        this.isInCheck(piece)
      ) {
        this.undoMove(piece, capturedPiece, oldPosition, position);
        return false;
      }
    }

    for (let pos of EnemyCaptures) {
      if (
        (this.whiteKing.position.equals(pos) && piece.color === Player.WHITE) ||
        (this.blackKing.position.equals(pos) && piece.color === Player.BLACK)
      ) {
        this.undoMove(piece, capturedPiece, oldPosition, position);
        if (captureEnPassant) {
          this.grid[oldPosition.row][position.col] = captureEnPassant;
        }
        return false;
      }
    }

    this.undoMove(piece, capturedPiece, oldPosition, position);
    if (captureEnPassant) {
      this.grid[oldPosition.row][position.col] = captureEnPassant;
    }
    return true;
  }

  undoMove(piece, captured, oldPos, pos) {
    this.grid[oldPos.row][oldPos.col] = piece;
    this.grid[pos.row][pos.col] = captured;
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
      this.grid[piece.position.row][piece.position.col] = piece;
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
              this.computer_player === player_type
            );
            break;
          case PieceType.QUEEN:
            currPiece = new Queen(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player === player_type
            );
            break;
          case PieceType.ROOK:
            currPiece = new Rook(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player === player_type
            );
            break;
          case PieceType.KNIGHT:
            currPiece = new Knight(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player === player_type
            );
            break;
          case PieceType.PAWN:
            currPiece = new Pawn(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player === player_type
            );
            break;
          case PieceType.BISHOP:
            currPiece = new Bishop(
              new Position(i, j),
              player_type,
              player_type === Player.BLACK,
              this.computer_player === player_type
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
    return (
      king instanceof King && Math.abs(king.position.col - position.col) > 1
    );
  }

  isEnPassant(piece, newPos) {
    if (!(piece instanceof Pawn)) {
      return false;
    }

    let moves = null;
    if (piece.color === Player.WHITE) {
      moves = piece.enPassant(this, -1);
    } else {
      moves = piece.enPassant(this, 1);
    }

    return moves.some((move) => move.equals(newPos));
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

    if (position.col === 2 || position.col === 6) {
      let rook;
      if (position.col === 2) {
        rook = this.grid[king.position.row][0];
        this.movePiece(king, position);
        this.grid[rook.position.row][0] = null;
        rook.position.col = 3;
      } else {
        rook = this.grid[king.position.row][7];
        this.movePiece(king, position);
        this.grid[rook.position.row][7] = null;
        rook.position.col = 5;
      }

      rook.previousMove = this.moveIndex - 1;
      this.grid[rook.position.row][rook.position.col] = rook;
      this.historic[this.historic.length - 1][2] = king.code;
    }
  }

  promotePawn(pawn, choice) {
    let newPiece = null;
    switch (choice) {
      case PieceType.QUEEN:
      case 0:
        newPiece = new Queen(
          pawn.position.getCopy(),
          pawn.color,
          pawn.upward,
          pawn.aiPlayer
        );
        break;

      case PieceType.BISHOP:
      case 1:
        newPiece = new Bishop(
          pawn.position.getCopy(),
          pawn.color,
          pawn.upward,
          pawn.aiPlayer
        );
        break;
      case PieceType.KNIGHT:
      case 2:
        newPiece = new Knight(
          pawn.position.getCopy(),
          pawn.color,
          pawn.upward,
          pawn.aiPlayer
        );
        break;
      case PieceType.ROOK:
      case 3:
        newPiece = new Rook(
          pawn.position.getCopy(),
          pawn.color,
          pawn.upward,
          pawn.aiPlayer
        );
        break;
      default:
        break;
    }
    this.overridePosition(pawn, newPiece);
  }

  overridePosition(pawn, newPiece) {
    this.grid[pawn.position.row][pawn.position.col] = newPiece;
    this.switchTurn();
    this.check();
    this.pieceToPromote = null;
  }

  moveSimulation(piece, next_pos) {
    if (!this.grid[next_pos.row][next_pos.col]) {
      this.grid[piece.position.row][piece.position.col] = null;
      piece.position = next_pos.getCopy();
      this.grid[next_pos.row][next_pos.col] = piece;
      return null;
    } else {
      const prev_piece = this.grid[next_pos.row][next_pos.col];
      this.grid[piece.position.row][piece.position.col] = null;
      piece.position = next_pos.getCopy();
      this.grid[next_pos.row][next_pos.col] = piece;
      return prev_piece;
    }
  }

  check() {
    let king = null;
    if (this.player === Player.WHITE) {
      king = this.whiteKing;
    } else {
      king = this.blackKing;
    }

    for (let pieces of this.grid) {
      for (let piece of pieces) {
        if (piece && piece.color !== this.player) {
          const [moves, captures] = this.getAllowedMoves(piece);
          if (captures.some((pos) => pos.equals(king.position))) {
            if (this.player === Player.BLACK) {
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
