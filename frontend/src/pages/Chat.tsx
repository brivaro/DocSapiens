import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { useVectorStores } from '../hooks/useVectorStores';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import SourceChunksModal from '../components/chat/SourceChunksModal';
import ChatSettingsPanel, { type Settings } from '../components/chat/ChatSettingsPanel';
import ChatFiltersPanel from '../components/chat/ChatFiltersPanel';
import WelcomePlaceholder from '../components/chat/WelcomePlaceholder';
import { Robot, Sliders, X, CircleNotch, Database, Code, CheckCircle } from 'phosphor-react';
import { Chunk, ChatRequestParams } from '../types/chat';
import { clsx } from 'clsx';

interface ChatFilters {
    vectorStoreId: string;
    isCodeQuery: boolean;
    documentIds: string[];
    tags: string[];
    k: number;
}

export default function Chat() {
    const { messages, sendMessage, isLoading, stopGeneration, clearChat } = useChatStream();
    const { vectorStores } = useVectorStores();
    
    // Estado local
    const [viewingChunks, setViewingChunks] = useState<Chunk[] | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
    
    // Configuración local del chat
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
        temperature: 0.7, 
        top_k: 40, 
        max_output_tokens: 2000, 
        thinking_budget: 0 
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    // Funciones auxiliares
    const handleFiltersChange = (newFilters: Partial<ChatFilters>) => setFilters(prev => ({ ...prev, ...newFilters }));
    const handleSettingsChange = (newSettings: Partial<Settings>) => setSettings(prev => ({ ...prev, ...newSettings }));
    const handleResumeConversation = () => { /* Implementar resume */ };

    return (
        <div className="flex h-full gap-6 overflow-hidden relative">
            
            {/* Panel Izquierdo: Filtros & Selección de Colección */}
            <div className="hidden lg:flex w-72 flex-shrink-0 h-full flex-col gap-4">
                
                {/* SELECTOR DE COLECCIÓN (CRÍTICO) */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col gap-4 shadow-lg">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                            <Database size={20} className="text-blue-400" weight="fill"/> Colección Activa
                        </label>
                        <select 
                            value={filters.vectorStoreId}
                            onChange={e => setFilters(p => ({...p, vectorStoreId: e.target.value}))}
                            className={clsx(
                                "w-full rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all border",
                                !filters.vectorStoreId 
                                    ? "bg-blue-900/20 border-blue-500 text-blue-100 animate-pulse focus:animate-none"
                                    : "bg-gray-900 border-gray-600 text-white"
                            )}
                        >
                            <option value="">-- Seleccionar --</option>
                            {vectorStores?.map(vs => (
                                <option key={vs.id} value={vs.id}>{vs.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* TOGGLE MODO CÓDIGO */}
                    <div 
                        className={clsx(
                            "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors select-none",
                            filters.isCodeQuery 
                                ? "bg-green-900/20 border-green-500/50" 
                                : "bg-gray-900/50 border-gray-700 hover:bg-gray-700"
                        )}
                        onClick={() => setFilters(p => ({...p, isCodeQuery: !p.isCodeQuery}))}
                    >
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <Code size={18} weight="bold" className={filters.isCodeQuery ? "text-green-400" : "text-gray-500"} />
                            Modo Código
                        </label>
                        <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", filters.isCodeQuery ? "bg-green-500 border-green-500" : "border-gray-500")}>
                            {filters.isCodeQuery && <CheckCircle size={12} weight="fill" className="text-black" />}
                        </div>
                    </div>
                </div>

                {/* Filtros de Documentos */}
                <div className="flex-1 min-h-0">
                    <ChatFiltersPanel filters={filters} onFiltersChange={handleFiltersChange} />
                </div>
            </div>

            {/* Área Principal de Chat */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden relative">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-md flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400">
                            <Robot size={24} weight="fill" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Chat DocSapiens</h2>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                {filters.isCodeQuery 
                                    ? <span className="text-green-400 flex items-center gap-1"><Code size={12}/> Code Search</span> 
                                    : <span className="text-indigo-300">Búsqueda Semántica</span>
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={clsx("lg:hidden p-2 rounded-lg transition-colors border", showFilters ? "bg-indigo-600 border-indigo-500 text-white" : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600")}
                        >
                            <Sliders size={20} />
                        </button>
                        
                        <button 
                            onClick={clearChat}
                            className="p-2 bg-gray-700 border border-gray-600 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400 text-gray-300 rounded-lg transition-colors"
                            title="Limpiar conversación"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Filtros Móvil */}
                <div className={clsx(
                    "lg:hidden bg-gray-800 border-b border-gray-700 overflow-hidden transition-all duration-300 ease-in-out",
                    showFilters ? "max-h-96 p-4 opacity-100" : "max-h-0 opacity-0"
                )}>
                     <select 
                        value={filters.vectorStoreId}
                        onChange={e => setFilters(p => ({...p, vectorStoreId: e.target.value}))}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white mb-3"
                    >
                        <option value="">-- Colección --</option>
                        {vectorStores?.map(vs => <option key={vs.id} value={vs.id}>{vs.name}</option>)}
                    </select>
                </div>

                {/* Overlay Bloqueante si no hay Colección */}
                {!filters.vectorStoreId && messages.length === 0 && (
                    <div className="absolute inset-0 z-30 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl max-w-md w-full transform hover:scale-105 transition-transform duration-300">
                            <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                                <Database size={40} className="text-blue-400" weight="duotone" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Selecciona una Colección</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Para comenzar a chatear, debes elegir qué base de conocimiento quieres utilizar.
                            </p>
                            
                            {/* Selector duplicado para comodidad en el overlay */}
                            <div className="relative">
                                <select 
                                    value={filters.vectorStoreId}
                                    onChange={e => setFilters(p => ({...p, vectorStoreId: e.target.value}))}
                                    className="w-full appearance-none bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl cursor-pointer transition-colors text-center outline-none"
                                >
                                    <option value="" className="bg-gray-800 text-gray-400">Elegir Colección...</option>
                                    {vectorStores?.map(vs => (
                                        <option key={vs.id} value={vs.id} className="bg-gray-800">{vs.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <WelcomePlaceholder />
                    ) : (
                        messages.map(msg => (
                            <ChatBubble key={msg.id} message={msg} onViewSources={setViewingChunks} />
                        ))
                    )}
                    
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                         <div className="flex justify-start animate-fade-in">
                            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-2 text-gray-400">
                                <CircleNotch size={20} className="animate-spin text-indigo-500" />
                                <span className="text-sm">Pensando...</span>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-800 border-t border-gray-700 relative z-40">
                    <ChatInput 
                        onSend={handleSend} 
                        onStop={stopGeneration}
                        isLoading={isLoading} 
                    />
                </div>
            </div>

            {/* Panel Derecho: Configuración (Desktop) */}
            <div className="hidden xl:block flex-shrink-0">
                 <ChatSettingsPanel 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange} 
                    isCollapsed={isSettingsCollapsed} 
                    setIsCollapsed={setIsSettingsCollapsed} 
                    onResumeConversation={handleResumeConversation}
                />
            </div>

            {/* Modales */}
            <SourceChunksModal 
                chunks={viewingChunks || []} 
                isOpen={!!viewingChunks} 
                onClose={() => setViewingChunks(null)} 
            />
        </div>
    );
}