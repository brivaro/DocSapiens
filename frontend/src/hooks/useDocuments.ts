import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

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
            // Si hay algún documento procesándose, refresca cada 3 segundos.
            const isProcessing = data?.some(doc => doc.status === 'processing' || doc.status === 'pending');
            return isProcessing ? 3000 : false;
        },
    });

  // --- ESTA ES LA DEFINICIÓN SIMPLIFICADA Y CORRECTA ---
  const { mutate: uploadDocument, isPending: isUploading } = useMutation({ 
    mutationFn: uploadDocumentApi,
    onSuccess: (data) => { // El 'data' es la respuesta de la API (el documento actualizado)
      console.log("Mutación exitosa. Invalidando queries...");

      // 1. Invalida la lista de documentos para refrescar la tabla
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      // 2. ¡LA LÍNEA CLAVE! Invalida los chunks del documento específico que se acaba de subir.
      //    Esto forzará al componente ChunkViewer a recargar sus datos si está viendo este documento.
      queryClient.invalidateQueries({ queryKey: ["chunks", data.id] });
    },
    onError: (err) => {
        console.error("Error en la mutación al subir el documento:", err);
    }
  });

  const { mutate: deleteDocument, isPending: isDeleting } = useMutation({
    mutationFn: deleteDocumentApi,
    onSuccess: (_, docId) => { // El segundo argumento de onSuccess es la variable que se pasó a mutate
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      // También es una buena práctica invalidar los chunks al borrar
      queryClient.invalidateQueries({ queryKey: ["chunks", docId] });
    },
    onError: (err) => {
        console.error("Error al eliminar el documento:", err);
    }
  });

  return {
    documents, isLoading, error,
    uploadDocument, isUploading,
    deleteDocument, isDeleting,
  };
}