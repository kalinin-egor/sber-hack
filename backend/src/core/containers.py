from v1.auth.dependencies.auth_container import AuthContainer
from v1.animals.dependencies.animals_container import AnimalsContainer

from db.redis.dependencies import RedisContainer


def setup_containers():
    auth_container = AuthContainer()
    animals_container = AnimalsContainer()
    redis_container = RedisContainer()

    common_packages = [
        "v1.auth.router",
        "v1.auth.service",
        "v1.animals.router",
        "v1.animals.service",
    ]

    auth_container.wire(packages=common_packages)
    animals_container.wire(packages=common_packages)
    redis_container.wire(packages=common_packages)
