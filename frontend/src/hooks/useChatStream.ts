import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../api/client';
import { Message, ChatRequestParams, Chunk } from '../types/chat';
import { useAppToast } from './useAppToast';

export const useChatStream = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const toast = useAppToast();

    const addMessage = useCallback((msg: Message) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const sendMessage = async (params: ChatRequestParams) => {
        if (isLoading) return;

        // 1. Añadir mensaje de usuario
        const userMsgId = Date.now().toString();
        addMessage({ id: userMsgId, role: 'user', content: params.question });

        // 2. Preparar mensaje del asistente (vacío inicialmente)
        const assistantMsgId = (Date.now() + 1).toString();
        setIsLoading(true);
        addMessage({ 
            id: assistantMsgId, 
            role: 'assistant', 
            content: '', 
            isStreaming: true 
        });

        abortControllerRef.current = new AbortController();

        try {
            // 3. Iniciar Petición Fetch (No usamos axios para streaming fácil)
            // Nota: API_BASE_URL puede ser relativa (/api) o absoluta.
            const fetchUrl = `${API_BASE_URL.replace(/\/$/, '')}/v1/chat/stream`;
            
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error(response.statusText);
            if (!response.body) throw new Error("No response body");

            // 4. Leer el Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // Procesar eventos SSE (data: ...)
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || ""; // Guardar el remanente incompleto

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith("event: sources")) {
                        // Evento de Fuentes
                        const dataPart = line.split("data: ")[1];
                        if (dataPart) {
                            try {
                                const sources: Chunk[] = JSON.parse(dataPart);
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMsgId ? { ...m, chunks: sources } : m
                                ));
                            } catch (e) { console.error("Error parsing sources", e); }
                        }
                    } 
                    else if (trimmed.startsWith("event: token")) {
                        // Evento de Token de texto
                        const dataPart = line.split("data: ")[1];
                        if (dataPart) {
                            try {
                                // El backend envía el token como string JSON (ej: "Hola") para escapar caracteres
                                const token = JSON.parse(dataPart); 
                                setMessages(prev => prev.map(m => 
                                    m.id === assistantMsgId ? { ...m, content: m.content + token } : m
                                ));
                            } catch {
                                // Fallback si no es JSON válido (texto plano)
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
        abortControllerRef.current = null;
    };

    return { messages, sendMessage, isLoading, stopGeneration, clearChat, setMessages };
};