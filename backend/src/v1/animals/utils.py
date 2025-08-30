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
        logger.info(f"torchaudio.load successful: shape={wav.shape}, sr={sr}")
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
                    
                    # Конвертируем в torch tensor с правильной размерностью
                    if n_channels == 2:
                        audio_array = audio_array.reshape(-1, 2)
                        wav = torch.from_numpy(audio_array).T  # [2, time]
                    else:
                        wav = torch.from_numpy(audio_array).unsqueeze(0)  # [1, time]
                    
                    logger.info(f"wave fallback successful: shape={wav.shape}, sr={sr}")
                    return wav, sr
        except Exception as wave_error:
            logger.warning(f"wave fallback failed: {wave_error}")
        
        # Fallback: используем ffmpeg для конвертации
        try:
            logger.info(f"Attempting ffmpeg conversion for file: {audio_path}")
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
        logger.info(f"Converting {audio_path} to WAV format...")
        
        # Конвертируем в WAV с помощью ffmpeg
        cmd = [
            'ffmpeg', '-i', audio_path,
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ar', '16000',          # 16kHz sample rate
            '-ac', '1',              # mono
            '-y',                    # overwrite output
            temp_wav_path
        ]
        
        logger.info(f"Running ffmpeg command: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode != 0:
            logger.error(f"ffmpeg stderr: {result.stderr}")
            logger.error(f"ffmpeg stdout: {result.stdout}")
            raise Exception(f"ffmpeg conversion failed: {result.stderr}")
        
        # Проверяем что файл создался
        if not os.path.exists(temp_wav_path):
            raise Exception("ffmpeg did not create output file")
        
        file_size = os.path.getsize(temp_wav_path)
        logger.info(f"Converted file created: {temp_wav_path} ({file_size} bytes)")
        
        # Загружаем конвертированный WAV файл
        with wave.open(temp_wav_path, 'rb') as wav_file:
            n_frames = wav_file.getnframes()
            audio_data = wav_file.readframes(n_frames)
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            audio_array = audio_array.astype(np.float32) / 32768.0  # normalize to [-1, 1]
            
            # Создаем тензор с правильной размерностью [channels, time]
            wav = torch.from_numpy(audio_array).unsqueeze(0)  # [1, time] для моно
            sr = 16000
        
        logger.info(f"Successfully loaded converted audio: shape={wav.shape}, sr={sr}")
        return wav, sr
        
    except subprocess.TimeoutExpired:
        logger.error("ffmpeg conversion timed out")
        raise Exception("Audio conversion timed out")
    except Exception as e:
        logger.error(f"Error during ffmpeg conversion: {e}")
        raise
    finally:
        # Удаляем временный файл
        if os.path.exists(temp_wav_path):
            try:
                os.unlink(temp_wav_path)
                logger.info(f"Cleaned up temporary file: {temp_wav_path}")
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {temp_wav_path}: {e}")


def transcribe_russian_audio(audio_path: str) -> str:
    """
    Транскрибация русского аудио в текст
    
    Args:
        audio_path (str): путь к аудиофайлу
    
    Returns:
        str: распознанный текст
    """
    try:
        logger.info(f"Starting transcription for file: {audio_path}")
        
        # Проверяем что файл существует
        if not os.path.exists(audio_path):
            raise Exception(f"Audio file not found: {audio_path}")
        
        file_size = os.path.getsize(audio_path)
        logger.info(f"Audio file size: {file_size} bytes")
        
        if file_size == 0:
            raise Exception("Audio file is empty")
        
        # Загрузка и подготовка аудио с улучшенной обработкой ошибок
        wav, sr = load_audio_file(audio_path)
        
        logger.info(f"Audio loaded successfully: shape={wav.shape}, sample_rate={sr}")
        
        # Проверяем минимальную длительность (например, 0.5 секунды)
        duration = wav.shape[-1] / sr
        if duration < 0.5:
            raise Exception(f"Audio file too short: {duration:.2f} seconds (minimum 0.5 seconds)")
        
        logger.info(f"Audio duration: {duration:.2f} seconds")
        
        # Ресемплинг если необходимо
        if sr != 16000:
            logger.info(f"Resampling from {sr}Hz to 16000Hz")
            wav = torchaudio.functional.resample(wav, sr, 16000)
        
        # Конвертация стерео в моно если необходимо
        if wav.dim() > 1 and wav.size(0) > 1:
            logger.info("Converting stereo to mono")
            wav = wav.mean(dim=0, keepdim=True)
        
        # Исправляем размерность тензора для модели Wav2Vec2
        # Модель ожидает: [batch_size, channels, time] или [channels, time]
        if wav.dim() == 1:
            # [time] -> [1, time]
            wav = wav.unsqueeze(0)
        elif wav.dim() == 2:
            # [channels, time] - это правильно
            pass
        elif wav.dim() == 3:
            # [batch, channels, time] - берем первый batch
            wav = wav.squeeze(0)
        elif wav.dim() == 4:
            # [batch, channels, time, features] - неправильная размерность
            # Берем первый batch и убираем последнюю размерность
            wav = wav.squeeze(0).squeeze(-1)
        
        # Убеждаемся что у нас правильная размерность [channels, time]
        if wav.dim() != 2:
            raise Exception(f"Invalid audio tensor shape after processing: {wav.shape}")
        
        logger.info(f"Final audio tensor shape: {wav.shape}")

        # Загрузка модели для русского языка
        logger.info("Loading Wav2Vec2 model...")
        model_name = "bond005/wav2vec2-large-ru-golos"
        processor = Wav2Vec2Processor.from_pretrained(model_name)
        model = Wav2Vec2ForCTC.from_pretrained(model_name)
        model.eval()
        logger.info("Model loaded successfully")

        # Обработка аудио
        logger.info("Processing audio with model...")
        inputs = processor(wav, sampling_rate=16000, return_tensors="pt", padding=True)

        # Распознавание
        logger.info("Performing transcription...")
        with torch.no_grad():
            logits = model(**inputs).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = processor.batch_decode(predicted_ids)

        result = transcription[0]
        logger.info(f"Transcription completed: {result[:100]}...")
        
        return result
    
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
