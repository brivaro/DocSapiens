import base64, os
import uuid
import wave
import io
from backend.llm_providers import llm_manager
from backend.models.generation import ImageGenerationRequest, ImageGenerationResponse, TextToSpeechRequest, TextToSpeechResponse

class GenerationService:
    def __init__(self):
        self.llm_provider = llm_manager.get_provider("gemini") # TODO: en el futuro cambia eso para que se pueda decidir otros modelos
        self.AUDIO_DIR = "audio"
        os.makedirs(self.AUDIO_DIR, exist_ok=True)

    def _save_audio_to_wav(self, filepath: str, pcm_data: bytes):
        """
        Helper para guardar los bytes de audio en un archivo .wav.
        Usa los parámetros estándar (24000 Hz, 1 canal, 16-bit).
        """
        try:
            with wave.open(filepath, "wb") as wf:
                wf.setnchannels(1)       # Mono
                wf.setsampwidth(2)       # 16-bit PCM
                wf.setframerate(24000)   # 24kHz sample rate
                wf.writeframes(pcm_data)
            print(f"[INFO] Archivo de audio guardado en: {filepath}")
        except Exception as e:
            print(f"[ERROR] No se pudo guardar el archivo WAV: {e}")
            raise

    def generate_image(self, request: ImageGenerationRequest) -> ImageGenerationResponse:
        result = self.llm_provider.generate_image(prompt=request.prompt, model=request.model)
        
        image_bytes = result.get("image_bytes")
        if not image_bytes:
            raise ValueError("El modelo no generó una imagen.")
            
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        return ImageGenerationResponse(
            text=result.get("text", ""),
            image_base64=image_base64
        )
    
    def text_to_speech(self, request: TextToSpeechRequest) -> TextToSpeechResponse:
        """
        Genera el audio, lo construye como un archivo WAV válido en memoria,
        lo codifica a Base64 y opcionalmente lo guarda en el servidor.
        """
        # Obtiene los datos de audio crudos (PCM) del proveedor
        pcm_audio_bytes = self.llm_provider.generate_speech(
            text=request.text,
            voice_name=request.voice_name,
            model=request.model
        )
        if not pcm_audio_bytes:
            raise ValueError("El modelo no generó audio.")
        
        # Crea un buffer de bytes en memoria para actuar como un archivo.
        mem_wav = io.BytesIO()

        # Usa el módulo 'wave' para escribir en el buffer de memoria.
        with wave.open(mem_wav, "wb") as wf:
            wf.setnchannels(1)       # Mono
            wf.setsampwidth(2)       # 16-bit PCM
            wf.setframerate(24000)   # 24kHz (estándar para la API de Google TTS)
            wf.writeframes(pcm_audio_bytes)
        
        # Obtén el contenido completo del archivo WAV desde el buffer de memoria.
        wav_file_bytes = mem_wav.getvalue()
        
        # Opcional: Si aún quieres guardar una copia en el servidor.
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.AUDIO_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(wav_file_bytes)
        print(f"[INFO] Archivo de audio guardado en: {filepath}")

        # Codifica el ARCHIVO WAV COMPLETO (no los datos crudos) a Base64.
        audio_base64 = base64.b64encode(wav_file_bytes).decode('utf-8')
        
        # Devuelve la respuesta con el Base64 correcto.
        return TextToSpeechResponse(
            audio_base64=audio_base64,
            filename=filename
        )

generation_service = GenerationService()