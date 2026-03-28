import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

interface CheckersProps {
  onGameEnd: (winner: string | null) => void;
  isHost: boolean;
  sendGameState: (state: any) => void;
  gameId: string;
  isOffline?: boolean;
}

type Piece = null | { isKing: boolean; isRed: boolean };
type Board = Piece[][];
type Position = { row: number; col: number };

const Checkers = ({ onGameEnd, isHost, sendGameState }: CheckersProps) => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [isRedTurn, setIsRedTurn] = useState(true);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [mustJump, setMustJump] = useState(false);
  const [winner, setWinner] = useState<'red' | 'black' | null>(null);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);

  const isMyTurn = isHost === isRedTurn;

  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type === 'checkers') {
        setBoard(state.data.board);
        setIsRedTurn(state.data.isRedTurn);
        setSelectedPiece(null);
        setValidMoves([]);
        if (state.data.winner) {
          setWinner(state.data.winner);
          setTimeout(() => onGameEnd(state.data.winner), 1500);
        }
      }
    };

    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, [onGameEnd]);

  useEffect(() => {
    const jumps = findAllJumps(board, isRedTurn);
    setMustJump(jumps.length > 0);
  }, [board, isRedTurn]);

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) board[row][col] = { isKing: false, isRed: true };
      }
    }
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) board[row][col] = { isKing: false, isRed: false };
      }
    }
    return board;
  }

  function findValidMoves(row: number, col: number): Position[] {
    const piece = board[row][col];
    if (!piece) return [];
    const jumps = findJumps(board, row, col);
    if (mustJump) return jumps;
    const moves: Position[] = [...jumps];
    const directions = piece.isKing ? [-1, 1] : [piece.isRed ? 1 : -1];
    directions.forEach(dRow => {
      [-1, 1].forEach(dCol => {
        const newRow = row + dRow;
        const newCol = col + dCol;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
          moves.push({ row: newRow, col: newCol });
        }
      });
    });
    return moves;
  }

  function findJumps(board: Board, row: number, col: number): Position[] {
    const piece = board[row][col];
    if (!piece) return [];
    const jumps: Position[] = [];
    const directions = piece.isKing ? [-1, 1] : [piece.isRed ? 1 : -1];
    directions.forEach(dRow => {
      [-1, 1].forEach(dCol => {
        const jumpRow = row + dRow * 2;
        const jumpCol = col + dCol * 2;
        const midRow = row + dRow;
        const midCol = col + dCol;
        if (
          jumpRow >= 0 && jumpRow < 8 &&
          jumpCol >= 0 && jumpCol < 8 &&
          !board[jumpRow][jumpCol] &&
          board[midRow][midCol] &&
          board[midRow][midCol]!.isRed !== piece.isRed
        ) {
          jumps.push({ row: jumpRow, col: jumpCol });
        }
      });
    });
    return jumps;
  }

  function findAllJumps(board: Board, isRedTurn: boolean): Position[] {
    const jumps: Position[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.isRed === isRedTurn) {
          jumps.push(...findJumps(board, row, col));
        }
      }
    }
    return jumps;
  }

  function checkWinner(board: Board): 'red' | 'black' | null {
    let hasRed = false;
    let hasBlack = false;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (piece.isRed) hasRed = true;
          else hasBlack = true;
          if (hasRed && hasBlack) return null;
        }
      }
    }
    return hasRed ? 'red' : 'black';
  }

  function executeMove(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    const newBoard = board.map(r => [...r]);
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;
    if (Math.abs(toRow - fromRow) === 2) {
      const midRow = fromRow + Math.sign(toRow - fromRow);
      const midCol = fromCol + Math.sign(toCol - fromCol);
      newBoard[midRow][midCol] = null;
    }
    if (newBoard[toRow][toCol] && (toRow === 0 || toRow === 7)) {
      newBoard[toRow][toCol]!.isKing = true;
    }
    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setTimeout(() => onGameEnd(gameWinner), 1500);
    }
    setBoard(newBoard);
    setIsRedTurn(!isRedTurn);
    setValidMoves([]);
    setDragStart(null);
    setSelectedPiece(null);
    sendGameState({
      type: 'checkers',
      data: { board: newBoard, isRedTurn: !isRedTurn, winner: gameWinner }
    });
  }

  // Click-to-move handler
  const handleSquareClick = (row: number, col: number) => {
    if (!isMyTurn || winner) return;

    const isValidTarget = validMoves.some(m => m.row === row && m.col === col);

    if (isValidTarget && selectedPiece) {
      executeMove(selectedPiece.row, selectedPiece.col, row, col);
      return;
    }

    const piece = board[row][col];
    if (piece && piece.isRed === isRedTurn) {
      setSelectedPiece({ row, col });
      setValidMoves(findValidMoves(row, col));
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  // Drag handlers
  const handleDragStart = (row: number, col: number, e: React.DragEvent) => {
    if (!isMyTurn || winner || !board[row][col]) return;
    const piece = board[row][col];
    if (piece && piece.isRed === isRedTurn) {
      setDragStart({ row, col });
      setSelectedPiece({ row, col });
      setValidMoves(findValidMoves(row, col));
      const dragImage = document.createElement('div');
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (targetRow: number, targetCol: number) => {
    if (!dragStart || !isMyTurn || winner) return;
    const isValidMove = validMoves.some(m => m.row === targetRow && m.col === targetCol);
    if (isValidMove) executeMove(dragStart.row, dragStart.col, targetRow, targetCol);
    else { setDragStart(null); setSelectedPiece(null); setValidMoves([]); }
  };

  const handleDragEnd = () => {
    setDragStart(null);
  };

  // Count pieces
  const redCount = board.flat().filter(p => p?.isRed).length;
  const blackCount = board.flat().filter(p => p && !p.isRed).length;

  const myColor = isHost ? 'red' : 'black';
  const myLabel = isHost ? 'Red' : 'Black';

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Status bar */}
      <div className="w-full max-w-lg flex items-center justify-between px-2">
        {/* Red side */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
          isRedTurn && !winner ? 'bg-red-500/20 ring-1 ring-red-500/50' : 'opacity-50'
        }`}>
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-sm" />
          <span className="text-sm font-medium text-white">Red</span>
          <span className="text-xs text-gray-400">×{redCount}</span>
        </div>

        {/* Turn / Winner */}
        <div className="text-center">
          {winner ? (
            <span className="text-green-400 font-bold text-lg">
              {winner === 'red' ? 'Red' : 'Black'} wins!
            </span>
          ) : (
            <span className={`text-sm font-semibold ${isMyTurn ? 'text-white' : 'text-gray-400'}`}>
              {isMyTurn ? 'Your turn' : "Opponent's turn"}
            </span>
          )}
          {mustJump && isMyTurn && !winner && (
            <p className="text-xs text-yellow-400 mt-0.5">Must jump!</p>
          )}
        </div>

        {/* Black side */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
          !isRedTurn && !winner ? 'bg-slate-500/20 ring-1 ring-slate-400/50' : 'opacity-50'
        }`}>
          <span className="text-xs text-gray-400">×{blackCount}</span>
          <span className="text-sm font-medium text-white">Black</span>
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-800 shadow-sm" />
        </div>
      </div>

      {/* Board */}
      <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
           style={{ background: '#1a0a00' }}>
        {/* Border frame */}
        <div className="p-2" style={{ background: 'linear-gradient(135deg, #3d1f00 0%, #2a1500 50%, #3d1f00 100%)' }}>
          <div className="grid grid-cols-8">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
                const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                const isMovable = isMyTurn && !winner && piece && piece.isRed === isRedTurn;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(rowIndex, colIndex)}
                    className="relative flex items-center justify-center transition-colors duration-150"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: isDark
                        ? (isSelected ? '#5c3a1e' : isValidMove ? '#2d4a1e' : '#3d2000')
                        : '#c8a96e',
                      cursor: isMovable ? 'pointer' : isValidMove ? 'pointer' : 'default',
                    }}
                  >
                    {/* Valid move indicator */}
                    {isValidMove && !piece && (
                      <div className="w-4 h-4 rounded-full bg-green-400/70 shadow-lg animate-pulse" />
                    )}
                    {/* Capture indicator (valid move on occupied enemy square — actually it's always empty for valid) */}

                    {/* Piece */}
                    {piece && (
                      <div
                        draggable={!!isMovable}
                        onDragStart={(e) => handleDragStart(rowIndex, colIndex, e)}
                        onDragEnd={handleDragEnd}
                        className="relative flex items-center justify-center transition-transform duration-150"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          cursor: isMovable ? 'grab' : 'default',
                          background: piece.isRed
                            ? 'radial-gradient(circle at 35% 35%, #f87171, #b91c1c)'
                            : 'radial-gradient(circle at 35% 35%, #94a3b8, #1e293b)',
                          boxShadow: isSelected
                            ? piece.isRed
                              ? '0 0 0 3px #fbbf24, 0 4px 12px rgba(0,0,0,0.6)'
                              : '0 0 0 3px #fbbf24, 0 4px 12px rgba(0,0,0,0.6)'
                            : '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                      >
                        {/* Inner highlight */}
                        <div
                          className="absolute"
                          style={{
                            top: '6px',
                            left: '10px',
                            width: '14px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.25)',
                            transform: 'rotate(-30deg)',
                          }}
                        />
                        {piece.isKing && (
                          <Crown
                            className="w-5 h-5 relative z-10"
                            style={{ color: '#fbbf24', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* You are label */}
      <p className="text-xs text-gray-500">
        You are{' '}
        <span className={`font-semibold ${myColor === 'red' ? 'text-red-400' : 'text-slate-300'}`}>
          {myLabel}
        </span>
        {' '}· Click or drag to move
      </p>
    </div>
  );
};

export default Checkers;
