import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { useRagSettings } from '../context/RagSettingsContext';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import SourceChunksModal from '../components/chat/SourceChunksModal';
import ChatSettingsPanel, { type Settings } from '../components/chat/ChatSettingsPanel';
import ChatFiltersPanel from '../components/chat/ChatFiltersPanel';
import WelcomePlaceholder from '../components/chat/WelcomePlaceholder';
import { Robot, Sliders, X, CircleNotch } from 'phosphor-react';
import { Chunk, ChatRequestParams } from '../types/chat';
import { clsx } from 'clsx';

interface ChatFilters {
    documentIds: string[];
    tags: string[];
    k: number;
}

export default function Chat() {
    const { messages, sendMessage, isLoading, stopGeneration, clearChat } = useChatStream();
    const { config } = useRagSettings();
    
    // Estado local
    const [viewingChunks, setViewingChunks] = useState<Chunk[] | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
    
    // Configuración local del chat
    const [filters, setFilters] = useState<ChatFilters>({ documentIds: [], tags: [], k: 5 });
    const [settings, setSettings] = useState<Settings>({ 
        model: config?.embedding_model || 'gemini-2.0-flash', 
        system_instruction: 'You are a helpful assistant.', 
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
        const params: ChatRequestParams = {
            question: text,
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

    // Funciones auxiliares para los paneles
    const handleFiltersChange = (newFilters: Partial<ChatFilters>) => setFilters(prev => ({ ...prev, ...newFilters }));
    const handleSettingsChange = (newSettings: Partial<Settings>) => setSettings(prev => ({ ...prev, ...newSettings }));
    const handleResumeConversation = () => { /* Implementar resume si se desea, requiere adaptar useChatStream */ };

    return (
        <div className="flex h-full gap-6 overflow-hidden relative">
            
            {/* Panel Izquierdo: Filtros (Responsive: oculto en móviles) */}
            <div className="hidden lg:block w-72 flex-shrink-0 h-full">
                <ChatFiltersPanel filters={filters} onFiltersChange={handleFiltersChange} />
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
                            <p className="text-xs text-gray-400">
                                Modo: <span className="text-indigo-300">{config?.embedding_task_type || 'Estándar'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Botón Filtros (Móvil) */}
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

                {/* Filtros Móvil (Collapsible) */}
                <div className={clsx(
                    "lg:hidden bg-gray-800 border-b border-gray-700 overflow-hidden transition-all duration-300 ease-in-out",
                    showFilters ? "max-h-96 p-4 opacity-100" : "max-h-0 opacity-0"
                )}>
                     {/* Versión simplificada de filtros para móvil */}
                     <label className="block text-gray-400 text-sm mb-1">Chunks (Top K): {filters.k}</label>
                     <input type="range" min="1" max="20" value={filters.k} onChange={e => setFilters(p => ({...p, k: parseInt(e.target.value)}))} className="w-full mb-3"/>
                </div>

                {/* Lista de Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <WelcomePlaceholder />
                    ) : (
                        messages.map(msg => (
                            <ChatBubble key={msg.id} message={msg} onViewSources={setViewingChunks} />
                        ))
                    )}
                    
                    {/* Indicador de carga inicial (antes de recibir tokens) */}
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
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <ChatInput 
                        onSend={handleSend} 
                        onStop={stopGeneration}
                        isLoading={isLoading} 
                    />
                    <p className="text-center text-xs text-gray-500 mt-2">
                        DocSapiens puede cometer errores. Verifica la información.
                    </p>
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