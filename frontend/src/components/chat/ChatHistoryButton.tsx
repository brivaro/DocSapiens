import React from 'react';
import { Notebook, X, ChatCircleDots } from 'phosphor-react';
import type { ChatHistoryItem } from '../../types/chat';
import { useChatHistory } from '../../hooks/useChatHistory';

interface Props {
    isCollapsed: boolean;
    onResumeConversation?: (history: ChatHistoryItem) => void;
}

const ChatHistoryButton: React.FC<Props> = ({ isCollapsed, onResumeConversation }) => {
    const [open, setOpen] = React.useState(false);
    const { data, isLoading } = useChatHistory();

    const handleResume = (item: ChatHistoryItem) => {
        if (onResumeConversation) onResumeConversation(item);
        setOpen(false);
    };

    // Si está colapsado y no está abierto, no renderizamos el panel flotante aún
    if (!isCollapsed && !open) return null;
    
    // Botón flotante cuando el panel principal está cerrado o colapsado
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="p-3 rounded-full bg-gray-800 border border-gray-700 text-purple-400 shadow-lg hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Abrir historial"
                title="Historial de Chats"
            >
                <Notebook size={24} weight="fill" />
            </button>
        );
    }

    // Panel desplegado (Estilo Oscuro)
    return (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-full flex flex-col gap-4 w-80 transition-all shadow-2xl z-20">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Notebook size={20} weight="fill" className="text-purple-500"/> Historial
                </h2>
                <button 
                    onClick={() => setOpen(false)} 
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    </div>
                ) : data?.history && data.history.length > 0 ? (
                    data.history.map((item) => (
                        <button
                            key={item.id}
                            className="text-left p-3 rounded-lg border border-gray-700 bg-gray-900/50 hover:bg-gray-700 hover:border-purple-500/50 transition-all flex flex-col gap-1 group"
                            onClick={() => handleResume(item)}
                        >
                            <span className="font-semibold text-gray-200 truncate flex items-center gap-2 group-hover:text-white text-sm">
                                <ChatCircleDots size={16} className="text-purple-400 flex-shrink-0"/>
                                {item.questions && item.questions.length > 0 ? item.questions[0] : "Conversación sin título"}
                            </span>
                            <span className="text-xs text-gray-500 truncate pl-6 block">
                                {item.answers && item.answers.length > 0 ? item.answers[0]?.substring(0, 40) + "..." : "..."}
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="text-gray-500 text-sm text-center mt-8 p-4 border border-dashed border-gray-700 rounded-lg">
                        No hay historial guardado.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistoryButton;