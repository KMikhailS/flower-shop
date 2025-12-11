from pydantic import BaseModel


class UserInfoDTO(BaseModel):
    """User information data transfer object"""
    id: int
    role: str
    mode: str
    status: str
