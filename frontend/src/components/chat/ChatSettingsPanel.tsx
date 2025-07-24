import React from 'react';
import ChatSettingsButton from './ChatSettingsModelButton';
import ChatHistoryButton from './ChatHistoryButton';
import type { ChatHistoryItem } from '../../types/chat';

export interface Settings {
    model: string;
    system_instruction: string;
    temperature: number;
    top_k: number;
    max_output_tokens: number;
    thinking_budget: number;
}

interface Props {
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
    onResumeConversation: (history: ChatHistoryItem) => void;
}

const ChatSettingsPanel: React.FC<Props> = ({ settings, onSettingsChange, isCollapsed, onResumeConversation }) => {
    if (isCollapsed) {
        return (
            <div className="flex flex-col items-center h-full pt-2 gap-2">
                <ChatSettingsButton isCollapsed={isCollapsed} settings={settings} onSettingsChange={onSettingsChange} />
                <ChatHistoryButton isCollapsed={isCollapsed} onResumeConversation={onResumeConversation} />
            </div>
        );
    }

    return null;
};

export default ChatSettingsPanel;