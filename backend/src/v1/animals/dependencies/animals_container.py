from dependency_injector import containers, providers

from v1.animals.config import AnimalsServiceConfig
from v1.animals.service import AnimalsService


class AnimalsContainer(containers.DeclarativeContainer):
    animals_service = providers.Factory(AnimalsService, AnimalsServiceConfig())
