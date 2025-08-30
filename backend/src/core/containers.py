from v1.auth.dependencies.auth_container import AuthContainer

from db.redis.dependencies import RedisContainer


def setup_containers():
    auth_container = AuthContainer()
    redis_container = RedisContainer()

    common_packages = [
        "v1.auth.router",
        "v1.auth.service",
    ]

    auth_container.wire(packages=common_packages)
    redis_container.wire(packages=common_packages)
