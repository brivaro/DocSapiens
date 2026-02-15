import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAppToast } from './useAppToast';

interface TextToSpeechRequest {
  text: string;
  voice_name?: string;
  model?: string;
}

interface TextToSpeechResponse {
  audio_base64: string;
  filename: string;
}

const fetchAudio = async (params: TextToSpeechRequest): Promise<TextToSpeechResponse> => {
  const { data } = await apiClient.post('/api/v1/embeddings/speech', params);
  return data;
};

export const useTextToSpeech = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const toast = useAppToast();

    const { mutateAsync } = useMutation({
        mutationFn: fetchAudio,
    });

    const speak = async (text: string) => {
        if (isPlaying) return;
        
        setIsPlaying(true);
        const toastId = toast.loading("Generando audio...");
        
        try {
            const data = await mutateAsync({ text, voice_name: 'Kore' });
            
            // Crear audio desde base64
            const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
            
            audio.onended = () => {
                setIsPlaying(false);
            };
            
            audio.onerror = (e) => {
                console.error("Audio playback error", e);
                setIsPlaying(false);
                toast.error("Error al reproducir audio");
            };

            await audio.play();
            toast.dismiss(toastId);
            toast.success("Reproduciendo...");
            
        } catch (error) {
            console.error("TTS Error:", error);
            setIsPlaying(false);
            toast.dismiss(toastId);
            toast.error("No se pudo generar el audio.");
        }
    };

    return { speak, isPlaying };
};