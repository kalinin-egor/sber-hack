from dependency_injector import containers, providers

from v1.auth.config import AuthServiceConfig
from v1.auth.service import AuthService


class AuthContainer(containers.DeclarativeContainer):
    auth_service = providers.Factory(AuthService, AuthServiceConfig())
