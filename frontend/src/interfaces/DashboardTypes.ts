import { ApiDocument } from '../hooks/useDocuments';
import { ChatHistoryItem } from '../types/chat';

export interface DashboardStats {
    totalDocuments: number;
    totalChunks: number;
    processingDocs: number;
    lastActivity: string;
}

// Para tipar los datos que pasaremos a las cards
export interface RecentActivityItem {
    id: string;
    type: 'document' | 'chat';
    title: string;
    date: string;
    status?: string;
}