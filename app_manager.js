class ChessManager {
  constructor() {
    this.events = {
      dragstart: this.dragStart.bind(this),
      dragover: this.dragOver.bind(this),
      drop: this.dragDrop.bind(this),
      mouseenter: this.handleMouseEnter.bind(this),
      mouseleave: this.handleMouseLeave.bind(this),
    };
    this.gameBoard = document.querySelector("#gameboard");
    this.playerDisplay = document.querySelector("#player");
    this.infoDisplay = document.querySelector("#info-display");
    this.pieces = this.#createPiece();
    this.current_player = Player.BLACK;
    this.current_piece = null;
    this.#addSquaresToBoard();
    this.map = this.#getDictionaryForPiece();
    this.playerDisplay.textContent = this.current_player;
  }
  #createPiece() {
    const chessElement = [
      rook,
      knight,
      bishop,
      queen,
      king,
      bishop,
      knight,
      rook,
      pawn,
      pawn,
      pawn,
      pawn,
      pawn,
      pawn,
      pawn,
      pawn,
    ];
    const range = [...Array(64)].map((_, i) => i);
    return range.map((idx) => {
      if (0 <= idx && idx <= 15) {
        return new Piece(
          idx,
          Player.BLACK,
          8,
          chessElement[idx % chessElement.length],
          this.events,
          true
        );
      } else if (48 <= idx && idx <= 63) {
        return new Piece(
          idx,
          Player.WHITE,
          8,
          chessElement[63 - idx],
          this.events,
          true
        );
      }
      return new Piece(idx, Player.EMPTY, 8, "", this.events);
    });
  }
  #getDictionaryForPiece() {
    const dictionary = {};
    this.pieces.forEach((value) => {
      dictionary[value.Index] = value;
      dictionary[value.RowAndCol] = value;
    });
    return dictionary;
  }
  #addSquaresToBoard() {
    this.pieces.forEach((piece) => {
      this.gameBoard.append(piece.Sqaure);
    });
  }
  #validMove(targetMove, current_piece) {
    switch (current_piece.Type) {
      case PieceType.PAWN:
        const pawn_dx = current_piece.IsUpward ? -1 : 1;
        const pawn_dy = current_piece.IsUpward ? 0 : 0;

        const singleStepMove =
          current_piece.RowAndCol[0] + pawn_dx === targetMove.RowAndCol[0] &&
          current_piece.RowAndCol[1] + pawn_dy === targetMove.RowAndCol[1] &&
          targetMove.IsSquareEmpty;

        const doubleStepMove =
          current_piece.firstMove &&
          current_piece.RowAndCol[0] + 2 * pawn_dx ===
            targetMove.RowAndCol[0] &&
          current_piece.RowAndCol[1] + 2 * pawn_dy ===
            targetMove.RowAndCol[1] &&
          targetMove.IsSquareEmpty;

        const captureMove =
          current_piece.RowAndCol[0] + pawn_dx === targetMove.RowAndCol[0] &&
          Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]) ===
            1 &&
          !targetMove.IsSquareEmpty;

        return singleStepMove || doubleStepMove || captureMove;
      case PieceType.KING:
        // King moves
        const resultKing =
          Math.abs(current_piece.RowAndCol[0] - targetMove.RowAndCol[0]) <= 1 &&
          Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]) <= 1;
        return resultKing;

      case PieceType.QUEEN:
        // Queen moves
        const resultQueen =
          this.#isValidDiagonalMove(targetMove, current_piece) ||
          this.#isValidStraightMove(targetMove, current_piece);
        return resultQueen;

      case PieceType.ROOK:
        // Rook moves
        const resultRook = this.#isValidStraightMove(targetMove, current_piece);
        return resultRook;

      case PieceType.BISHOP:
        // Bishop moves
        const resultBishop = this.#isValidDiagonalMove(
          targetMove,
          current_piece
        );
        return resultBishop;

      case PieceType.KNIGHT:
        // Knight moves
        const dx = Math.abs(
          current_piece.RowAndCol[0] - targetMove.RowAndCol[0]
        );
        const dy = Math.abs(
          current_piece.RowAndCol[1] - targetMove.RowAndCol[1]
        );
        const resultKnight = (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
        return resultKnight;

      default:
        return false;
    }
  }
  dragStart(e) {
    const draggedElementId = parseInt(
      e.target.parentNode.getAttribute("square-id")
    );
    this.current_piece = this.map[draggedElementId];
  }
  dragOver(e) {
    e.preventDefault();
  }
  // Event handler for mouseenter
  handleMouseEnter(e) {
    const targetId =
      Number(e.target.getAttribute("square-id")) ||
      Number(e.target.parentNode.getAttribute("square-id"));
    const selectedPiece = this.map[targetId];
    if (selectedPiece.Player != this.current_player) {
      e.preventDefault();
      return;
    }
    const range = [...Array(64)].map((_, i) => i);
    this.possibleMoves = range.map((idx) => {
      const possiblePiece = this.map[idx];
      if (
        possiblePiece.Player != selectedPiece.Player &&
        this.#validMove(possiblePiece, selectedPiece)
      ) {
        return possiblePiece;
      }
    });
    this.possibleMoves?.forEach((piece) => {
      if (piece) {
        piece.displayAsPossiblePiece();
      }
    });
  }

  // Event handler for mouseleave
  handleMouseLeave(e) {
    this.possibleMoves?.forEach((piece) => {
      if (piece) {
        piece.revertToSquareColor();
      }
    });
    this.possibleMoves = [];
  }
  dragDrop(e) {
    e.stopPropagation();
    const targetId =
      Number(e.target.getAttribute("square-id")) ||
      Number(e.target.parentNode.getAttribute("square-id"));
    const targetPiece = this.pieces[targetId];
    const isPiece = !targetPiece.IsSquareEmpty;
    const correctGo = this.current_piece.Player === this.current_player;
    const opponent =
      this.current_player === Player.BLACK ? Player.WHITE : Player.BLACK;
    const isPieceOpponent = targetPiece.Player === opponent;
    const isValidMove = this.#validMove(targetPiece, this.current_piece);
    if (correctGo) {
      if (isPiece && !isPieceOpponent) {
        this.infoDisplay.textContent = "you cannot go here";
        setTimeout(() => (this.infoDisplay.textContent = ""), 2000);
        return;
      }
      if (isValidMove) {
        targetPiece.overrideSquareHtmlElement(this.current_piece.ChessElement);
        this.current_piece.makePieceEmpty();
        this.current_player =
          this.current_player === Player.BLACK ? Player.WHITE : Player.BLACK;
        this.playerDisplay.textContent = this.current_player;
        return;
      }
    } else {
      this.infoDisplay.textContent = "you cannot pick this piece";
      setTimeout(() => (this.infoDisplay.textContent = ""), 2000);
    }
  }
  #isValidDiagonalMove(targetMove, current_piece) {
    const dx = Math.abs(current_piece.RowAndCol[0] - targetMove.RowAndCol[0]);
    const dy = Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]);
    const [row, col] = targetMove.RowAndCol;
    return (
      dx === dy &&
      this.#canReachTarget(targetMove, current_piece, [
        [
          row + (1 * current_piece.IsUpward ? -1 : 1),
          col + (1 * current_piece.IsUpward ? -1 : 1),
        ],
        [
          row + (1 * current_piece.IsUpward ? 1 : -1),
          col + (1 * current_piece.IsUpward ? 1 : -1),
        ],
      ])
    );
  }

  #isValidStraightMove(targetMove, current_piece) {
    const dx = Math.abs(current_piece.RowAndCol[0] - targetMove.RowAndCol[0]);
    const dy = Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]);
    const position = current_piece.RowAndCol;
    const [row, col] = position;
    return (
      (dx === 0 || dy === 0) &&
      this.#canReachTarget(targetMove, current_piece, [
        [row + (1 * current_piece.IsUpward ? -1 : 1), col],
        [row + (1 * current_piece.IsUpward ? 1 : -1), col],
      ])
    );
  }

  #canReachTarget(targetMove, current_piece, neighbors) {
    const queue = [];
    const visited = new Set();

    queue.push(current_piece.RowAndCol);
    visited.add(current_piece.RowAndCol);

    while (queue.length > 0) {
      const position = queue.shift();

      if (position === targetMove.RowAndCol) {
        return true; // Target position reached
      }
      neighbors.forEach((neighbor) => {
        const [neighborRow, neighborCol] = neighbor;

        if (
          neighborRow >= 0 &&
          neighborRow < 8 &&
          neighborCol >= 0 &&
          neighborCol < 8 &&
          !visited.has(neighbor) &&
          this.map[neighbor].IsSquareEmpty
        ) {
          queue.push(neighbor);
          visited.add(neighbor);
        }
      });
    }
    return false;
  }
}

const chessManager = new ChessManager();
