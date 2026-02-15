import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { useVectorStores } from '../hooks/useVectorStores';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import SourceChunksModal from '../components/chat/SourceChunksModal';
import ChatSettingsPanel, { type Settings } from '../components/chat/ChatSettingsPanel';
import ChatFiltersPanel from '../components/chat/ChatFiltersPanel';
import ChatHistoryPanel from '../components/chat/ChatHistoryPanel';
import WelcomePlaceholder from '../components/chat/WelcomePlaceholder';
import { 
    Robot, X, CircleNotch, Database, Code, CheckCircle, 
    SidebarSimple, Notebook, Gear
} from 'phosphor-react';
import { Chunk, ChatRequestParams, ChatHistoryItem } from '../types/chat';
import { clsx } from 'clsx';

interface ChatFilters {
    vectorStoreId: string;
    isCodeQuery: boolean;
    documentIds: string[];
    tags: string[];
    k: number;
}

export default function Chat() {
    const { messages, sendMessage, isLoading, stopGeneration, clearChat, setMessages, setCurrentHistoryId } = useChatStream();
    const { vectorStores } = useVectorStores();
    
    // --- ESTADOS DE UI ---
    const [viewingChunks, setViewingChunks] = useState<Chunk[] | null>(null);
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    
    // Paneles Derechos (independientes)
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    
    // --- CONFIGURACIÓN ---
    const [filters, setFilters] = useState<ChatFilters>({ 
        vectorStoreId: '', 
        isCodeQuery: false,
        documentIds: [], 
        tags: [], 
        k: 5 
    });
    
    const [settings, setSettings] = useState<Settings>({ 
        model: 'gemini-2.0-flash',
        system_instruction: 'Eres un asistente útil y preciso. Responde basándote estrictamente en el contexto proporcionado.', 
        temperature: 1, 
        top_k: 40, 
        max_output_tokens: 2000, 
        thinking_budget: 0
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = (text: string) => {
        if (!filters.vectorStoreId) return;

        const params: ChatRequestParams = {
            question: text,
            vector_store_id: filters.vectorStoreId,
            is_code_query: filters.isCodeQuery,
            k: filters.k,
            tags: filters.tags,
            document_ids: filters.documentIds,
            model: settings.model,
            system_instruction: settings.system_instruction,
            temperature: settings.temperature,
            top_k: settings.top_k,
            max_output_tokens: settings.max_output_tokens,
            thinking_budget: settings.thinking_budget
        };
        sendMessage(params);
    };

    const handleFiltersChange = (newFilters: Partial<ChatFilters>) => setFilters(prev => ({ ...prev, ...newFilters }));
    const handleSettingsChange = (newSettings: Partial<Settings>) => setSettings(prev => ({ ...prev, ...newSettings }));
    
    const handleResumeConversation = (history: ChatHistoryItem) => {
        setCurrentHistoryId(history.id);

        const msgs = [];
        for(let i=0; i < history.questions.length; i++) {
            msgs.push({ id: `q-${i}`, role: 'user' as const, content: history.questions[i] });
            msgs.push({ 
                id: `a-${i}`, 
                role: 'assistant' as const, 
                content: history.answers[i],
                chunks: history.chunks[i] 
            });
        }
        setMessages(msgs);
    };

    return (
        <div className="flex h-full overflow-hidden relative bg-gray-900">
            
            {/* 1. PANEL IZQUIERDO (FILTROS) */}
            <div className={clsx(
                "flex-shrink-0 h-full flex flex-col gap-4 transition-all duration-300 ease-in-out border-r border-gray-800 bg-gray-900/50",
                showLeftPanel ? "w-72 p-4 translate-x-0 opacity-100" : "w-0 p-0 -translate-x-4 opacity-0 overflow-hidden border-none"
            )}>
                {/* Selector Colección */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col gap-4 shadow-lg min-w-[250px]">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                            <Database size={20} className="text-blue-400" weight="fill"/> Colección Activa
                        </label>
                        <select 
                            value={filters.vectorStoreId}
                            onChange={e => setFilters(p => ({...p, vectorStoreId: e.target.value}))}
                            className={clsx(
                                "w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer",
                                !filters.vectorStoreId && "border-red-500/50"
                            )}
                        >
                            <option value="" className="text-gray-500">-- Seleccionar --</option>
                            {vectorStores?.map(vs => (
                                <option key={vs.id} value={vs.id}>{vs.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Toggle Código */}
                    <div 
                        className={clsx(
                            "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors select-none",
                            filters.isCodeQuery 
                                ? "bg-green-900/20 border-green-500/50" 
                                : "bg-gray-900/50 border-gray-700 hover:bg-gray-700"
                        )}
                        onClick={() => setFilters(p => ({...p, isCodeQuery: !p.isCodeQuery}))}
                    >
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer pointer-events-none">
                            <Code size={18} weight="bold" className={filters.isCodeQuery ? "text-green-400" : "text-gray-500"} />
                            Modo Código
                        </label>
                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", filters.isCodeQuery ? "bg-green-500 border-green-500" : "border-gray-500")}>
                            {filters.isCodeQuery && <CheckCircle size={12} weight="fill" className="text-black" />}
                        </div>
                    </div>
                </div>

                {/* Filtros Avanzados */}
                <div className="flex-1 min-h-0 min-w-[250px]">
                    <ChatFiltersPanel filters={filters} onFiltersChange={handleFiltersChange} />
                </div>
            </div>

            {/* 2. ÁREA CENTRAL (CHAT) */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-900 relative z-0">
                
                {/* Header Chat */}
                <div className="h-16 px-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        
                        <button 
                            onClick={() => setShowLeftPanel(!showLeftPanel)}
                            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            title={showLeftPanel ? "Ocultar filtros" : "Mostrar filtros"}
                        >
                            <SidebarSimple size={20} weight={showLeftPanel ? "fill" : "regular"} />
                        </button>
                        
                        <div className="h-6 w-px bg-gray-700 mx-1"></div>

                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600/20 p-1.5 rounded-lg text-indigo-400">
                                <Robot size={24} weight="fill" />
                                </div>
                                <div>
                                <h2 className="text-md font-bold text-white">Chat DocSapiens</h2>
                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                    {filters.isCodeQuery 
                                        ? <span className="text-green-400 flex items-center gap-1"><Code size={12}/> Code Search</span> 
                                        : <span className="text-indigo-300">Búsqueda Semántica</span>
                                    }
                                </p>
                                {filters.vectorStoreId && (
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Conectado a: <span className="text-blue-400">{vectorStores?.find(v => v.id === filters.vectorStoreId)?.name}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={clearChat}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                        title="Borrar mensajes actuales"
                    >
                        <X size={16} weight="bold" />
                        <span className="hidden sm:inline">Limpiar</span>
                    </button>
                </div>

                {!filters.vectorStoreId && messages.length === 0 && (
                    <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6">
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-md text-center">
                            <Database size={48} className="text-blue-500 mx-auto mb-4 opacity-80" weight="duotone" />
                            <h3 className="text-xl font-bold text-white mb-2">Selecciona una Colección</h3>
                            <p className="text-gray-400 mb-6 text-sm">Para empezar a chatear, elige una base de conocimiento en el panel izquierdo.</p>
                        </div>
                    </div>
                )}

                {/* Lista de Mensajes */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <WelcomePlaceholder />
                    ) : (
                        messages.map(msg => (
                            <ChatBubble key={msg.id} message={msg} onViewSources={setViewingChunks} />
                        ))
                    )}
                    
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                         <div className="flex justify-start pl-2">
                            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-3 text-gray-400 shadow-md">
                                <CircleNotch size={18} className="animate-spin text-indigo-500" />
                                <span className="text-xs font-mono typing-cursor">Generando respuesta...</span>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 pt-2 bg-gray-900 relative z-30">
                    <div className="max-w-4xl mx-auto">
                        <ChatInput 
                            onSend={handleSend} 
                            onStop={stopGeneration}
                            isLoading={isLoading} 
                        />
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-gray-600">
                                La IA puede cometer errores. Verifica la información importante.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. PANELES DERECHOS (DINÁMICOS) */}
            {(showSettingsPanel || showHistoryPanel) && (
                <div className="w-80 flex-shrink-0 flex flex-col h-full bg-gray-800 border-l border-gray-700 transition-all duration-300 shadow-xl z-20">
                    
                    {/* PANEL DE SETTINGS */}
                    {showSettingsPanel && (
                        <div className={clsx(
                            "flex flex-col overflow-hidden transition-all duration-300",
                            showHistoryPanel ? "h-1/2 border-b border-gray-700" : "h-full"
                        )}>
                            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center shrink-0">
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Gear size={16} className="text-blue-400"/> Configuración
                                </h3>
                                <button onClick={() => setShowSettingsPanel(false)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                                <ChatSettingsPanel 
                                    settings={settings} 
                                    onSettingsChange={handleSettingsChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* PANEL DE HISTORIAL */}
                    {showHistoryPanel && (
                        <div className={clsx(
                            "flex flex-col overflow-hidden transition-all duration-300 bg-gray-900/30",
                            showSettingsPanel ? "h-1/2" : "h-full"
                        )}>
                            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center shrink-0">
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Notebook size={16} className="text-purple-400"/> Historial
                                </h3>
                                <button onClick={() => setShowHistoryPanel(false)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                                <ChatHistoryPanel onResumeConversation={handleResumeConversation} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. BARRA DE HERRAMIENTAS LATERAL DERECHA (ICONOS) */}
            <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-4 bg-gray-900 border-l border-gray-800 z-30">
                <TooltipSide text="Configuración del Modelo">
                    <button 
                        onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                        className={clsx(
                            "p-3 rounded-xl transition-all duration-200 group relative",
                            showSettingsPanel 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                                : "text-gray-400 hover:bg-gray-800 hover:text-blue-400"
                        )}
                    >
                        <Gear size={22} weight={showSettingsPanel ? "fill" : "regular"} />
                        {showSettingsPanel && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full"></div>}
                    </button>
                </TooltipSide>

                <TooltipSide text="Historial de Chats">
                    <button 
                        onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                        className={clsx(
                            "p-3 rounded-xl transition-all duration-200 group relative",
                            showHistoryPanel 
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50" 
                                : "text-gray-400 hover:bg-gray-800 hover:text-purple-400"
                        )}
                    >
                        <Notebook size={22} weight={showHistoryPanel ? "fill" : "regular"} />
                        {showHistoryPanel && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full"></div>}
                    </button>
                </TooltipSide>
            </div>

            {/* MODAL DE FRAGMENTOS */}
            <SourceChunksModal 
                chunks={viewingChunks || []} 
                isOpen={!!viewingChunks} 
                onClose={() => setViewingChunks(null)} 
            />
        </div>
    );
}

const TooltipSide = ({ text, children }: { text: string, children: React.ReactNode }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute right-full mr-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 shadow-xl z-50">
            {text}
            {/* Flecha derecha */}
            <div className="absolute top-1/2 -translate-y-1/2 left-full w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-gray-700"></div>
        </div>
    </div>
);