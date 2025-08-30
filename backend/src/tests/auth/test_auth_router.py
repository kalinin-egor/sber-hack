import pytest
import jwt
from fastapi.testclient import TestClient
from v1.auth.config import AuthServiceConfig
from v1.auth.schemas import ConfirmRegisterSchema

from v1.auth.service import (
    InvalidEmailError, 
    UserAlreadyExistsError, 
    InvalidPasswordError, 
    UserNotFoundError
) 

from main import app  # Импортируем FastAPI-приложение
from core.containers import setup_containers
import datetime


setup_containers()
client = TestClient(app)

config = AuthServiceConfig()
ACCESS_TOKEN_EXPIRATION_MINUTES=config.ACCESS_TOKEN_EXPIRATION_MINUTES
REFRESH_TOKEN_EXPIRATION_DAYS=config.REFRESH_TOKEN_EXPIRATION_DAYS
SECRET_KEY=config.ACCESS_TOKEN_SECRET  # Укажи правильный секретный ключ, если JWT подписан

VALID_EMAIL="me@generext.com"
VALID_PASSWORD="1234567890"

ALGORITHM = "HS256"
VALID_CONFIRM_CODE = "32892734867823782"


def generate_mock_jwt():
    """Генерирует валидный тестовый JWT-токен"""
    payload = {
        "exp": datetime.datetime.now(datetime.UTC).replace(tzinfo=None) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRATION_MINUTES),
        "type": "temp"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def test_register_user_success(mocker):
    """✅ Успешная регистрация пользователя"""
    mock_auth_service = mocker.patch("v1.auth.service.AuthService.register_user")
    mock_auth_service.return_value = generate_mock_jwt()  # Используем валидный токен

    payload = {"email": "me@generext.com", "password": "1234567890"}
    response = client.post("/v1/auth/register", json=payload)

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}, Response: {response.text}"
    response_json = response.json()

    assert response_json["message"] == "Temp token generated"
    assert "data" in response_json and "token" in response_json["data"], "Response does not contain 'token' field"

    token = response_json["data"]["token"]

    # Проверяем формат токена
    assert isinstance(token, str), "Token is not a string"
    assert token.count(".") == 2, "Token is not a valid JWT format"

    # Декодируем токен с верификацией
    decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    # Проверяем содержимое токена
    assert "exp" in decoded_token, "Token does not contain 'exp'"
    assert "type" in decoded_token, "Token does not contain 'type'"
    assert decoded_token["type"] == "temp", "Token type is not 'temp'"


def test_register_user_invalid_email(mocker):
    """❌ Ошибка: некорректный email"""

    mock_auth_service = mocker.patch("v1.auth.service.AuthService.register_user")
    mock_auth_service.side_effect = InvalidEmailError("Invalid email format")

    payload = {"email": "invalid-email", "password": "1234567890"}

    response = client.post("/v1/auth/register", json=payload)

    assert response.status_code == 422, f"Unexpected status code: {response.status_code}, Response: {response.text}"
    response_json = response.json()
    assert response_json["detail"] == "Invalid email format", f"Unexpected error message: {response_json['detail']}"


def test_register_user_already_exists(mocker):
    """❌ Ошибка: пользователь уже существует"""

    mock_auth_service = mocker.patch("v1.auth.service.AuthService.register_user")
    mock_auth_service.side_effect = UserAlreadyExistsError("User already exists")

    payload = {"email": "existing@example.com", "password": "1234567890"}

    response = client.post("/v1/auth/register", json=payload)

    assert response.status_code == 409, f"Unexpected status code: {response.status_code}, Response: {response.text}"
    response_json = response.json()
    assert response_json["detail"] == "User already exists", f"Unexpected error message: {response_json['detail']}"



def generate_mock_tokens():
    """Генерирует валидные access и refresh токены"""
    access_payload = {
        "exp": datetime.datetime.now(datetime.UTC).replace(tzinfo=None) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRATION_MINUTES),
        "type": "access"
    }
    refresh_payload = {
        "exp": datetime.datetime.now(datetime.UTC).replace(tzinfo=None) + datetime.timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS),
        "type": "refresh"
    }
    return {
        "access_token": jwt.encode(access_payload, SECRET_KEY, algorithm=ALGORITHM),
        "refresh_token": jwt.encode(refresh_payload, SECRET_KEY, algorithm=ALGORITHM),
    }

def test_confirm_registration_success(mocker):
    """✅ Успешное подтверждение регистрации (верный `confirm_code`)"""

    # 1️⃣ Мок `register_user`, который возвращает `temp_token`
    mock_register_service = mocker.patch("v1.auth.service.AuthService.register_user")
    temp_token = generate_mock_jwt()
    mock_register_service.return_value = temp_token

    # 2️⃣ Вызываем `register_user`, чтобы получить `temp_token`
    register_payload = {"email": "me@generext.com", "password": "1234567890"}
    register_response = client.post("/v1/auth/register", json=register_payload)

    assert register_response.status_code == 200, f"Unexpected status code: {register_response.status_code}"
    temp_token = register_response.json()["data"]["token"]

    # Проверяем, что токен имеет правильную структуру
    decoded_temp = jwt.decode(temp_token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded_temp["type"] == "temp"

    # 3️⃣ Мок `confirm_register_user`, который возвращает `access` и `refresh` токены
    mock_confirm_service = mocker.patch("v1.auth.service.AuthService.confirm_register_user")
    mock_confirm_service.return_value = generate_mock_tokens()

    # 4️⃣ Отправляем `temp_token` + `confirm_code` на `/confirm-registration`
    confirm_payload = {"temp_token": temp_token, "confirm_code": VALID_CONFIRM_CODE}
    confirm_response = client.post("/v1/auth/confirm-registration", json=confirm_payload)

    # ➜ Проверяем, что запрос успешно обработан
    assert confirm_response.status_code == 200, f"Unexpected status code: {confirm_response.status_code}, Response: {confirm_response.text}"
    response_json = confirm_response.json()

    assert response_json["message"] == "Access and refresh tokens generated"
    assert "data" in response_json and "tokens" in response_json["data"], "Response does not contain 'tokens' field"

    tokens = response_json["data"]["tokens"]
    assert "access_token" in tokens and "refresh_token" in tokens, "Missing tokens"

    # Проверяем корректность JWT
    access_decoded = jwt.decode(tokens["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    refresh_decoded = jwt.decode(tokens["refresh_token"], SECRET_KEY, algorithms=[ALGORITHM])

    assert access_decoded["type"] == "access"
    assert refresh_decoded["type"] == "refresh"

    # ➜ Проверяем, что `confirm_register_user` вызван с правильными аргументами
    mock_confirm_service.assert_called_once_with(ConfirmRegisterSchema(temp_token=temp_token, confirm_code=VALID_CONFIRM_CODE))


def test_confirm_registration_user_not_found(mocker):
    """❌ Ошибка 404: Пользователь не найден"""
    mock_confirm_service = mocker.patch("v1.auth.service.AuthService.confirm_register_user")
    mock_confirm_service.side_effect = UserNotFoundError("User not found")

    confirm_payload = {"temp_token": "invalid_temp_token", "confirm_code": VALID_CONFIRM_CODE}
    response = client.post("/v1/auth/confirm-registration", json=confirm_payload)

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_confirm_registration_invalid_code(mocker):
    """❌ Ошибка 401: Неверный код подтверждения"""
    mock_confirm_service = mocker.patch("v1.auth.service.AuthService.confirm_register_user")
    mock_confirm_service.side_effect = InvalidPasswordError("Invalid confirmation code")

    confirm_payload = {"temp_token": "valid_temp_token", "confirm_code": "wrong_code"}
    response = client.post("/v1/auth/confirm-registration", json=confirm_payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid confirmation code"


def test_confirm_registration_unknown_error(mocker):
    """❌ Ошибка 400: Другая ошибка"""
    mock_confirm_service = mocker.patch("v1.auth.service.AuthService.confirm_register_user")
    mock_confirm_service.side_effect = Exception("Some error occurred")

    confirm_payload = {"temp_token": "valid_but_internal_error", "confirm_code": VALID_CONFIRM_CODE}
    response = client.post("/v1/auth/confirm-registration", json=confirm_payload)

    assert response.status_code == 400
    assert "Some error occurred" in response.json()["detail"]



@pytest.fixture
def mock_auth_service(mocker):
    """Фикстура для мока AuthService.login"""
    return mocker.patch("v1.auth.service.AuthService.login")

def test_login_success(mock_auth_service):
    """✅ Успешный логин пользователя"""
    mock_auth_service.return_value = generate_mock_tokens()

    payload = {"email": VALID_EMAIL, "password": VALID_PASSWORD}
    response = client.post("/v1/auth/login", json=payload)

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    response_json = response.json()

    assert "access_token" in response_json, "Missing 'access_token'"
    assert "refresh_token" in response_json, "Missing 'refresh_token'"

    access_decoded = jwt.decode(response_json["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    refresh_decoded = jwt.decode(response_json["refresh_token"], SECRET_KEY, algorithms=[ALGORITHM])

    assert access_decoded["type"] == "access"
    assert refresh_decoded["type"] == "refresh"

def test_login_user_not_found(mock_auth_service):
    """❌ Ошибка: пользователь не найден"""
    mock_auth_service.side_effect = UserNotFoundError("User not found")

    payload = {"email": "unknown@example.com", "password": VALID_PASSWORD}
    response = client.post("/v1/auth/login", json=payload)

    assert response.status_code == 404, f"Unexpected status code: {response.status_code}"
    assert response.json()["detail"] == "User not found"

def test_login_invalid_password(mock_auth_service):
    """❌ Ошибка: неверный пароль"""
    mock_auth_service.side_effect = InvalidPasswordError("Invalid password")

    payload = {"email": VALID_EMAIL, "password": "wrongpassword"}
    response = client.post("/v1/auth/login", json=payload)

    assert response.status_code == 401, f"Unexpected status code: {response.status_code}"
    assert response.json()["detail"] == "Invalid password"

def test_login_unknown_error(mock_auth_service):
    """❌ Ошибка: неизвестная ошибка сервера"""
    mock_auth_service.side_effect = Exception("Something went wrong")

    payload = {"email": VALID_EMAIL, "password": VALID_PASSWORD}
    response = client.post("/v1/auth/login", json=payload)

    assert response.status_code == 400, f"Unexpected status code: {response.status_code}"
    assert response.json()["detail"] == "Something went wrong"
