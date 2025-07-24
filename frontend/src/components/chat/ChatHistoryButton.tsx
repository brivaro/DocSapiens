import React from 'react';
import { Notebook, X } from 'phosphor-react';
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

    if (!isCollapsed && !open) return null;
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="p-3 rounded-full bg-white border text-purple-600 shadow-sm hover:bg-gray-100 animate-subtle-pulse"
                aria-label="Open chat history"
            >
                <Notebook size={24} weight="fill" />
            </button>
        );
    }
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 h-full flex flex-col gap-6 w-80 transition-all shadow-lg">
            <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Notebook size={20} weight="fill" /> Chat History
                </h2>
                <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {isLoading ? (
                    <div className="text-gray-500 text-sm text-center mt-8">Loading...</div>
                ) : data && data.history.length > 0 ? (
                    data.history.map((item) => (
                        <button
                            key={item.id}
                            className="text-left p-3 rounded-lg border hover:bg-gray-50 transition flex flex-col gap-1"
                            onClick={() => handleResume(item)}
                        >
                            <span className="font-semibold text-gray-800 truncate">{item.questions[0]}</span>
                            <span className="text-xs text-gray-500 truncate">{item.answers[0]}</span>
                        </button>
                    ))
                ) : (
                    <div className="text-gray-500 text-sm text-center mt-8">No history yet.</div>
                )}
            </div>
        </div>
    );
};

export default ChatHistoryButton;
