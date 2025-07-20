import base64, os
import uuid
import wave
from backend.llm_providers.factory import get_llm_provider
from backend.models.generation import ImageGenerationRequest, ImageGenerationResponse, TextToSpeechRequest, TextToSpeechResponse

class GenerationService:
    def __init__(self):
        self.llm_provider = get_llm_provider()
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
        Genera el audio y lo guarda en el servidor.
        Devuelve el nombre del archivo guardado.
        """
        audio_bytes = self.llm_provider.generate_speech(
            text=request.text,
            voice_name=request.voice_name,
            model=request.model
        )
        if not audio_bytes:
            raise ValueError("El modelo no generó audio.")
        
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.AUDIO_DIR, filename)
        
        self._save_audio_to_wav(filepath, audio_bytes)

        # 1. Codifica los bytes a Base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # 2. Devuelve el objeto de respuesta con el string Base64
        return TextToSpeechResponse(
            audio_base64=audio_base64,
            filename=filename
        )

generation_service = GenerationService()