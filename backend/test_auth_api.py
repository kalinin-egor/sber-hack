#!/usr/bin/env python3
"""
Тестирование API аутентификации
"""

import requests
import json

BASE_URL = "http://localhost:8075"

def test_health():
    """Тест health check"""
    print("=== Тест Health Check ===")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def test_register():
    """Тест регистрации пользователя"""
    print("\n=== Тест регистрации ===")
    
    data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/auth/register",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Регистрация не удалась: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при регистрации: {e}")
        return None

def test_login():
    """Тест логина пользователя"""
    print("\n=== Тест логина ===")
    
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/v1/auth/login",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Логин не удался: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при логине: {e}")
        return None

def main():
    print("🧪 Тестирование API аутентификации")
    print(f"Base URL: {BASE_URL}")
    
    # 1. Проверяем здоровье сервиса
    if not test_health():
        print("❌ Сервис недоступен!")
        return
    
    print("✅ Сервис работает!")
    
    # 2. Пробуем зарегистрироваться
    register_result = test_register()
    
    # 3. Пробуем войти
    login_result = test_login()
    
    if login_result:
        print("✅ Аутентификация работает!")
    else:
        print("❌ Проблемы с аутентификацией!")

if __name__ == "__main__":
    main()
