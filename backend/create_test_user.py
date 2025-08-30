#!/usr/bin/env python3
"""
Скрипт для создания тестового пользователя
"""

import asyncio
import sys
import os
sys.path.append('src')

from v1.auth.utils import hash_password
from db.postgres.unit_of_work import UnitOfWork
from common_schemas import UserCreate

async def create_test_user():
    """Создание тестового пользователя"""
    
    email = "test@example.com"
    username = "testuser"
    password = "password123"
    
    print(f"Создаем тестового пользователя:")
    print(f"Email: {email}")
    print(f"Username: {username}")
    print(f"Password: {password}")
    
    try:
        async with UnitOfWork() as uow:
            # Проверяем, существует ли уже пользователь
            existing_user = await uow.users.select_user_by_email(email)
            if existing_user:
                print(f"❌ Пользователь с email {email} уже существует!")
                return False
            
            # Хешируем пароль
            password_hash = hash_password(password)
            
            # Создаем пользователя
            user_data = UserCreate(
                email=email,
                username=username,
                password_hash=password_hash
            )
            
            user_id = await uow.users.insert_one(user_data)
            await uow.commit()
            
            print(f"✅ Тестовый пользователь создан успешно!")
            print(f"User ID: {user_id}")
            print(f"Теперь можно войти с данными:")
            print(f"  Email: {email}")
            print(f"  Password: {password}")
            
            return True
            
    except Exception as e:
        print(f"❌ Ошибка при создании пользователя: {e}")
        return False

async def list_users():
    """Показать всех пользователей"""
    print("\n=== Список всех пользователей ===")
    
    try:
        async with UnitOfWork() as uow:
            # Получаем всех пользователей (метод может не существовать, попробуем через find_all)
            try:
                users = await uow.users.find_all()
            except AttributeError:
                print("❌ Метод find_all не найден в репозитории пользователей")
                return
            
            if not users:
                print("📭 Пользователей в базе данных нет")
                return
            
            for user in users:
                print(f"ID: {user.id}, Email: {user.email}, Username: {user.username}")
                
    except Exception as e:
        print(f"❌ Ошибка при получении пользователей: {e}")

if __name__ == "__main__":
    print("=== Управление тестовыми пользователями ===")
    
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        asyncio.run(list_users())
    else:
        asyncio.run(create_test_user())
        asyncio.run(list_users())
