import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { PaperPlaneTilt, CircleNotch, Stop } from 'phosphor-react';
import { clsx } from 'clsx';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, onStop, isLoading, placeholder = "Haz una pregunta a tus documentos..." }: Props) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    if(textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-lg transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
        <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-gray-500 px-4 py-4 pr-14 outline-none resize-none max-h-[150px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent rounded-xl"
        />
        
        <div className="absolute right-2 bottom-2">
            {isLoading ? (
                <button
                    onClick={onStop}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center justify-center"
                    title="Detener generación"
                >
                    <Stop size={20} weight="fill" />
                </button>
            ) : (
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={clsx(
                        "p-2 rounded-lg transition-all flex items-center justify-center",
                        input.trim() 
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg" 
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    )}
                >
                    <PaperPlaneTilt size={20} weight="fill" />
                </button>
            )}
        </div>
    </div>
  );
};