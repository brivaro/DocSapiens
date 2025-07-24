import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { toast } from 'sonner';

// --- ÚNICA FUENTE DE VERDAD PARA EL TIPO DE DOCUMENTO ---
// Este es el tipo de dato "crudo" que viene de nuestra API
export interface ApiDocument {
  id: string;
  filename: string;
  content_type: string | null;
  uploaded_at: string | null;
  status: string | null;
  tags: string[];
}
// --------------------------------------------------------

interface UploadParams {
  file: File;
  filename: string;
  split_mode: string;
  split_by: string;
  chunk_size?: number;
  overlap?: number;
  tags: string;
}

// Funciones de la API

const fetchDocumentsApi = async (): Promise<ApiDocument[]> => {
  const { data } = await api.get("/api/v1/documents/");
  return data;
};

const deleteDocumentApi = async (docId: string) => {
  await api.delete(`/api/v1/documents/${docId}/`);
};

const uploadDocumentApi = async (params: UploadParams): Promise<ApiDocument> => {
  const formData = new FormData();
  
  formData.append("file", params.file, params.filename);
  formData.append("split_mode", params.split_mode);
  formData.append("split_by", params.split_by);
  if (params.chunk_size) {
    formData.append("chunk_size", params.chunk_size.toString());
  }
  if (params.overlap) {
    formData.append("overlap", params.overlap.toString());
  }
  if (params.tags) {
    formData.append("tags", params.tags);
  }
  const { data } = await api.post("/api/v1/documents/upload/", formData, { 
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// Hook principal
export function useDocuments() {
    const queryClient = useQueryClient();

    const { data: documents, isLoading, error } = useQuery<ApiDocument[]>({
        queryKey: ["documents"],
        queryFn: fetchDocumentsApi,
        refetchInterval: (query) => {
            const data = query.state.data;
            const isProcessing = data?.some(doc => doc.status === 'processing' || doc.status === 'pending');
            return isProcessing ? 3000 : false;
        },
    });

    const { mutate: deleteDocument } = useMutation({
      mutationFn: deleteDocumentApi,
      onSuccess: (_, docId) => {
        toast.success("Document deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        queryClient.invalidateQueries({ queryKey: ["chunks", docId] });
      },
      onError: (err) => {
        toast.error(`Failed to delete document: ${err.message}`);
      }
    });

  return { documents, isLoading, error, deleteDocument };
}