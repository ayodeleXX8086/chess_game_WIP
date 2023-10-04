// Import the Board and AiChessPlayer classes
import { Board } from "../board";
import { Player, GRID, PieceType, Position } from "../utils.js";
import { ChessMinmaxAI } from "../ai";

// Test Board
describe("Board", () => {
  const board = new Board();
  const chessMinmaxAi = new ChessMinmaxAI(3, board, true);

  it("should initialize an empty 8x8 chessboard", () => {
    const piece = board.getPieceFromBoard({ row: 0, col: 0 });

    // Check if the piece is not null (exists) and has a color property equal to 'black'.
    expect(piece).not.toBeNull();
    expect(piece.color).toBe(Player.BLACK);
  });

  it("Make a move and AI move", () => {
    const piece = board.getPieceFromBoard({ row: 6, col: 7 });
    const [moves, captures] = piece.getMoves(board);
    expect(piece.position).toEqual(new Position(6, 7));
    expect(piece.color).toBe(Player.WHITE);
    expect(moves.some((e) => e.equals(new Position(4, 7)))).toBe(true);
    board.move(piece, new Position(4, 7));
    const [currPiece, move] = chessMinmaxAi.start();
    console.log(currPiece, move);
  });

  //   it("should place and retrieve chess pieces correctly", () => {
  //     const board = new Board();
  //     const piece = { type: "pawn", color: "white" };

  //     board.placePiece({ x: 3, y: 3 }, piece);
  //     const retrievedPiece = board.getPiece({ x: 3, y: 3 });

  //     expect(retrievedPiece).toEqual(piece);
  //   });

  //   it("should move chess pieces correctly", () => {
  //     const board = new Board();
  //     const piece = { type: "rook", color: "black" };

  //     board.placePiece({ x: 2, y: 2 }, piece);
  //     board.movePiece({ from: { x: 2, y: 2 }, to: { x: 2, y: 4 } });

  //     expect(board.getPiece({ x: 2, y: 2 })).toBeNull();
  //     expect(board.getPiece({ x: 2, y: 4 })).toEqual(piece);
  //   });
});

// // Test AiChessPlayer
// describe("AiChessPlayer", () => {
//   it("should make valid moves", () => {
//     const board = new Board();
//     const aiPlayer = new ChessMinmaxAI(, board);

//     // Place a black rook on the board
//     const rook = { type: "rook", color: "black" };
//     board.placePiece({ x: 3, y: 3 }, rook);

//     // Ensure that the AI player makes a valid move
//     const move = aiPlayer.makeMove();
//     expect(board.getPiece(move.from)).toEqual(rook);
//     expect(move.to).toEqual({ x: 3, y: 4 }); // Replace with your expected move
//   });

//   it("should handle checkmate and draw situations", () => {
//     const board = new Board();
//     const aiPlayer = new AiChessPlayer("black", board);

//     // Implement test cases for checkmate and draw scenarios
//     // ...

//     // Use board and aiPlayer to set up and test different game states
//     // ...
//   });
// });
