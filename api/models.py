from pydantic import BaseModel
from typing import Optional


class UserInfoDTO(BaseModel):
    """User information data transfer object"""
    id: int
    role: str
    mode: str
    status: str


class GoodCardRequest(BaseModel):
    """Request model for creating a new good card"""
    name: str
    category: str
    price: int
    description: str
    image_url: Optional[str] = None


class GoodCardResponse(BaseModel):
    """Response model for good card"""
    id: int
    createstamp: str
    changestamp: str
    status: str
    name: str
    category: str
    price: int
    description: str
    image_url: Optional[str] = None


class GoodDTO(BaseModel):
    """Data transfer object for public goods listing"""
    id: int
    name: str
    category: str
    price: int
    description: str
    image_url: Optional[str] = None
