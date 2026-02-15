import { useState, useCallback, useRef } from 'react';
import { Message, ChatRequestParams, Chunk } from '../types/chat';
import { useAppToast } from './useAppToast';
import { useSaveChatHistory, useUpdateChatHistory } from './useChatHistory';

export const useChatStream = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Estado para saber si estamos en una conversación existente
    const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const toast = useAppToast();
    
    // Hooks de mutación (Usamos mutateAsync para esperar la respuesta)
    const { mutateAsync: saveHistory } = useSaveChatHistory();
    const { mutateAsync: updateHistory } = useUpdateChatHistory();

    const addMessage = useCallback((msg: Message) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const sendMessage = async (params: ChatRequestParams) => {
        if (isLoading) return;

        const userMsgId = Date.now().toString();
        addMessage({ id: userMsgId, role: 'user', content: params.question });

        const assistantMsgId = (Date.now() + 1).toString();
        setIsLoading(true);
        addMessage({ 
            id: assistantMsgId, 
            role: 'assistant', 
            content: '', 
            isStreaming: true 
        });

        abortControllerRef.current = new AbortController();

        let fullAnswer = "";
        let collectedChunks: Chunk[] = [];

        try {
            const fetchUrl = `/api/v1/chat/stream`;
            
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error(response.statusText);
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || ""; 

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith("event: sources")) {
                        const dataPart = line.split("data: ")[1];
                        if (dataPart) {
                            try {
                                const sources: Chunk[] = JSON.parse(dataPart);
                                collectedChunks = sources;
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMsgId ? { ...m, chunks: sources } : m
                                ));
                            } catch (e) { console.error("Error parsing sources", e); }
                        }
                    } 
                    else if (trimmed.startsWith("event: token")) {
                        const dataPart = line.split("data: ")[1];
                        if (dataPart) {
                            try {
                                const token = JSON.parse(dataPart); 
                                fullAnswer += token; 
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMsgId ? { ...m, content: m.content + token } : m
                                ));
                            } catch {
                                fullAnswer += dataPart;
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMsgId ? { ...m, content: m.content + dataPart } : m
                                ));
                            }
                        }
                    }
                    else if (trimmed.startsWith("event: error")) {
                        const dataPart = line.split("data: ")[1];
                        throw new Error(dataPart || "Stream error");
                    }
                }
            }

            if (fullAnswer && !abortControllerRef.current?.signal.aborted) {
                const historyData = {
                    question: params.question,
                    answer: fullAnswer,
                    chunks: collectedChunks
                };

                if (currentHistoryId) {
                    // Si ya tenemos ID, ACTUALIZAMOS (PUT)
                    console.log("Actualizando historial existente:", currentHistoryId);
                    await updateHistory({ id: currentHistoryId, ...historyData });
                } else {
                    // Si no, CREAMOS (POST) y guardamos el ID nuevo
                    console.log("Creando nuevo historial");
                    const newHistory = await saveHistory(historyData);
                    if (newHistory && newHistory.id) {
                        setCurrentHistoryId(newHistory.id);
                    }
                }
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Stream error:", error);
                setMessages(prev => prev.map(m => 
                    m.id === assistantMsgId 
                        ? { ...m, content: m.content + `\n\n**[Error interrumpido: ${error.message}]**`, error: true } 
                        : m
                ));
                toast.error("Error en la generación de respuesta.");
            }
        } finally {
            setIsLoading(false);
            setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            ));
            abortControllerRef.current = null;
        }
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
            toast.info("Generación detenida por el usuario.");
        }
    };

    const clearChat = () => {
        setMessages([]);
        setCurrentHistoryId(null); // Importante: Reseteamos el ID al limpiar
        abortControllerRef.current = null;
    };

    // Exportamos setCurrentHistoryId para poder usarlo al recuperar historial desde el sidebar
    return { 
        messages, 
        sendMessage, 
        isLoading, 
        stopGeneration, 
        clearChat, 
        setMessages, 
        setCurrentHistoryId 
    };
};