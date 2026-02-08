import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client'; // Importación corregida
import type { ChatHistoryItem, ChatHistoryResponse } from '../types/chat';

// Obtener historial completo
export const useChatHistory = () => {
  return useQuery<ChatHistoryResponse>({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/history/'); // Ruta relativa al baseURL
      return data;
    },
  });
};

// Guardar una nueva conversación
export const useSaveChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ChatHistoryItem, 'id'>) => {
      const { data } = await apiClient.post('/v1/history/', item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
  });
};