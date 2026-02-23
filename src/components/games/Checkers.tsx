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

  const isMyTurn = isHost === isRedTurn;

  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type === 'checkers') {
        setBoard(state.data.board);
        setIsRedTurn(state.data.isRedTurn);
        if (state.data.winner) {
          setWinner(state.data.winner);
          setTimeout(() => onGameEnd(state.data.winner), 1500);
        }
      }
    };

    window.addEventListener('game_state', handleGameState as EventListener);
    return () => {
      window.removeEventListener('game_state', handleGameState as EventListener);
    };
  }, [onGameEnd]);

  useEffect(() => {
    const jumps = findAllJumps(board, isRedTurn);
    setMustJump(jumps.length > 0);
  }, [board, isRedTurn]);

  function initializeBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { isKing: false, isRed: true };
        }
      }
    }
    
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = { isKing: false, isRed: false };
        }
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
        
        if (
          newRow >= 0 && newRow < 8 &&
          newCol >= 0 && newCol < 8 &&
          !board[newRow][newCol]
        ) {
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
          const pieceJumps = findJumps(board, row, col);
          jumps.push(...pieceJumps);
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

  const handleDragStart = (row: number, col: number, e: React.DragEvent) => {
    if (!isMyTurn || winner || !board[row][col]) return;
    
    const piece = board[row][col];
    if (piece && piece.isRed === isRedTurn) {
      setDragStart({ row, col });
      const moves = findValidMoves(row, col);
      setValidMoves(moves);
      
      // Set a custom drag image
      const dragImage = document.createElement('div');
      dragImage.className = `w-12 h-12 rounded-full ${piece.isRed ? 'bg-red-600' : 'bg-white'}`;
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 30, 30);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetRow: number, targetCol: number) => {
    if (!dragStart || !isMyTurn || winner) return;

    const isValidMove = validMoves.some(move => 
      move.row === targetRow && move.col === targetCol
    );

    if (isValidMove) {
      const newBoard = board.map(row => [...row]);
      
      newBoard[targetRow][targetCol] = newBoard[dragStart.row][dragStart.col];
      newBoard[dragStart.row][dragStart.col] = null;

      if (Math.abs(targetRow - dragStart.row) === 2) {
        const midRow = dragStart.row + Math.sign(targetRow - dragStart.row);
        const midCol = dragStart.col + Math.sign(targetCol - dragStart.col);
        newBoard[midRow][midCol] = null;
      }

      if (newBoard[targetRow][targetCol] && (targetRow === 0 || targetRow === 7)) {
        newBoard[targetRow][targetCol]!.isKing = true;
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

      sendGameState({
        type: 'checkers',
        data: { 
          board: newBoard, 
          isRedTurn: !isRedTurn,
          winner: gameWinner
        }
      });
    }
  };

  const handleDragEnd = () => {
    setValidMoves([]);
    setDragStart(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`mb-4 text-xl font-bold ${winner ? 'text-green-500' : ''}`}>
        {winner 
          ? `${winner === 'red' ? 'Red' : 'White'} Wins!`
          : isMyTurn 
            ? "Your Turn" 
            : "Opponent's Turn"}
      </div>
      <div className="grid grid-cols-8 gap-0 bg-amber-900 p-2 rounded-lg shadow-xl">
        {board.map((row, rowIndex) => (
          row.map((piece, colIndex) => {
            const isValidMove = validMoves.some(move => 
              move.row === rowIndex && move.col === colIndex
            );

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-16 h-16 flex items-center justify-center
                  ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-800'}
                  ${isValidMove ? 'ring-2 ring-green-400' : ''}
                  transition-all duration-200
                `}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(rowIndex, colIndex)}
              >
                {piece && (
                  <div
                    draggable={isMyTurn && piece.isRed === isRedTurn}
                    onDragStart={(e) => handleDragStart(rowIndex, colIndex, e)}
                    onDragEnd={handleDragEnd}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${piece.isRed ? 'bg-red-600' : 'bg-white shadow-lg'}
                      ${piece.isKing ? 'ring-2 ring-yellow-400' : ''}
                      ${isMyTurn && piece.isRed === isRedTurn ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                      transform transition-transform duration-200
                      hover:scale-105
                    `}
                  >
                    {piece.isKing && (
                      <Crown className={`w-6 h-6 ${piece.isRed ? 'text-yellow-400' : 'text-amber-400'}`} />
                    )}
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-400">
        {isHost ? "You are Red" : "You are White"}
      </div>
    </div>
  );
};

export default Checkers;