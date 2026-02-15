import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client'; // Importación corregida
import { toast } from 'react-hot-toast'; // Aseguramos usar react-hot-toast
import { useState } from 'react';

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
    const [audioSrc, setAudioSrc] = useState<string | null>(null);

    const { mutate, isPending: isGenerating } = useMutation({
        mutationFn: fetchAudio,
        onSuccess: (data) => {
            const src = `data:audio/wav;base64,${data.audio_base64}`;
            setAudioSrc(src);
            toast.success("Audio generado");
        },
        onError: (error) => {
            setAudioSrc(null); 
            console.error("Error fetching speech data:", error);
            toast.error("No se pudo generar el audio.");
        }
    });

    const generateSpeech = (text: string) => {
        if (isGenerating || audioSrc) return;
        mutate({ text: text, voice_name: 'Kore' });
    };

    return { generateSpeech, isGenerating, audioSrc };
};