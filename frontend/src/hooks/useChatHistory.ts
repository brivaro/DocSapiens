import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { ChatHistoryResponse, ChatHistoryCreate } from '../types/chat';

// Obtener historial completo
export const useChatHistory = () => {
  return useQuery<ChatHistoryResponse>({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/history/');
      return data;
    },
  });
};

// Guardar una nueva conversación
export const useSaveChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ChatHistoryCreate) => {
      const { data } = await apiClient.post('/v1/history/', item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
  });
};