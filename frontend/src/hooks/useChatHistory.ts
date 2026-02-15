import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ChatHistoryResponse, ChatHistoryCreate, ChatHistoryItem } from '../types/chat';

// Obtener historial completo
export const useChatHistory = () => {
  return useQuery<ChatHistoryResponse>({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/history/');
      return data;
    },
  });
};

// Guardar una nueva conversación (POST)
export const useSaveChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ChatHistoryCreate) => {
      const { data } = await apiClient.post<ChatHistoryItem>('/api/v1/history/', item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
  });
};

// Actualizar conversación existente (PUT) ---
export const useUpdateChatHistory = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...item }: ChatHistoryCreate & { id: string }) => {
        const { data } = await apiClient.put<ChatHistoryItem>(`/api/v1/history/${id}`, item);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      },
    });
  };