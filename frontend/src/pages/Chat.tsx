import React, { useState, useRef, useEffect } from 'react';
import type { Chunk, ChatRequestParams, Message, ChatHistoryItem } from '../types/chat';
import { useChat } from '../hooks/useChat';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import ChatFiltersPanel from  '../components/chat/ChatFiltersPanel';
import ChatSettingsPanel, { type Settings } from '../components/chat/ChatSettingsPanel';
import SourceChunksModal from '../components/chat/SourceChunksModal';
import WelcomePlaceholder from '../components/chat/WelcomePlaceholder';
import { PaperPlaneRight, SpeakerSimpleHigh, Copy, CircleNotch, Books } from 'phosphor-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatFilters {
    documentIds: string[];
    tags: string[];
    k: number;
}

const MessageBubble: React.FC<{ message: Message, onViewSources: (chunks: Chunk[]) => void }> = ({ message, onViewSources }) => {
    const { generateSpeech, isGenerating, audioSrc } = useTextToSpeech();
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'assistant';

    if (isSystem) return <div className="text-center text-sm text-red-500 py-2">System {message.content}</div>;

    const animationClass = isAssistant ? 'animate-fade-in-up' : '';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${animationClass}`}>
            <div className={`rounded-xl px-4 py-3 max-w-2xl ${isUser ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                
                {/* --- 2. LÓGICA DE RENDERIZADO CONDICIONAL --- */}
                {isAssistant ? (
                    // Para la IA, usamos ReactMarkdown con el plugin de tipografía
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    // Para el usuario, mantenemos el texto plano
                    <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                
                {/* La lógica de los controles no necesita cambios */}
                {isAssistant && (
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-200/80">
                        {/* Botón de Copiar */}
                        <button onClick={() => navigator.clipboard.writeText(message.content)} className="text-gray-500 hover:text-blue-600">
                            <Copy size={16} />
                        </button>

                        {/* --- LÓGICA DEL REPRODUCTOR DE AUDIO --- */}
                        {isGenerating ? (
                            // 2. Si está generando, mostramos el spinner
                            <div className="flex items-center gap-2 text-gray-400">
                                <CircleNotch size={16} className="animate-spin" />
                                <span className="text-xs">Generating...</span>
                            </div>
                        ) : audioSrc ? (
                            // 3. Si ya tenemos la URL, mostramos el reproductor nativo
                            <audio controls src={audioSrc} className="h-8 w-60">
                                Your browser does not support the audio element.
                            </audio>
                        ) : (
                            // 4. Si no, mostramos el botón para generar
                            <button onClick={() => generateSpeech(message.content)} disabled={isGenerating} className="text-gray-500 hover:text-blue-600">
                                <SpeakerSimpleHigh size={16} />
                            </button>
                        )}
                        
                        {/* Botón de Fuentes */}
                        {message.chunks && message.chunks.length > 0 && (
                            <button onClick={() => onViewSources(message.chunks!)} className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-xs ml-auto">
                                <Books size={16} /> 
                                <span>{message.chunks.length} Sources</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    // Hooks y estado
    const [input, setInput] = useState("");
    const { messages, sendMessage, isLoading, resumeConversation } = useChat(); 
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
    const [viewingChunks, setViewingChunks] = useState<Chunk[] | null>(null);
    const [filters, setFilters] = useState<ChatFilters>({ documentIds: [], tags: [], k: 15 });
    const [settings, setSettings] = useState<Settings>({ model: 'gemini-2.0-flash', system_instruction: 'You are a helpful and professional assistant.', temperature: 0.7, top_k: 40, max_output_tokens: 2000, thinking_budget: 1000 });

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleFiltersChange = (newFilters: Partial<ChatFilters>) => setFilters(prev => ({ ...prev, ...newFilters }));
    const handleSettingsChange = (newSettings: Partial<Settings>) => setSettings(prev => ({ ...prev, ...newSettings }));
    
    const handleSend = () => {
        if (!input.trim()) return;
        const params: ChatRequestParams = { question: input, ...filters, ...settings };
        sendMessage(params);
        setInput("");
    };

    return (
        <>
            <SourceChunksModal chunks={viewingChunks || []} isOpen={!!viewingChunks} onClose={() => setViewingChunks(null)} />
            
            {/* Este 'div' crecerá para llenar el 'main' y no más. 'min-h-0' es el seguro para que el scroll interno funcione. */}
            <div className="flex flex-1 w-full gap-4 min-h-0">

                <div className="hidden lg:block w-80 flex-shrink-0">
                    <ChatFiltersPanel filters={filters} onFiltersChange={handleFiltersChange} />
                </div>

                <div className="flex flex-col flex-1 bg-white rounded-xl border border-gray-200 min-w-0">
                    {/* Este 'div' es ahora el único con 'overflow-y-auto' y tendrá el scroll */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-scroll p-6 space-y-6">
                        {messages.length === 0 && <WelcomePlaceholder />}
                        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} onViewSources={setViewingChunks} />)}
                        {isLoading && (<div className="flex justify-start"><div className="rounded-xl px-4 py-3 bg-white border text-gray-800"><CircleNotch size={24} className="animate-spin text-blue-500" /></div></div>)}
                    </div>
                    <div className="p-4 bg-white border-t rounded-b-xl">
                        <div className="flex items-end gap-2">
                            <textarea
                                className="w-full flex-1 resize-none rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={1} value={input} onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about the selected context..."
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                            />
                            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 flex-shrink-0">
                                <PaperPlaneRight size={20} weight="fill" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block flex-shrink-0">
                    <ChatSettingsPanel 
                        settings={settings} 
                        onSettingsChange={handleSettingsChange} 
                        isCollapsed={isSettingsCollapsed} 
                        setIsCollapsed={setIsSettingsCollapsed} 
                        onResumeConversation={resumeConversation}
                    />
                </div>
            </div>
        </>
    );
};

export default Chat;


//const MessageBubble: React.FC<{ message: Message, onViewSources: (chunks: Chunk[]) => void }> = ({ message, onViewSources }) => {
//    const { generateSpeech, isGenerating } = useTextToSpeech();
//    const isUser = message.role === 'user';
//    const isSystem = message.role === 'system';
//
//    const isAssistant = message.role === 'assistant';
//
//    // --- LÓGICA DE ANIMACIÓN ---
//    // Usamos el hook solo para los mensajes del asistente
//    const animatedContent = isAssistant ? useTypewriter(message.content) : message.content;
//    // Comprobamos si la animación ha terminado para mostrar los controles
//    const isTypingFinished = animatedContent.length === message.content.length;
//
//    if (isSystem) return <div className="text-center text-sm text-red-500 py-2">System {message.content}</div>;
//
//    return (
//        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
//            <div className={`rounded-xl px-4 py-3 max-w-2xl ${isUser ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
//                {/* Usamos el contenido animado */}
//                <p className="whitespace-pre-wrap">{animatedContent}</p>
//                
//                {/* Mostramos los controles solo cuando la animación ha terminado */}
//                {isAssistant && isTypingFinished && (
//                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-200/80">
//                        <button onClick={() => navigator.clipboard.writeText(message.content)} className="text-gray-500 hover:text-blue-600"><Copy size={16} /></button>
//                        <button onClick={() => generateSpeech(message.content)} disabled={isGenerating} className="text-gray-500 hover:text-blue-600 disabled:text-gray-300">
//                            {isGenerating ? <CircleNotch size={16} className="animate-spin" /> : <SpeakerSimpleHigh size={16} />}
//                        </button>
//                        {message.chunks && message.chunks.length > 0 && (
//                            <button onClick={() => onViewSources(message.chunks!)} className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-xs">
//                                <Books size={16} /> 
//                                <span>{message.chunks.length} Sources</span>
//                            </button>
//                        )}
//                    </div>
//                )}
//            </div>
//        </div>
//    );
//};
