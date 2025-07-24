// hooks/useTextToSpeech.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { toast } from 'sonner';
import { useState } from 'react';

// --- Interfaces sin cambios ---
interface TextToSpeechRequest {
  text: string;
  voice_name?: string;
  model?: string;
}

interface TextToSpeechResponse {
  audio_base64: string;
  filename: string;
}

// --- Función fetch sin cambios ---
const fetchAudio = async (params: TextToSpeechRequest): Promise<TextToSpeechResponse> => {
  const { data } = await api.post('/api/v1/generate/speech', params);
  return data;
};


// --- HOOK MODIFICADO ---
export const useTextToSpeech = () => {
    // 1. Estado para almacenar la URL del audio una vez generado
    const [audioSrc, setAudioSrc] = useState<string | null>(null);

    const { mutate, isPending: isGenerating } = useMutation({
        mutationFn: fetchAudio,
        onSuccess: (data) => {
            // 2. Cuando tenemos éxito, creamos la URL y la guardamos en el estado
            const src = `data:audio/wav;base64,${data.audio_base64}`;
            setAudioSrc(src);
            toast.success("Audio ready to play!");
        },
        onError: (error) => {
            // 3. Si hay un error, limpiamos la URL y notificamos
            setAudioSrc(null); 
            console.error("Error fetching speech data:", error);
            toast.error("Sorry, couldn't generate audio.", {
                description: "There was an issue with the speech generation service."
            });
        }
    });

    // 4. La función que se expone ahora solo inicia la mutación
    const generateSpeech = (text: string) => {
        // Si ya hay un audio, no hacemos nada para evitar regnerarlo.
        // Si se quisiera poder regnerar, se añadiría un botón de "reset".
        if (isGenerating || audioSrc) return;

        mutate({
            text: text,
            voice_name: 'Kore',
        });
    };

    // 5. Exponemos el estado para que el componente decida qué renderizar
    return {
        generateSpeech,
        isGenerating,
        audioSrc, // La URL del audio, lista para el tag <audio>
    };
};