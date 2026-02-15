import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { VectorStore, VectorStoreCreate } from "../types/vectorStore";
import { useAppToast } from "./useAppToast";

// API calls
const fetchStores = async (): Promise<VectorStore[]> => {
    const { data } = await apiClient.get("/api/v1/vector-stores/");
    return data;
};

const createStore = async (data: VectorStoreCreate): Promise<VectorStore> => {
    const res = await apiClient.post("/api/v1/vector-stores/", data);
    return res.data;
};

const deleteStore = async (id: string) => {
    await apiClient.delete(`/api/v1/vector-stores/${id}`);
};

// Hook
export function useVectorStores() {
    const queryClient = useQueryClient();
    const toast = useAppToast();

    const { data: vectorStores, isLoading, error } = useQuery({
        queryKey: ["vectorStores"],
        queryFn: fetchStores,
    });

    const { mutateAsync: createVectorStore } = useMutation({
        mutationFn: createStore,
        onSuccess: () => {
            toast.success("Colección creada correctamente");
            queryClient.invalidateQueries({ queryKey: ["vectorStores"] });
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            let errorMessage = "Error al crear colección";

            if (Array.isArray(detail)) {
                errorMessage = detail.map(e => e.msg).join(', ');
            } else if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (typeof detail === 'object') {
                errorMessage = JSON.stringify(detail);
            }
            
            toast.error(errorMessage);
        }
    });

    const { mutateAsync: deleteVectorStore } = useMutation({
        mutationFn: deleteStore,
        onSuccess: () => {
            toast.success("Colección eliminada");
            queryClient.invalidateQueries({ queryKey: ["vectorStores"] });
        },
        onError: (err: any) => {
            toast.error("Error al eliminar colección");
        }
    });

    return { vectorStores, isLoading, error, createVectorStore, deleteVectorStore };
}