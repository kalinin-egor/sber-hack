from db.postgres.user.user_repository import UserRepository
from db.postgres.animal.animal_repository import AnimalRepository
from db.postgres.animal.transcription_repository import AnimalTranscriptionRepository

from db.postgres.postgres_client import session_maker


class UnitOfWork:
    users = UserRepository
    animals = AnimalRepository
    animal_transcriptions = AnimalTranscriptionRepository

    async def __aenter__(self) -> "UnitOfWork":
        self._session = await session_maker()
        self.users = UserRepository(self._session)
        self.animals = AnimalRepository(self._session)
        self.animal_transcriptions = AnimalTranscriptionRepository(self._session)
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.rollback()
        await self._session.close()

    async def commit(self):
        await self._session.commit()

    async def rollback(self):
        await self._session.rollback()
