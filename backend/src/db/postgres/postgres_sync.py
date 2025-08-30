from sqlalchemy.orm import sessionmaker
from common_models import Search, DecisionMaker, User, TaskOutput
from common_schemas import SearchSchema, DecisionMakerSchema, UserSchema, TaskOutputSchema
import logging
from .postgres_client import sync_engine


logger = logging.getLogger(__name__)
logger.info("Loading SyncDBHandler module")

SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine
)

class SyncDBHandler:
    """
    Синхронный класс для работы с базой данных без использования отдельных репозиториев.
    Предоставляет методы для работы с записями Search и DecisionMaker.
    """

    def __init__(self):
        self._session = SyncSessionLocal()

    def __enter__(self) -> "SyncDBHandler":
        return self

    def __exit__(self, exc_type, exc_value, tb):
        if exc_type:
            self._session.rollback()
        else:
            self._session.commit()
        self._session.close()

    # Методы для Search
    def add_search(self, search: Search) -> None:
        """Добавить новую запись Search."""
        new_search = Search(**search.model_dump())
        self._session.add(new_search)
        self._session.commit()

    def update_search_field(self, search_id: int, field: str, content: str) -> None:
        """Обновить значение указанного поля в записи Search."""
        search = self._session.query(Search).filter(Search.id == search_id).first()
        if not search:
            raise Exception(f"Search with ID {search_id} not found.")
        setattr(search, field, content)
        self._session.commit()

    def read_search(self, search_id: int):
        """Прочитать запись Search целиком."""
        search = self._session.query(Search).filter(Search.id == search_id).first()
        if not search:
            raise Exception(f"Search with ID {search_id} not found.")
        return search

    # Методы для DecisionMaker
    def add_decision_maker(self, decision_maker: DecisionMaker) -> None:
        """Добавить новую запись DecisionMaker."""
        self._session.add(decision_maker)
        self._session.commit()

    def update_decision_maker_field(self, decision_maker_id: int, field: str, content: str) -> None:
        """Обновить значение указанного поля в записи DecisionMaker."""
        dm = self._session.query(DecisionMaker).filter(DecisionMaker.id == decision_maker_id).first()
        if not dm:
            raise Exception(f"DecisionMaker with ID {decision_maker_id} not found.")
        setattr(dm, field, content)
        self._session.commit()

    def read_decision_maker(self, decision_maker_id: int):
        """Прочитать запись DecisionMaker целиком."""
        dm = self._session.query(DecisionMaker).filter(DecisionMaker.id == decision_maker_id).first()
        if not dm:
            raise Exception(f"DecisionMaker with ID {decision_maker_id} not found.")
        return dm

    # Методы для User
    def add_user(self, user: User) -> None:
        """Добавить новую запись User."""
        new_user = User(user)
        self._session.add(new_user)
        self._session.commit()

    def update_user_field(self, user_id: int, field: str, content: str) -> None:
        """Обновить значение указанного поля в записи User."""
        user = self._session.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception(f"User with ID {user_id} not found.")
        setattr(user, field, content)
        self._session.commit()

    def read_user(self, user_id: int):
        """Прочитать запись User целиком."""
        user = self._session.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception(f"User with ID {user_id} not found.")
        return user

    # Методы для TaskOutput
    def add_task_output(self, task_output: TaskOutput) -> None:
        """Добавить новую запись TaskOutput."""
        new_output = TaskOutput(task_output)
        self._session.add(new_output)
        self._session.commit()

    def update_task_output_field(self, task_output_id: int, field: str, content: str) -> None:
        """Обновить значение указанного поля в записи TaskOutput."""
        output = self._session.query(TaskOutput).filter(TaskOutput.id == task_output_id).first()
        if not output:
            raise Exception(f"TaskOutput with ID {task_output_id} not found.")
        setattr(output, field, content)
        self._session.commit()

    def read_task_output(self, task_output_id: int):
        """Прочитать запись TaskOutput целиком."""
        output = self._session.query(TaskOutput).filter(TaskOutput.id == task_output_id).first()
        if not output:
            raise Exception(f"TaskOutput with ID {task_output_id} not found.")
        return output
