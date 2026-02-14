import React from 'react';
import { Notebook, ChatCircleDots } from 'phosphor-react';
import type { ChatHistoryItem } from '../../types/chat';
import { useChatHistory } from '../../hooks/useChatHistory';

interface Props {
    onResumeConversation?: (history: ChatHistoryItem) => void;
}

const ChatHistoryPanel: React.FC<Props> = ({ onResumeConversation }) => {
    const { data, isLoading } = useChatHistory();

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 shrink-0">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Notebook size={18} weight="fill" className="text-purple-500"/> Historial
                </h2>
            </div>
            
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                    </div>
                ) : data?.history && data.history.length > 0 ? (
                    data.history.map((item) => (
                        <button
                            key={item.id}
                            className="text-left p-2.5 rounded-lg border border-gray-700/50 bg-gray-800 hover:bg-gray-700 hover:border-purple-500/50 transition-all flex flex-col gap-1 group"
                            onClick={() => onResumeConversation && onResumeConversation(item)}
                        >
                            <span className="font-semibold text-gray-300 truncate flex items-center gap-2 group-hover:text-white text-xs">
                                <ChatCircleDots size={14} className="text-purple-400 flex-shrink-0"/>
                                {item.questions && item.questions.length > 0 ? item.questions[0] : "Conversación sin título"}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate pl-5 block">
                                {item.answers && item.answers.length > 0 ? item.answers[0]?.substring(0, 30) + "..." : "..."}
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="text-gray-500 text-xs text-center mt-4 p-4 border border-dashed border-gray-700 rounded-lg">
                        No hay historial.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistoryPanel;