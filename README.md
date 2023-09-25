# Chess Game Technical Documentation

## Overview

This technical documentation provides an overview of the code for a chess game implemented in JavaScript using object-oriented programming principles. The code includes classes such as `ChessAppManager`, `ChessMinmaxAI`, and `Board` to create and manage the chess game. Below, we'll describe the key components and functionalities of the code.

## Classes

### ChessAppManager

The `ChessAppManager` class serves as the central manager for the chess game. It is responsible for handling user interactions, displaying the chessboard, managing the game state, and coordinating moves between players and the AI opponent.

Key Methods and Properties:

- `constructor()`: Initializes the game, sets up the chessboard, and initializes game state variables.
- `#displayPlayerAndScore()`: Updates and displays the current player and scores.
- `getCurrentPosition(element)`: Determines the position of a clicked square on the chessboard.
- `#createBoard(gameBoard, board)`: Creates the chessboard by generating HTML elements for each square.
- `dragStart(e)`, `dragOver(e)`, `dragDrop(e)`: Handle drag-and-drop interactions for moving chess pieces.
- `moveChessPieceAndDisplay(piece, currentPosition, AI)`: Moves a chess piece and updates the board display.
- `handleMouseEnter(e)`, `handleMouseLeave(e)`: Handle mouse hover events to highlight valid moves.
- `revertHighlightedColor()`: Reverts square colors after highlighting valid moves.
- Various static methods for updating the display of chessboard squares and pieces.

### ChessMinmaxAI

The `ChessMinmaxAI` class implements the AI opponent using the Minimax algorithm with optional Alpha-Beta Pruning. It calculates the best move for the AI player by exploring possible moves and evaluating board states.

Key Methods and Properties:

- `constructor(depth, board, computer_player, alphBetaPruning)`: Initializes the AI with depth, the game board, computer player color, and optional Alpha-Beta Pruning.
- `start(depth)`: Initiates the Minimax algorithm to find the best move for the AI.
- `minimax(depth, isMaximizer, alpha, beta)`: Recursively evaluates board states using Minimax.
- `evaluate()`: Evaluates the current board state and assigns a score.
- `undoMove(currentPiece, piece, prevPos, p)`: Undoes a move for simulation purposes.
- `getMoves(piece, position)`: Retrieves possible moves and captures for a piece.
- `legalMoves(color, pos)`: Generates a list of legal moves and captures for a given player and position.

### Board

The `Board` class represents the chessboard and manages game state, including piece placement, moves, and checking for game over conditions.

Key Methods and Properties:

- `constructor()`: Initializes the chessboard, sets up game state variables, and creates the initial board.
- `switchTurn()`: Switches the turn between players.
- `recentMove()`, `recentMovePositions()`: Retrieve information about the most recent move.
- `getAllowedMoves(piece)`: Retrieves allowed moves and captures for a given piece.
- `isValidPick(position)`: Checks if a square is a valid pick for the current player.
- `move(piece, position)`: Moves a chess piece on the board.
- `movePiece(piece, position)`: Moves a chess piece to a new position.
- `verifyMove(piece, move)`: Verifies if a move is valid for a piece.
- `undoMove(piece, captured, oldPos, pos)`: Undoes a move for simulation purposes.
- `isWithinBoard(position)`: Checks if a position is within the bounds of the chessboard.
- `getPieceFromBoard(position)`: Retrieves a piece from the board at a given position.
- `isCastling(king, position)`: Checks if a move is a castling move for the king.
- `isEnPassant(piece, newPos)`: Checks if a move is an en passant capture.
- `isInCheck(piece)`: Checks if a player's king is in check.
- `castleKing(king, position)`: Performs castling for the king.
- `promotePawn(pawn, choice)`: Promotes a pawn to another piece upon reaching the opponent's back rank.
- `moveSimulation(piece, next_pos)`: Simulates a move on the board for evaluation purposes.
- `check()`: Checks if a player's king is in check.
- `isCheckmate()`: Checks if the game has ended in checkmate.

## Usage

To use the chess game, an HTML file must include the necessary JavaScript modules and create an instance of the `ChessAppManager` class. Players can interact with the game by dragging and dropping pieces, and the AI opponent makes moves based on the Minimax algorithm.

The game provides a user interface for playing chess and handles game logic, including checking for checkmate and stalemate conditions.
