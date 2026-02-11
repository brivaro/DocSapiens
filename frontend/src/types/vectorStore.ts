export interface VectorStore {
    id: string;
    name: string;
    description?: string;
    embedding_dimension: number;
    created_at: string;
    document_count?: number;
}

export interface VectorStoreCreate {
    name: string;
    description?: string;
    embedding_dimension: number;
}