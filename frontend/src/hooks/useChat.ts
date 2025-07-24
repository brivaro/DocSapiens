// hooks/useChat.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';

// Parámetros que se envían a la API
export interface ChatRequestParams {
  question: string;
  k?: number;
  document_ids?: string[];
  tags?: string[];
  model?: string;
  system_instruction?: string;
  temperature?: number;
  top_k?: number;
  max_output_tokens?: number;
  thinking_budget?: number;
}

// Estructura de un chunk devuelto por la API
export interface Chunk {
    document_id: string;
    chunk_id: number;
    text: string;
    score: number;
}

// Estructura de la respuesta de la API
interface ChatResponse {
  answer: string;
  chunks: Chunk[];
}

// Estructura de un mensaje en la UI
export interface Message {
  id: string; // Añadimos un ID para un key estable
  role: 'user' | 'assistant' | 'system';
  content: string;
  chunks?: Chunk[];
}

// La función que llama a la API
const sendChatRequest = async (params: ChatRequestParams): Promise<ChatResponse> => {
    const { data } = await api.post('/api/v1/chat/', params);
    return data;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: (params: ChatRequestParams) => sendChatRequest(params),
    onMutate: (params) => {
        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: params.question };
        setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (data) => {
        const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', content: data.answer, chunks: data.chunks };
        setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
        const errorMessage: Message = { id: `system-${Date.now()}`, role: 'system', content: `Error: ${error.message}` };
        setMessages(prev => [...prev, errorMessage]);
    }
  });

  const sendMessage = (params: ChatRequestParams) => {
      mutate(params);
  }

  return { messages, sendMessage, isLoading };
};