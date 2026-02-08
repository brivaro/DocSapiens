export type TaskType = 
    | "RETRIEVAL_QUERY"
    | "RETRIEVAL_DOCUMENT"
    | "SEMANTIC_SIMILARITY"
    | "CLASSIFICATION"
    | "CLUSTERING"
    | "QUESTION_ANSWERING"
    | "FACT_VERIFICATION"
    | "CODE_RETRIEVAL_QUERY";

export interface RagConfig {
    id: number;
    embedding_model: string;
    embedding_dimension: number;
    embedding_task_type: TaskType;
    is_active: boolean;
}