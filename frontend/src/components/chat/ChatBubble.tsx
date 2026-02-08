import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Robot, User, Copy, Check, Books, WarningCircle, SpeakerHigh } from 'phosphor-react';
import { clsx } from 'clsx';
import { Message, Chunk } from '../../types/chat';
import { useAppToast } from '../../hooks/useAppToast';
import apiClient from '../../api/client';

interface Props {
  message: Message;
  onViewSources?: (chunks: Chunk[]) => void;
}

export const ChatBubble = ({ message, onViewSources }: Props) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const toast = useAppToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = async () => {
    if (isPlaying) return; // Simple bloqueo, idealmente usaríamos un contexto de audio
    setIsPlaying(true);
    const toastId = toast.loading("Generando audio...");
    try {
        const { data } = await apiClient.post('/api/v1/embeddings/speech', { text: message.content });
        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        toast.success(`Reproduciendo... ${ toastId }`);
    } catch (error) {
        setIsPlaying(false);
        toast.error(`Error al generar audio ${ toastId }`);
    }
  };

  if (isSystem) {
      return (
          <div className="flex justify-center my-4">
              <span className="text-xs bg-red-900/30 text-red-300 px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-2">
                  <WarningCircle /> {message.content}
              </span>
          </div>
      )
  }

  return (
    <div className={clsx("flex w-full gap-4 animate-fade-in group", isUser ? "justify-end" : "justify-start")}>
      
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Robot size={20} weight="fill" className="text-white" />
          </div>
        </div>
      )}

      <div className={clsx(
        "relative max-w-3xl rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed overflow-hidden shadow-md",
        isUser 
          ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-none" 
          : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none"
      )}>
        
        {/* MARKDOWN CONTENT */}
        <div className={clsx("prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700")}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" {...props} />,
                    code({node, inline, className, children, ...props}: any) {
                        return !inline ? (
                            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden my-2">
                                <div className="bg-gray-800 px-3 py-1 text-xs text-gray-400 border-b border-gray-700">Code</div>
                                <code className="block p-3 overflow-x-auto font-mono text-sm text-gray-300" {...props}>{children}</code>
                            </div>
                        ) : (
                            <code className="bg-gray-700/50 px-1.5 py-0.5 rounded text-red-300 font-mono text-xs" {...props}>{children}</code>
                        )
                    }
                }}
            >
                {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse align-middle"></span>
            )}
        </div>

        {/* FOOTER ACTIONS (Only Assistant) */}
        {!isUser && !message.isStreaming && (
            <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between gap-3">
                <div className="flex gap-2">
                    {message.chunks && message.chunks.length > 0 && (
                        <button 
                            onClick={() => onViewSources && onViewSources(message.chunks!)}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-400/10 px-2 py-1 rounded hover:bg-blue-400/20"
                        >
                            <Books size={14} />
                            {message.chunks.length} Fuentes
                        </button>
                    )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={handleTTS} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="Leer en voz alta">
                        <SpeakerHigh size={16} className={isPlaying ? "animate-pulse text-green-400" : ""} />
                    </button>
                    <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="Copiar">
                        {copied ? <Check size={16} className="text-green-400"/> : <Copy size={16} />}
                    </button>
                </div>
            </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-9 h-9 rounded-xl bg-gray-700 border border-gray-600 flex items-center justify-center shadow-lg">
            <User size={20} weight="fill" className="text-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
};