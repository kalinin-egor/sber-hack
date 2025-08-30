#!/usr/bin/env python3
"""
Тестовый скрипт для проверки функций обработки аудио
"""

import sys
import os
sys.path.append('src')

from v1.animals.utils import parse_text

def test_parse_text():
    """Тест функции парсинга текста"""
    test_text = """
    Сегодня наблюдал за коровой Мурка. Она весит примерно 450 кг, температура тела 38.5 градусов.
    Корова съела 15 кг сена и 5 кг комбикорма утром. Аппетит хороший.
    Взаимодействует дружелюбно с другими коровами в стаде, особенно с Буренкой.
    Поведение спокойное, жует жвачку, периодически мычит.
    """
    
    print("Тестируем функцию parse_text...")
    print(f"Входной текст: {test_text}")
    
    try:
        result = parse_text(test_text)
        print("\nРезультат анализа:")
        print(f"Поведение: {result.get('behavior_state')}")
        print(f"Измерения: {result.get('measurements')}")
        print(f"Кормление: {result.get('feeding_details')}")
        print(f"Взаимоотношения: {result.get('relationships')}")
        return True
    except Exception as e:
        print(f"Ошибка при тестировании: {e}")
        return False

if __name__ == "__main__":
    print("=== Тест обработки аудио ===")
    success = test_parse_text()
    
    if success:
        print("\n✅ Тест прошел успешно!")
    else:
        print("\n❌ Тест не прошел")
        sys.exit(1)
