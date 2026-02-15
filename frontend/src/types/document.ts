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

export interface UploadParams {
  file: File;
  filename: string;
  split_mode: string;
  split_by: string;
  chunk_size?: number;
  overlap?: number;
  tags: string;
}

export interface ReIndexParams {
    docId: string;
    split_mode: string;
    split_by: string;
    chunk_size: number;
    overlap: number;
}