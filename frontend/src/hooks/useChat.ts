// hooks/useChat.ts
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Chunk, ChatRequestParams, Message, ChatHistoryItem } from '../types/chat';

// Interfaz para la persistencia
interface PersistChatParams {
    conversationId: string | null;
    question: string;
    answer: string;
    chunks: Chunk[];
}

// Función que decide si crear (POST) o actualizar (PUT)
const persistChatHistory = async ({ conversationId, ...payload }: PersistChatParams) => {
    if (conversationId) {
        const { data } = await api.put(`/api/v1/history/${conversationId}`, payload);
        return data;
    } else {
        const { data } = await api.post('/api/v1/history/', payload);
        return data;
    }
};

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const startNewConversation = () => {
        setMessages([]);
        setConversationId(null);
    };

    const { mutate: persistChat } = useMutation({
        mutationFn: persistChatHistory,
        onSuccess: (data) => {
            if (data?.id) setConversationId(data.id);
            queryClient.invalidateQueries({ queryKey: ['chat-history'] });
        },
        onError: (error) => {
            console.error("Failed to save chat history:", error);
        }
    });

    const { mutate, isPending: isLoading } = useMutation({
        mutationFn: (params: ChatRequestParams): Promise<{answer: string, chunks: Chunk[]}> => 
            api.post('/api/v1/chat/', params).then(res => res.data),
        onMutate: (params) => {
            const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: params.question };
            setMessages(prev => [...prev, userMessage]);
        },
        onSuccess: (data, params) => {
            const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', content: data.answer, chunks: data.chunks };
            setMessages(prev => [...prev, assistantMessage]);

            persistChat({
                conversationId,
                question: params.question,
                answer: data.answer,
                chunks: data.chunks
            });
        },
        onError: (error) => {
            const errorMessage: Message = { id: `system-${Date.now()}`, role: 'system', content: `Error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
        }
    });

    const resumeConversation = (historyItem: ChatHistoryItem) => {
        const newMessages: Message[] = [];
        historyItem.questions.forEach((question, index) => {
            newMessages.push({ id: `user-${historyItem.id}-${index}`, role: 'user', content: question });
            if (historyItem.answers[index]) {
                newMessages.push({
                    id: `assistant-${historyItem.id}-${index}`,
                    role: 'assistant',
                    content: historyItem.answers[index],
                    chunks: historyItem.chunks[index] || [] 
                });
            }
        });
        
        setMessages(newMessages);
        setConversationId(historyItem.id);
    };

    return { 
        messages, 
        sendMessage: mutate, 
        isLoading,
        setMessages,
        startNewConversation,
        resumeConversation
    };
};