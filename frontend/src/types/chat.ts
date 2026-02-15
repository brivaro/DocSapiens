export interface Chunk {
  chunk_id: number;
  document_id: string;
  text: string;
  score: number;
  chunk_tags?: string[];
  start?: number;
  end?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chunks?: Chunk[];
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatRequestParams {
  question: string;
  vector_store_id: string;
  is_code_query?: boolean;
  k?: number;
  document_ids?: string[];
  tags?: string[];
  model?: string;
  system_instruction?: string;
  temperature?: number;
  top_k?: number;
  max_output_tokens?: number;
  thinking_budget?: number;
}

export interface ChatHistoryItem {
  id: string;
  questions: string[];
  answers: string[];  
  chunks: Chunk[][];
}

export interface ChatHistoryCreate {
    question: string;
    answer: string;
    chunks: Chunk[];
}

export interface ChatHistoryResponse {
  history: ChatHistoryItem[];
}