import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import apiClient from '../api/client';
import { RagConfig } from '../interfaces/RagSettings';
import { useAppToast } from '../hooks/useAppToast';

interface RagSettingsContextType {
    config: RagConfig | null;
    isLoading: boolean;
    refreshConfig: () => Promise<void>;
}

const RagSettingsContext = createContext<RagSettingsContextType | undefined>(undefined);

export const RagSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<RagConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useAppToast();

    const refreshConfig = useCallback(async () => {
        try {
            const { data } = await apiClient.get<RagConfig>('/api/v1/settings/');
            setConfig(data);
        } catch (error) {
            console.error("Error fetching RAG config:", error);
            // No mostramos toast de error al inicio para no saturar, pero sí logueamos
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshConfig();
    }, [refreshConfig]);

    return (
        <RagSettingsContext.Provider value={{ config, isLoading, refreshConfig }}>
            {children}
        </RagSettingsContext.Provider>
    );
};

export const useRagSettings = () => {
    const context = useContext(RagSettingsContext);
    if (!context) throw new Error('useRagSettings must be used within a RagSettingsProvider');
    return context;
};