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
