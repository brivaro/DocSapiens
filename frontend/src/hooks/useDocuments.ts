import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import toast from 'react-hot-toast'; // Cambio a react-hot-toast

// --- ÚNICA FUENTE DE VERDAD PARA EL TIPO DE DOCUMENTO ---
// Este es el tipo de dato "crudo" que viene de nuestra API
export interface ApiDocument {
  id: string;
  filename: string;
  content_type: string | null;
  uploaded_at: string | null;
  status: string | null;
  tags: string[];
  chunk_count?: number;
  split_mode?: string;
  chunk_size?: number;
  overlap?: number;
}

interface UploadParams {
  file: File;
  filename: string;
  split_mode: string;
  split_by: string;
  chunk_size?: number;
  overlap?: number;
  tags: string;
}

interface ReIndexParams {
    docId: string;
    split_mode: string;
    split_by: string;
    chunk_size: number;
    overlap: number;
}

// --- API Calls ---

const fetchDocumentsApi = async (): Promise<ApiDocument[]> => {
  const { data } = await apiClient.get("/api/v1/documents/");
  return data;
};

const deleteDocumentApi = async (docId: string) => {
  await apiClient.delete(`/api/v1/documents/${docId}/`);
};

const uploadDocumentApi = async (params: UploadParams): Promise<ApiDocument> => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("split_mode", params.split_mode);
  // Solo enviar delimitador si aplica
  if (params.split_mode === 'delimiter') {
      formData.append("split_by", params.split_by.replace(/\\n/g, '\n'));
  }
  if (params.chunk_size) formData.append("chunk_size", params.chunk_size.toString());
  if (params.overlap) formData.append("overlap", params.overlap.toString());
  if (params.tags) formData.append("tags", params.tags);

  const { data } = await apiClient.post("/api/v1/documents/upload/", formData, { 
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const reIndexDocumentApi = async (params: ReIndexParams) => {
    const { docId, ...payload } = params;
    // Ajustar split_by si es delimiter
    if (payload.split_mode === 'delimiter') {
        payload.split_by = payload.split_by.replace(/\\n/g, '\n');
    }
    const { data } = await apiClient.post(`/api/v1/documents/${docId}/reindex`, payload);
    return data;
}

// --- Hook ---

export function useDocuments() {
    const queryClient = useQueryClient();

    const { data: documents, isLoading, error } = useQuery<ApiDocument[]>({
        queryKey: ["documents"],
        queryFn: fetchDocumentsApi,
        // Polling inteligente: solo si hay docs procesando
        refetchInterval: (query) => {
            const data = query.state.data;
            const isProcessing = data?.some(doc => doc.status === 'processing' || doc.status === 'pending');
            return isProcessing ? 3000 : false;
        },
    });

    const { mutate: deleteDocument } = useMutation({
      mutationFn: deleteDocumentApi,
      onSuccess: () => {
        toast.success("Documento eliminado.");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
      onError: (err: any) => {
        toast.error(`Error al eliminar: ${err.message}`);
      }
    });

    const { mutateAsync: uploadDocument } = useMutation({
        mutationFn: uploadDocumentApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
        // No ponemos toast aquí para manejarlo en el modal y poder cerrar
    });

    const { mutateAsync: reIndexDocument } = useMutation({
        mutationFn: reIndexDocumentApi,
        onSuccess: () => {
            toast.success("Re-indexado iniciado.");
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
        onError: (err: any) => {
            toast.error(`Error al re-indexar: ${err.message}`);
        }
    });

  return { documents, isLoading, error, deleteDocument, uploadDocument, reIndexDocument };
}