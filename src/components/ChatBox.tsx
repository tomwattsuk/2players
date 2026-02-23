import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  messages: Array<{ sender: string, message: string, isMe: boolean }>;
}

const QUICK_MESSAGES = [
  "Hello! 👋",
  "Good game! 🎮",
  "Nice move! 🎯",
  "Well played! 🌟",
  "Good luck! 🍀",
  "Thanks for the game! 🙏"
];

export default function ChatBox({ onSendMessage, messages }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white bg-opacity-10 backdrop-blur-lg p-3 rounded-full hover:bg-opacity-20 transition"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl w-80 shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-white border-opacity-10">
            <h3 className="font-semibold">Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition"
            >
              ×
            </button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
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
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-white bg-opacity-5 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="p-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
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
  );
}