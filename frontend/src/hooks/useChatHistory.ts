import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ChatHistoryResponse, ChatHistoryCreate, ChatHistoryItem } from '../types/chat';
import { useAppToast } from './useAppToast';

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

export const useDeleteChatHistory = () => {
    const queryClient = useQueryClient();
    const toast = useAppToast();
    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/v1/history/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-history'] });
            toast.success("Conversación eliminada");
        }
    });
};