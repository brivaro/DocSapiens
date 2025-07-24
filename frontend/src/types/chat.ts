export interface Chunk {
  document_id: string;
  chunk_id: number;
  text: string;
  score: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chunks?: Chunk[];
}

export interface ChatRequestParams {
  question: string;
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

export interface ChatHistoryResponse {
  history: ChatHistoryItem[];
}