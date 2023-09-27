import { Pawn } from "../pieces";
import { Player } from "../utils.js";
import { pieceMap } from "./pointMap";
export class ChessMinmaxAI {
  constructor(depth, board, alphBetaPruning = true) {
    this.depth = depth;
    this.board = board;
    this.alphBetaPruning = alphBetaPruning;
    this.computer_player = this.board.computer_player;
  }

  start(depth) {
    let bestMove = null;
    let bestScore = -9999;
    let currentPiece = null;
    let isMaximizer = this.board.player === this.computer_player;

    if (!isMaximizer) {
      bestScore *= -1;
    }

    for (const pieces of this.board.grid) {
      for (const piece of pieces) {
        if (piece?.color === this.board.player) {
          const [moves, captures] = this.board.getAllowedMoves(piece, true);
          const possibleMoves = captures.concat(moves);

          for (const position of possibleMoves) {
            const prevPos = piece.position;
            const pion = this.board.moveSimulation(piece, position);
            let score = this.minimax(depth + 1, !isMaximizer, -10000, 10000);

            if (
              piece instanceof Pawn &&
              (position.x === 7 || position.x === 0)
            ) {
              score += 80;
            } else if (this.board.isEnPassant(piece, position)) {
              score += 10;
            }

            if (!isMaximizer) {
              score *= -1;
            }

            if (score >= bestScore && isMaximizer) {
              bestScore = score;
              bestMove = position;
              currentPiece = piece;
            }

            // UNDO MOVE
            if (!pion) {
              this.board.moveSimulation(piece, prevPos);
            } else {
              this.board.moveSimulation(piece, prevPos);
              this.board.moveSimulation(pion, position);
            }
          }
        }
      }
    }

    return [currentPiece, bestMove];
  }

  minimax(depth, isMaximizer, alpha, beta) {
    if (this.depth === depth) {
      return this.evaluate();
    }

    if (isMaximizer) {
      let bestScore = -9999;
      const possibleMoves = this.legalMoves(this.computer_player, 7);

      for (let index = possibleMoves.length - 1; index >= 0; index--) {
        const piece = possibleMoves[index][1];
        const i = possibleMoves[index][2];
        const prevPos = piece.position;
        const pion = this.board.moveSimulation(piece, i);
        const score = this.minimax(depth + 1, false, alpha, beta);
        bestScore = Math.max(bestScore, score);

        if (this.alphBetaPruning) {
          alpha = Math.max(alpha, bestScore);
        }

        this.undoMove(pion, piece, prevPos, i);

        if (beta <= alpha && this.alphBetaPruning) {
          return bestScore;
        }
      }

      return bestScore;
    } else {
      let bestScore = 9999;
      const possibleMoves = this.legalMoves(
        this.computer_player === Player.BLACK ? Player.WHITE : Player.BLACK,
        0
      );

      for (let index = possibleMoves.length - 1; index >= 0; index--) {
        const piece = possibleMoves[index][1];
        const i = possibleMoves[index][2];
        const prevPos = piece.position;
        const currentPiece = this.board.moveSimulation(piece, i);
        const score = this.minimax(depth + 1, true, alpha, beta);
        bestScore = Math.min(bestScore, score);

        if (this.alphBetaPruning) {
          beta = Math.min(beta, bestScore);
        }

        this.undoMove(currentPiece, piece, prevPos, i);

        if (beta <= alpha && this.alphBetaPruning) {
          return bestScore;
        }
      }

      return bestScore;
    }
  }

  evaluate() {
    let totalScore = 0;

    for (const pieces of this.board.grid) {
      for (const piece of pieces) {
        if (piece) {
          const p_map = pieceMap(piece, this.computer_player);
          let score = piece.score;
          score += p_map[piece.position.x][piece.position.y];
          // console.log("Score ", score, "piece", piece);
          totalScore += score;
        }
      }
    }

    return totalScore;
  }

  undoMove(currentPiece, piece, prevPos, p) {
    if (!currentPiece) {
      this.board.moveSimulation(piece, prevPos);
    } else {
      this.board.moveSimulation(piece, prevPos);
      this.board.moveSimulation(currentPiece, p);
    }
  }

  getMoves(piece, position) {
    const bestMoves = [];
    const possibleMoves = [];
    const [moves, captures] = this.board.getAllowedMoves(piece, true);

    for (const pos of captures) {
      if (this.board.grid[pos.x][pos.y]) {
        bestMoves.push([
          10 * this.board.grid[pos.x][pos.y].score - piece.score,
          piece,
          pos,
        ]);

        if (piece instanceof Pawn && pos.x === position) {
          bestMoves[bestMoves.length - 1][0] += 90;
        }
      } else {
        bestMoves.push([piece.score, piece, pos]);
      }
    }

    for (const pos of moves) {
      if (piece instanceof Pawn && pos.x === position) {
        bestMoves.push([90, piece, pos]);
      } else {
        bestMoves.push([0, piece, pos]);
      }
    }

    return [possibleMoves, bestMoves];
  }

  legalMoves(color, pos) {
    const possibleMoves = [];
    const bestMoves = [];

    for (const pieces of this.board.grid) {
      for (const piece of pieces) {
        if (piece?.color === color) {
          const [tempMoves, betterTempMoves] = this.getMoves(piece, pos);
          possibleMoves.push(...tempMoves);
          bestMoves.push(...betterTempMoves);
        }
      }
    }

    bestMoves.sort((a, b) => a[0] - b[0]);
    return possibleMoves.concat(bestMoves);
  }
}
