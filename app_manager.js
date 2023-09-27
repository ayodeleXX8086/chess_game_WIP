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
    this.threatToKing = [];
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
  #validMove(targetMove, current_piece, isCaptureMove = false) {
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
          this.map[
            [
              current_piece.RowAndCol[0] + 1 * pawn_dx,
              current_piece.RowAndCol[1] + 1 * pawn_dy,
            ]
          ].IsSquareEmpty &&
          targetMove.IsSquareEmpty;

        const captureMove =
          current_piece.RowAndCol[0] + pawn_dx === targetMove.RowAndCol[0] &&
          Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]) ===
            1 &&
          !targetMove.IsSquareEmpty;

        return !isCaptureMove
          ? singleStepMove || doubleStepMove || captureMove
          : captureMove;
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
    this.possibleMoves = range
      .filter((idx) => {
        const possiblePiece = this.map[idx];
        return (
          possiblePiece.Player != selectedPiece.Player &&
          this.#validMove(possiblePiece, selectedPiece)
        );
      })
      .map((idx) => {
        return this.map[idx];
      });
    this.possibleMoves?.forEach((piece) => {
      piece.displayAsPossiblePiece();
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
    const isKingVulnerable =
      (this.current_piece.Type === PieceType.KING
        ? this.#getThreatsToKing(targetPiece).length > 0
        : false) ||
      (this.threatToKing?.length > 0 &&
        this.current_piece.Type !== PieceType.KING);
    const isValidMove = this.#validMove(targetPiece, this.current_piece);
    if (correctGo) {
      if (isPiece && !isPieceOpponent) {
        this.infoDisplay.textContent = "you cannot go here";
        setTimeout(() => (this.infoDisplay.textContent = ""), 2000);
        return;
      }
      if (isKingVulnerable) {
        this.infoDisplay.textContent = "Your king is vulnerable";
        return;
      } else if (!isKingVulnerable && isValidMove) {
        targetPiece.overrideSquareHtmlElement(this.current_piece.ChessElement);
        this.current_piece.makePieceEmpty();
        this.current_player =
          this.current_player === Player.BLACK ? Player.WHITE : Player.BLACK;
        this.playerDisplay.textContent = this.current_player;
        this.#displayPossibleThreatToKing();
        return;
      }
    } else {
      this.infoDisplay.textContent = "you cannot pick this piece";
      setTimeout(() => (this.infoDisplay.textContent = ""), 2000);
    }
  }

  #isValidStraightMove(targetMove, current_piece) {
    const dx = Math.abs(current_piece.RowAndCol[0] - targetMove.RowAndCol[0]);
    const dy = Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]);

    if ((dx === 0 && dy !== 0) || (dx !== 0 && dy === 0)) {
      // check if there are any pieces obstructing the straight path
      if (dx === 0) {
        const colDirection =
          targetMove.RowAndCol[1] < current_piece.RowAndCol[1] ? -1 : 1;
        let col = current_piece.RowAndCol[1] + colDirection;

        while (col !== targetMove.RowAndCol[1]) {
          if (!this.map[[current_piece.RowAndCol[0], col]].IsSquareEmpty) {
            return false; // Path is obstructed by a piece
          }
          col += colDirection;
        }
      } else {
        const rowDirection =
          targetMove.RowAndCol[0] < current_piece.RowAndCol[0] ? -1 : 1;
        let row = current_piece.RowAndCol[0] + rowDirection;

        while (row !== targetMove.RowAndCol[0]) {
          if (!this.map[[row, current_piece.RowAndCol[1]]].IsSquareEmpty) {
            return false; // Path is obstructed by a piece
          }
          row += rowDirection;
        }
      }

      return true; // Valid rook move
    }

    return false; // Not a valid rook move
  }

  // This method will only be called when the piece is actually a king
  #getThreatsToKing(kingPiece) {
    const getOtherPlayersPiece = this.#getOtherPlayers(this.current_player);
    const result = getOtherPlayersPiece.filter((e) =>
      this.#validMove(kingPiece, e, true)
    );
    //// console.log("Result for threats to king", result);
    return result;
  }

  #getOtherPlayers(current_player) {
    return this.pieces.filter(
      (e) => e.Player !== current_player && !e.IsSquareEmpty
    );
  }
  #displayPossibleThreatToKing() {
    this.threatToKing?.forEach((e) => e.revertToSquareColorFromThreat());
    const otherPlayerKing = this.pieces.find(
      (e) => e.Type === PieceType.KING && e.Player === this.current_player
    );
    this.threatToKing = this.#getThreatsToKing(otherPlayerKing);
    this.threatToKing?.forEach((e) => e.displayPossibleThreatToKing());
    if (this.threatToKing && this.threatToKing.length > 0) {
      this.infoDisplay.textContent = "Your has been king checked mate";
    } else {
      this.infoDisplay.textContent = "";
    }
  }
  #isValidDiagonalMove(targetMove, current_piece) {
    const dx = Math.abs(current_piece.RowAndCol[0] - targetMove.RowAndCol[0]);
    const dy = Math.abs(current_piece.RowAndCol[1] - targetMove.RowAndCol[1]);

    if (dx === dy) {
      // check if there are any pieces obstructing the diagonal path
      const rowDirection =
        targetMove.RowAndCol[0] < current_piece.RowAndCol[0] ? -1 : 1;
      const colDirection =
        targetMove.RowAndCol[1] < current_piece.RowAndCol[1] ? -1 : 1;

      let row = current_piece.RowAndCol[0] + rowDirection;
      let col = current_piece.RowAndCol[1] + colDirection;

      while (
        row !== targetMove.RowAndCol[0] &&
        col !== targetMove.RowAndCol[1]
      ) {
        if (!this.map[[row, col]]?.IsSquareEmpty) {
          return false; // Path is obstructed by a piece
        }
        row += rowDirection;
        col += colDirection;
      }

      return true; // Valid bishop move
    }

    return false; // Not a valid bishop move
  }
}

const chessManager = new ChessManager();
