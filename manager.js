import { Position, Player, PIECE_MAP, PieceType } from "./utils.js";
import { Board } from "./board";
import { ChessMinmaxAI } from "./ai";
export class ChessAppManager {
  constructor() {
    // console.log("Initialized before");
    this.gameBoard = document.querySelector("#gameboard");
    this.playerDisplay = document.querySelector("#player");
    this.infoDisplay = document.querySelector("#info-display");
    this.displayBlackScore = document.querySelector("#score_black");
    this.displayWhiteScore = document.querySelector("#score_white");
    //this.utnBtn = document.querySelector("#undoBtn");
    this.board = new Board();
    this.selectionPromo = {
      knightOption: PieceType.KNIGHT,
      rookOption: PieceType.ROOK,
      bishopOption: PieceType.BISHOP,
      queenOption: PieceType.QUEEN,
    };
    this.selectedPiecePromo = null;
    this.chessSquares = this.#createBoard(this.gameBoard, this.board);
    this.selectedPiece = null;
    this.selectedPieceMoves = null;
    this.selectedPieceCaptures = null;
    this.currentPosition = new Position(0, 0);
    this.prevPossibleMoves = [];
    this.chessAI = new ChessMinmaxAI(3, this.board);
    this.clonedGrid = ChessAppManager.cloneMatrix(this.board.grid);
    this.#displayPlayerAndScore();
    this.initialization();
  }

  #displayPlayerAndScore() {
    this.playerDisplay.textContent = this.board.player;
    this.displayBlackScore.textContent = this.board.score[Player.BLACK];
    this.displayWhiteScore.textContent = this.board.score[Player.WHITE];
    if (this.board.checkBlackKing || this.board.checkWhiteKing) {
      this.infoDisplay.textContent = this.board.checkWhiteKing
        ? "White king is on check"
        : "Black king is on check";
    }
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
    const piece = this.board.getPieceFromBoard(this.currentPosition);
    if (piece) {
      this.selectedPiece = piece;
      [this.selectedPieceMoves, this.selectedPieceCaptures] =
        this.board.getAllowedMoves(this.selectedPiece);
    }
  }
  dragOver(e) {
    e.preventDefault();
  }

  dragDrop(e) {
    e.preventDefault();
    const currentPosition = this.getCurrentPosition(e.target);
    this.revertHighlightedColor();
    if (
      this.selectedPiece &&
      this.selectedPiece.position !== currentPosition &&
      (this.selectedPieceCaptures.some((position) =>
        position.equals(currentPosition)
      ) ||
        this.selectedPieceMoves.some((position) =>
          position.equals(currentPosition)
        ))
    ) {
      this.moveChessPieceAndDisplay(this.selectedPiece, currentPosition, false);
      if (this.board.player === this.chessAI.computer_player) {
        const [piece, bestMove] = this.chessAI.start(0);
        // console.log("Best move", bestMove, "Piece ", piece);
        this.moveChessPieceAndDisplay(piece, bestMove, true);
      }
    } else {
      this.infoDisplay.textContent = "You cannot go here\n";
    }
  }

  moveChessPieceAndDisplay(piece, currentPosition, AI) {
    this.board.move(piece, currentPosition);
    if (this.board.pieceToPromote) {
      const choice = this.board.pieceToPromote.position.col;
      if (AI) {
        this.board.promotePawn(
          this.board.pieceToPromote,
          choice >= 3 ? choice : 7 - choice
        );
      } else {
        this.pieceSelectionModal.show();
        if (this.selectedPiecePromo) {
          this.board.promotePawn(
            this.board.pieceToPromote,
            this.selectedPiecePromo
          );
        } else {
          this.board.promotePawn(
            this.board.pieceToPromote,
            choice >= 3 ? choice : 7 - choice
          );
        }
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
    if (piece && piece.color === this.board.player) {
      const [validMoves, validCaptures] = this.board.getAllowedMoves(piece);
      this.prevPossibleMoves = [
        ...(validMoves || []),
        ...(validCaptures || []),
      ];
      this.prevPossibleMoves?.forEach((element) => {
        ChessAppManager.displayAsPossibleThreat(
          this.chessSquares[element.row][element.col]
        );
      });
    }
  }

  handleMouseLeave(e) {
    e.preventDefault();
    this.revertHighlightedColor();
  }

  revertHighlightedColor() {
    this.prevPossibleMoves?.forEach((element) => {
      // console.log("Position element", element, this.chessSquares);
      ChessAppManager.revertToSquareColorFromPossibleThreat(
        this.chessSquares[element.row][element.col]
      );
    });
    this.prevPossibleMoves = [];
  }
  initialization() {
    document.getElementById("undoBtn").addEventListener("click", () => {
      this.displayResult("Game over sorry");

      document.getElementById("exitBtn").style.display = "block";
      document.getElementById("undoBtn").style.display = "none";
      document.getElementById("gameboard").style.pointerEvents = "none";
    });
    this.initializePromotePawnDialog();
  }

  displayResult(message) {
    var modal = new bootstrap.Modal(document.getElementById("resultModal"));
    var modalBody = document.querySelector("#resultModal .modal-body");
    modalBody.textContent = message;
    modal.show();
  }
  initializePromotePawnDialog() {
    const rookPieceDocument = document.getElementById("rookPiece");
    const queenPieceDocument = document.getElementById("queenPiece");
    const bishopPieceDocument = document.getElementById("bishopPiece");
    const kinghtDocument = document.getElementById("knightPiece");
    const startButton = document.getElementById("undoBtn");
    rookPieceDocument.innerHTML = PIECE_MAP.rook;
    queenPieceDocument.innerHTML = PIECE_MAP.queen;
    bishopPieceDocument.innerHTML = PIECE_MAP.bishop;
    kinghtDocument.innerHTML = PIECE_MAP.knight;
    const pieceSelectionModal = new bootstrap.Modal(
      document.getElementById("pieceSelectionModal")
    );

    // Define a function to handle the click event for the "selectPieceButton"
    const handleSelectPiece = () => {
      const selectedPieceDocument = document.querySelector(
        'input[name="pieceOption"]:checked'
      );
      if (selectedPieceDocument) {
        const selectedPieceDocumentId = selectedPieceDocument.id;

        // Store the selected piece for later use
        this.selectedPiecePromo = this.selectionPromo[selectedPieceDocumentId];
        pieceSelectionModal.hide();
      }
    };

    document
      .getElementById("selectPieceButton")
      .addEventListener("click", handleSelectPiece);
    startButton.addEventListener("click", function () {
      pieceSelectionModal.show();
    });
    this.pieceSelectionModal = pieceSelectionModal;
  }

  initializeSquare(position) {
    const square = document.createElement("div");
    square.classList.add("square");
    var square_color;
    if (position.row % 2 === 0) {
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
    // console.log("Update chess sqaure");
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
