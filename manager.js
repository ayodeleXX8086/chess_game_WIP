import { Position, Player, PIECE_MAP } from "./utils.js";
import { Board } from "./board";
import { ChessMinmaxAI } from "./ai";
export class ChessAppManager {
  constructor() {
    console.log("Initialized before");
    this.gameBoard = document.querySelector("#gameboard");
    this.playerDisplay = document.querySelector("#player");
    this.infoDisplay = document.querySelector("#info-display");
    this.displayBlackScore = document.querySelector("#score_black");
    this.displayWhiteScore = document.querySelector("#score_white");
    this.board = new Board();
    this.chessSquares = this.#createBoard(this.gameBoard, this.board);
    this.selectedPiece = null;
    this.selectedPieceMoves = null;
    this.selectedPieceCaptures = null;
    this.currentPosition = new Position(0, 0);
    this.prevPossibleMoves = [];
    this.chessAI = new ChessMinmaxAI(
      3,
      this.board,
      this.board.player === Player.BLACK ? Player.WHITE : Player.BLACK
    );
    this.clonedGrid = ChessAppManager.cloneMatrix(this.board.grid);
    this.#displayPlayerAndScore();
  }

  #displayPlayerAndScore() {
    this.playerDisplay.textContent = this.board.player;
    this.displayBlackScore.textContent = this.board.score[Player.BLACK];
    this.displayWhiteScore.textContent = this.board.score[Player.WHITE];
  }

  getCurrentPosition(element) {
    const target =
      element.getAttribute("square-id") ||
      element.parentNode.getAttribute("square-id");
    const [row, col] = target.split(",");
    return new Position(parseInt(row), parseInt(col));
  }

  #createBoard(gameBoard, board) {
    const result = [];
    for (let i = 0; i < 8; i++) {
      result[i] = [];
      for (let j = 0; j < 8; j++) {
        result[i][j] = this.initializeSquare(new Position(i, j));
        if (board.getPieceFromBoard(new Position(i, j))) {
          ChessAppManager.overrideElement(
            result[i][j],
            board.getPieceFromBoard(new Position(i, j))
          );
        }
        gameBoard.append(result[i][j]);
      }
    }
    return result;
  }

  dragStart(e) {
    this.currentPosition = this.getCurrentPosition(e.target);
    if (!this.board.isValidPick(this.currentPosition)) {
      this.infoDisplay.textContent = "You cannot pick this";
    }
    if (
      this.board.pieceToPromote &&
      this.currentPosition.x === this.board.pieceToPromote.position.x
    ) {
      const choice = this.currentPosition.y;
      if (choice <= 3 && this.board.player === Player.BLACK) {
        this.board.promotePawn(this.board.pieceToPromote, choice);
      } else if (choice > 3 && this.board.player === Player.WHITE) {
        this.board.promotePawn(this.board.pieceToPromote, 7 - choice);
      }
      ChessAppManager.updateChessSquares(
        this.clonedGrid,
        this.board.grid,
        this.chessSquares
      );
      return;
    } else {
      const piece = this.board.getPieceFromBoard(this.currentPosition);
      if (piece) {
        this.selectedPiece = piece;
        [this.selectedPieceMoves, this.selectedPieceCaptures] =
          this.board.getAllowedMoves(this.selectedPiece);
      }
    }
  }
  dragOver(e) {
    e.preventDefault();
  }

  dragDrop(e) {
    e.preventDefault();
    const currentPosition = this.getCurrentPosition(e.target);
    this.revertHighlightedColor();
    if (this.selectedPiece) {
      if (
        this.selectedPieceCaptures.some((position) =>
          position.isEqual(currentPosition)
        ) ||
        this.selectedPieceMoves.some((position) =>
          position.isEqual(currentPosition)
        )
      ) {
        this.moveChessPieceAndDisplay(
          this.selectedPiece,
          currentPosition,
          false
        );
        if (this.board.player === this.chessAI.computer_player) {
          const [piece, bestMove] = this.chessAI.start(0);
          this.moveChessPieceAndDisplay(piece, bestMove, true);
        }
      } else {
        this.infoDisplay.textContent = "You cannot go here\n";
      }
    }
  }

  moveChessPieceAndDisplay(piece, currentPosition, AI) {
    this.board.move(piece, currentPosition);
    if (AI && this.board.grid) {
      if (this.board.pieceToPromote) {
        this.board.promotePawn(this.board.pieceToPromote, 0);
      }
    }
    ChessAppManager.updateChessSquares(
      this.clonedGrid,
      this.board.grid,
      this.chessSquares
    );
    this.#displayPlayerAndScore();
  }

  handleMouseEnter(e) {
    e.preventDefault();
    const currentPosition = this.getCurrentPosition(e.target);
    const piece = this.board.getPieceFromBoard(currentPosition);
    console.log("Mouse enter", currentPosition);
    console.log("Mouse enter", this.board.grid);
    console.log(piece);
    if (piece && piece.color === this.board.player) {
      const [validMoves, validCaptures] = this.board.getAllowedMoves(piece);
      console.log("Valid moves", validMoves, "Valid captures", validCaptures);
      this.prevPossibleMoves = [
        ...(validMoves || []),
        ...(validCaptures || []),
      ];
      this.prevPossibleMoves?.forEach((element) => {
        console.log("Position element", element, this.chessSquares);
        ChessAppManager.displayAsPossibleThreat(
          this.chessSquares[element.x][element.y]
        );
      });
    } else {
      console.log("Cannot display piece ", piece);
    }
  }

  handleMouseLeave(e) {
    e.preventDefault();
    this.revertHighlightedColor();
  }

  revertHighlightedColor() {
    this.prevPossibleMoves?.forEach((element) => {
      console.log("Position element", element, this.chessSquares);
      ChessAppManager.revertToSquareColorFromPossibleThreat(
        this.chessSquares[element.x][element.y]
      );
    });
    this.prevPossibleMoves = [];
  }

  initializeSquare(position) {
    const square = document.createElement("div");
    square.classList.add("square");
    var square_color;
    if (position.x % 2 === 0) {
      square_color = position.index % 2 === 0 ? "beige" : "brown";
    } else {
      square_color = position.index % 2 === 0 ? "brown" : "beige";
    }
    square.classList.add(square_color);
    square.setAttribute("square-id", position.getTuple().join(","));
    square.addEventListener("mouseenter", this.handleMouseEnter.bind(this));
    square.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    square.addEventListener("dragover", this.dragOver.bind(this));
    square.addEventListener("dragstart", this.dragStart.bind(this));
    square.addEventListener("drop", this.dragDrop.bind(this));
    return square;
  }

  static displayAsPossibleThreat(square) {
    square.classList.add("highlighted-red");
    return square;
  }
  static revertToSquareColorFromPossibleThreat(square) {
    square.classList.remove("highlighted-red");
    return square;
  }
  static revertToSquareColorFromThreatToKing(square) {
    square.classList.remove("highlighted-blue");
    return square;
  }
  static displayPossibleThreatToKing(square) {
    square.classList.add("highlighted-blue");
    return square;
  }

  static makeElementEmpty(square) {
    square.innerHTML = "";
    return square;
  }

  static overrideElement(square, piece) {
    const piece_element = PIECE_MAP[piece.code.toLowerCase()];
    square.innerHTML = "";
    square.innerHTML = piece_element;
    square.firstElementChild.style.fill = piece.color;
    square?.firstElementChild?.setAttribute("player", piece.color);
    square?.firstElementChild?.setAttribute("draggable", true);
    square?.firstElementChild?.setAttribute("movement", piece.movement);
    return square;
  }

  static cloneMatrix(matrix) {
    const clonedMatrix = [];
    for (let i = 0; i < matrix.length; i++) {
      const clonedRow = matrix[i].slice();
      clonedMatrix.push(clonedRow);
    }
    return clonedMatrix;
  }

  static updateChessSquares(cloned_board, original_board, square_board) {
    console.log("Update chess sqaure");
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (cloned_board[i][j] !== original_board[i][j]) {
          square_board[i][j] = !original_board[i][j]
            ? ChessAppManager.makeElementEmpty(square_board[i][j])
            : ChessAppManager.overrideElement(
                square_board[i][j],
                original_board[i][j]
              );
          cloned_board[i][j] = original_board[i][j];
        }
      }
    }
  }
}
