from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import torch
import torchaudio
import logging
from gigachat import GigaChat


logger = logging.getLogger(__name__)


def transcribe_russian_audio(audio_path: str) -> str:
    """
    Транскрибация русского аудио в текст
    
    Args:
        audio_path (str): путь к аудиофайлу
    
    Returns:
        str: распознанный текст
    """
    try:
        # Загрузка и подготовка аудио
        wav, sr = torchaudio.load(audio_path)
        wav = torchaudio.functional.resample(wav, sr, 16000)
        if wav.dim() > 1:
            wav = wav.mean(dim=0)  # Стерео в моно

        # Загрузка модели для русского языка
        model_name = "bond005/wav2vec2-large-ru-golos"
        processor = Wav2Vec2Processor.from_pretrained(model_name)
        model = Wav2Vec2ForCTC.from_pretrained(model_name)
        model.eval()

        # Обработка аудио
        inputs = processor(wav, sampling_rate=16000, return_tensors="pt", padding=True)

        # Распознавание
        with torch.no_grad():
            logits = model(**inputs).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = processor.batch_decode(predicted_ids)

        return transcription[0]
    
    except Exception as e:
        logger.error(f"Error during audio transcription: {e}")
        return f"Ошибка при транскрибации аудио: {str(e)}"


def pasre_text(text: str) -> bool:
    with GigaChat(
        credentials="ZmZmNTVkNWMtMGZhNS00OTE2LWE0ZTAtNzIxNGY4ZWUyNGM5OjcxNDdmZGIyLTAxZTYtNGU2Yy04NWYzLTFlMDQ4YzU4OTZlNA==",
        verify_ssl_certs=False
    ) as giga:
        response = giga.chat("Привет, как дела?")
        print(response.choices[0].message.content)
