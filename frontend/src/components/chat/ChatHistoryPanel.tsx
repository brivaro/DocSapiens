import React from 'react';
import { Notebook, X, ChatCircleDots, Trash } from 'phosphor-react';
import type { ChatHistoryItem } from '../../types/chat';
import { useChatHistory, useDeleteChatHistory } from '../../hooks/useChatHistory';
import { useAppToast } from '../../hooks/useAppToast';

interface Props {
    isCollapsed: boolean;
    onResumeConversation?: (history: ChatHistoryItem) => void;
}

const ChatHistoryPanel: React.FC<Props> = ({ isCollapsed, onResumeConversation }) => {
    const { data, isLoading } = useChatHistory();
    const { mutate: deleteHistory } = useDeleteChatHistory();
    const toast = useAppToast();

    const handleResume = (item: ChatHistoryItem) => {
        if (onResumeConversation) onResumeConversation(item);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteHistory(id);
        toast.success("Conversación eliminada");
    };

    // Panel desplegado (Estilo Oscuro)
    return (
        <div className="bg-gray-800 p-4 h-full w-full flex flex-col gap-4 transition-all shadow-2xl z-50 animate-fade-in">
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    </div>
                ) : data?.history && data.history.length > 0 ? (
                    data.history.map((item) => (
                        <div key={item.id} className="relative group">
                            <button
                                className="w-full text-left p-3 pr-8 rounded-lg border border-gray-700 bg-gray-900/50 hover:bg-gray-700 hover:border-purple-500/50 transition-all flex flex-col gap-1"
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
                            
                            {/* Botón de Eliminar */}
                            <button
                                onClick={(e) => handleDelete(e, item.id)}
                                className="absolute right-2 top-3 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                                title="Eliminar conversación"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
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

export default ChatHistoryPanel;