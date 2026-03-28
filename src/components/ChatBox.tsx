import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Flag } from 'lucide-react';
import ReportModal from './ReportModal';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  messages: Array<{ sender: string, message: string, isMe: boolean }>;
  opponentUsername?: string | null;
  opponentCountry?: string | null;
  gameId?: string;
  playerId?: string;
}

const QUICK_MESSAGES = [
  "Hello! 👋",
  "Good game! 🎮",
  "Nice move! 🎯",
  "Well played! 🌟",
  "Good luck! 🍀",
  "Thanks for the game! 🙏"
];

// Strip emoji for cleaner screen reader labels
const stripEmoji = (str: string) =>
  str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();

export default function ChatBox({ onSendMessage, messages, opponentUsername, opponentCountry, gameId, playerId }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when panel opens; restore focus to toggle when it closes
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      toggleButtonRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen ? (
          <button
            ref={toggleButtonRef}
            onClick={() => setIsOpen(true)}
            aria-label="Open chat"
            aria-expanded={false}
            aria-controls="chat-panel"
            className="bg-white bg-opacity-10 backdrop-blur-lg p-3 rounded-full hover:bg-opacity-20 transition"
          >
            <MessageSquare className="w-6 h-6" aria-hidden="true" />
          </button>
        ) : (
          <div
            id="chat-panel"
            role="dialog"
            aria-label={opponentUsername ? `Chat with ${opponentUsername}` : 'Chat'}
            aria-modal="false"
            className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl w-80 shadow-lg"
          >
            <div className="flex items-center justify-between p-4 border-b border-white border-opacity-10">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white" id="chat-heading">Chat</h3>
                {(opponentUsername || opponentCountry) && (
                  <p className="text-xs text-gray-400 truncate">
                    {opponentUsername && <span>{opponentUsername}</span>}
                    {opponentUsername && opponentCountry && <span className="mx-1" aria-hidden="true">·</span>}
                    {opponentCountry && <span>{opponentCountry}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {gameId && playerId && (
                  <button
                    onClick={() => setShowReport(true)}
                    aria-label="Report player"
                    className="text-gray-500 hover:text-red-400 transition"
                  >
                    <Flag className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="text-gray-400 hover:text-white transition"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </div>

            <div
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
              aria-relevant="additions"
              className="h-64 overflow-y-auto p-4 space-y-2"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    aria-label={`${msg.isMe ? 'You' : opponentUsername || 'Opponent'}: ${msg.message}`}
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      msg.isMe
                        ? 'bg-pink-500 text-white'
                        : 'bg-white bg-opacity-5 text-gray-200'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white border-opacity-10">
              <div className="flex gap-2 mb-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Type a chat message"
                  placeholder="Type a message..."
                  className="flex-1 bg-white bg-opacity-5 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  aria-label="Send message"
                  className="p-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Quick messages">
                {QUICK_MESSAGES.map((msg) => (
                  <button
                    key={msg}
                    aria-label={`Send quick message: ${stripEmoji(msg)}`}
                    onClick={() => {
                      onSendMessage(msg);
                      inputRef.current?.focus();
                    }}
                    className="text-sm px-3 py-1.5 bg-white bg-opacity-5 rounded hover:bg-opacity-10 transition text-left truncate"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {gameId && playerId && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          gameId={gameId}
          reporterId={playerId}
        />
      )}
    </>
  );
}
