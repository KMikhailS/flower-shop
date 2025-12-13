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
    image_urls: list[str] = []


class GoodDTO(BaseModel):
    """Data transfer object for public goods listing"""
    id: int
    name: str
    category: str
    price: int
    description: str
    image_urls: list[str] = []
    status: str


class ShopAddressDTO(BaseModel):
    """Data transfer object for shop addresses"""
    id: int
    address: str


class ShopAddressRequest(BaseModel):
    """Request model for creating or updating a shop address"""
    address: str
