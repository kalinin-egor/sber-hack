from fastapi import HTTPException, status


class DBException(HTTPException):
    """Base database exception"""

    def __init__(self, detail: str = "Database error"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class DoesNotExist(HTTPException):
    """Exception for when a requested object doesn't exist"""

    def __init__(self, detail: str = "Object not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
