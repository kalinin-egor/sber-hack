from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import torch
import torchaudio
import logging
from gigachat import GigaChat
import os
import subprocess
import tempfile
import wave
import numpy as np


logger = logging.getLogger(__name__)


def load_audio_file(audio_path: str) -> tuple[torch.Tensor, int]:
    """
    Загружает аудиофайл с fallback методами для различных форматов
    
    Args:
        audio_path (str): путь к аудиофайлу
    
    Returns:
        tuple[torch.Tensor, int]: (аудио данные, частота дискретизации)
    """
    try:
        # Попытка загрузки через torchaudio
        wav, sr = torchaudio.load(audio_path)
        return wav, sr
    except Exception as e:
        logger.warning(f"torchaudio.load failed: {e}")
        
        # Fallback: используем wave для WAV файлов
        try:
            if audio_path.lower().endswith('.wav'):
                with wave.open(audio_path, 'rb') as wav_file:
                    # Получаем параметры
                    n_channels = wav_file.getnchannels()
                    sample_width = wav_file.getsampwidth()
                    sr = wav_file.getframerate()
                    n_frames = wav_file.getnframes()
                    
                    # Читаем данные
                    audio_data = wav_file.readframes(n_frames)
                    
                    # Конвертируем в numpy array
                    if sample_width == 2:  # 16-bit
                        audio_array = np.frombuffer(audio_data, dtype=np.int16)
                    elif sample_width == 4:  # 32-bit
                        audio_array = np.frombuffer(audio_data, dtype=np.int32)
                    else:  # 8-bit
                        audio_array = np.frombuffer(audio_data, dtype=np.uint8)
                    
                    # Нормализуем
                    audio_array = audio_array.astype(np.float32) / (2**(sample_width*8-1))
                    
                    # Конвертируем в torch tensor
                    if n_channels == 2:
                        audio_array = audio_array.reshape(-1, 2)
                        wav = torch.from_numpy(audio_array).T
                    else:
                        wav = torch.from_numpy(audio_array).unsqueeze(0)
                    
                    return wav, sr
        except Exception as wave_error:
            logger.warning(f"wave fallback failed: {wave_error}")
        
        # Fallback: используем ffmpeg для конвертации
        try:
            return _convert_with_ffmpeg(audio_path)
        except Exception as ffmpeg_error:
            logger.error(f"ffmpeg fallback failed: {ffmpeg_error}")
            raise Exception(f"Failed to load audio file {audio_path} with all available methods")


def _convert_with_ffmpeg(audio_path: str) -> tuple[torch.Tensor, int]:
    """
    Конвертирует аудиофайл в WAV с помощью ffmpeg
    
    Args:
        audio_path (str): путь к исходному аудиофайлу
    
    Returns:
        tuple[torch.Tensor, int]: (аудио данные, частота дискретизации)
    """
    # Создаем временный WAV файл
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
        temp_wav_path = temp_wav.name
    
    try:
        # Конвертируем в WAV с помощью ffmpeg
        cmd = [
            'ffmpeg', '-i', audio_path,
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ar', '16000',          # 16kHz sample rate
            '-ac', '1',              # mono
            '-y',                    # overwrite output
            temp_wav_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"ffmpeg conversion failed: {result.stderr}")
        
        # Загружаем конвертированный WAV файл
        with wave.open(temp_wav_path, 'rb') as wav_file:
            n_frames = wav_file.getnframes()
            audio_data = wav_file.readframes(n_frames)
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_array = audio_array.astype(np.float32) / 32768.0  # normalize to [-1, 1]
            wav = torch.from_numpy(audio_array).unsqueeze(0)
            sr = 16000
        
        return wav, sr
        
    finally:
        # Удаляем временный файл
        if os.path.exists(temp_wav_path):
            os.unlink(temp_wav_path)


def transcribe_russian_audio(audio_path: str) -> str:
    """
    Транскрибация русского аудио в текст
    
    Args:
        audio_path (str): путь к аудиофайлу
    
    Returns:
        str: распознанный текст
    """
    try:
        # Загрузка и подготовка аудио с улучшенной обработкой ошибок
        wav, sr = load_audio_file(audio_path)
        
        # Ресемплинг если необходимо
        if sr != 16000:
            wav = torchaudio.functional.resample(wav, sr, 16000)
        
        # Конвертация стерео в моно если необходимо
        if wav.dim() > 1 and wav.size(0) > 1:
            wav = wav.mean(dim=0, keepdim=True)
        
        # Убеждаемся что размерность правильная
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)

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


def parse_text(text: str) -> dict:
    """
    Анализ текста с помощью GigaChat для извлечения данных о животном
    
    Args:
        text (str): транскрибированный текст для анализа
    
    Returns:
        dict: структурированные данные о животном
    """
    try:
        # Создаем промпт для анализа
        prompt = f"""
Проанализируй следующий текст о животном и извлеки информацию в формате JSON.
Текст: "{text}"

Верни ответ в следующем JSON формате:
{{
    "behavior_state": "описание поведения и состояния животного с историей",
    "measurements": {{
        "weight": "вес в кг или null если не указан",
        "temperature": "температура в градусах или null если не указана",
        "height": "рост/высота или null если не указан",
        "other_measurements": "другие измерения если есть"
    }},
    "feeding_details": {{
        "food_type": "тип пищи",
        "quantity": "количество корма",
        "feeding_time": "время кормления если указано",
        "appetite": "описание аппетита"
    }},
    "relationships": {{
        "interactions": "взаимодействия с другими животными",
        "social_behavior": "социальное поведение",
        "dominance": "доминантность или подчиненность",
        "conflicts": "конфликты если есть"
    }}
}}

Если какая-то информация отсутствует в тексте, укажи null или пустую строку. Отвечай только JSON без дополнительного текста.
"""

        with GigaChat(
            credentials="ZmZmNTVkNWMtMGZhNS00OTE2LWE0ZTAtNzIxNGY4ZWUyNGM5OjcxNDdmZGIyLTAxZTYtNGU2Yy04NWYzLTFlMDQ4YzU4OTZlNA==",
            verify_ssl_certs=False
        ) as giga:
            response = giga.chat(prompt)
            response_text = response.choices[0].message.content
            
            # Пытаемся парсить JSON из ответа
            try:
                import json
                # Ищем JSON в ответе (может быть обернут в дополнительный текст)
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    parsed_data = json.loads(json_str)
                    return parsed_data
                else:
                    logger.warning(f"No valid JSON found in GigaChat response: {response_text}")
                    return _create_default_response()
                    
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from GigaChat response: {e}")
                logger.error(f"Response text: {response_text}")
                return _create_default_response()
                
    except Exception as e:
        logger.error(f"Error during text analysis with GigaChat: {e}")
        return _create_default_response()


def _create_default_response() -> dict:
    """Создает ответ по умолчанию при ошибке анализа"""
    return {
        "behavior_state": "Не удалось проанализировать поведение",
        "measurements": {
            "weight": None,
            "temperature": None,
            "height": None,
            "other_measurements": None
        },
        "feeding_details": {
            "food_type": None,
            "quantity": None,
            "feeding_time": None,
            "appetite": None
        },
        "relationships": {
            "interactions": None,
            "social_behavior": None,
            "dominance": None,
            "conflicts": None
        }
    }
