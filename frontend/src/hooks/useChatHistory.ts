import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { ChatHistoryItem, ChatHistoryResponse } from '../types/chat';

// Obtener historial completo
export const useChatHistory = () => {
  return useQuery<ChatHistoryResponse>({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/history/');
      return data;
    },
  });
};

// Guardar una nueva conversación
export const useSaveChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ChatHistoryItem, 'id'>) => {
      const { data } = await api.post('/api/v1/history/', item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
  });
};
