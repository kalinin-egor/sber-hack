from gigachat import GigaChat
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class GigaChatClient:
    """Клиент для работы с GigaChat API"""
    
    def __init__(self, credentials: str):
        self.credentials = credentials
    
    async def analyze_audio_content(self, transcribed_text: str, context: Optional[str] = None) -> dict:
        """
        Анализ содержимого аудио с помощью GigaChat
        
        Args:
            transcribed_text: Расшифрованный текст из аудио
            context: Дополнительный контекст (например, тип животного)
        
        Returns:
            dict: Результат анализа с извлеченной информацией
        """
        try:
            prompt = self._build_analysis_prompt(transcribed_text, context)
            
            with GigaChat(
                credentials=self.credentials,
                verify_ssl_certs=False
            ) as giga:
                response = giga.chat(prompt)
                analysis_result = response.choices[0].message.content
                
                # Парсим ответ и структурируем данные
                return self._parse_analysis_result(analysis_result)
                
        except Exception as e:
            logger.error(f"Error during GigaChat analysis: {e}")
            return {
                "error": str(e),
                "behavior_state": "Ошибка анализа",
                "measurements": {},
                "feeding_details": {},
                "relationships": {}
            }
    
    def _build_analysis_prompt(self, transcribed_text: str, context: Optional[str] = None) -> str:
        """Построение промпта для анализа"""
        base_prompt = f"""
Проанализируй следующий текст, который был получен из аудиозаписи наблюдения за животным:

"{transcribed_text}"

{f"Контекст: {context}" if context else ""}

Извлеки и структурируй следующую информацию в формате JSON:
1. behavior_state - описание поведения и состояния животного
2. measurements - любые упоминания о физических параметрах (вес, размер, температура и т.д.)
3. feeding_details - информация о кормлении (что ест, сколько, когда)
4. relationships - взаимодействие с другими животными
5. health_indicators - признаки здоровья или болезни
6. activity_level - уровень активности животного

Отвечай только в формате JSON без дополнительных комментариев.
"""
        return base_prompt
    
    def _parse_analysis_result(self, analysis_result: str) -> dict:
        """Парсинг результата анализа от GigaChat"""
        try:
            import json
            # Пытаемся распарсить JSON ответ
            parsed_result = json.loads(analysis_result)
            
            # Проверяем наличие ключевых полей и добавляем значения по умолчанию
            return {
                "behavior_state": parsed_result.get("behavior_state", "Не определено"),
                "measurements": parsed_result.get("measurements", {}),
                "feeding_details": parsed_result.get("feeding_details", {}),
                "relationships": parsed_result.get("relationships", {}),
                "health_indicators": parsed_result.get("health_indicators", {}),
                "activity_level": parsed_result.get("activity_level", "Не определено")
            }
            
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON from GigaChat response: {analysis_result}")
            # Если не удается распарсить JSON, возвращаем базовую структуру
            return {
                "behavior_state": analysis_result[:200] if analysis_result else "Ошибка парсинга",
                "measurements": {},
                "feeding_details": {},
                "relationships": {},
                "health_indicators": {},
                "activity_level": "Не определено"
            }


def create_gigachat_client() -> GigaChatClient:
    """Фабричная функция для создания клиента GigaChat"""
    credentials = "ZmZmNTVkNWMtMGZhNS00OTE2LWE0ZTAtNzIxNGY4ZWUyNGM5OjcxNDdmZGIyLTAxZTYtNGU2Yy04NWYzLTFlMDQ4YzU4OTZlNA=="
    return GigaChatClient(credentials)


async def simple_chat(message: str) -> str:
    """
    Простая функция для общения с GigaChat
    
    Args:
        message: Сообщение для отправки
    
    Returns:
        str: Ответ от GigaChat
    """
    try:
        with GigaChat(
            credentials="ZmZmNTVkNWMtMGZhNS00OTE2LWE0ZTAtNzIxNGY4ZWUyNGM5OjcxNDdmZGIyLTAxZTYtNGU2Yy04NWYzLTFlMDQ4YzU4OTZlNA==",
            verify_ssl_certs=False
        ) as giga:
            response = giga.chat(message)
            return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error in simple_chat: {e}")
        return f"Ошибка при обращении к GigaChat: {str(e)}"
