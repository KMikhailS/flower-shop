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
    non_discount_price: Optional[int] = None
    description: str


class ImageDTO(BaseModel):
    """Data transfer object for product images"""
    image_url: str
    display_order: int


class GoodDTO(BaseModel):
    """Data transfer object for public goods listing"""
    id: int
    name: str
    category: str
    price: int
    non_discount_price: Optional[int] = None
    description: str
    images: list[ImageDTO] = []
    status: str


class ShopAddressDTO(BaseModel):
    """Data transfer object for shop addresses"""
    id: int
    address: str


class ShopAddressRequest(BaseModel):
    """Request model for creating or updating a shop address"""
    address: str


class ImageReorderRequest(BaseModel):
    """Request model for reordering product images"""
    imageUrls: list[str]


class PromoBannerDTO(BaseModel):
    """Data transfer object for promo banners"""
    id: int
    status: str
    display_order: int
    image_url: str


class CategoryDTO(BaseModel):
    """Data transfer object for categories"""
    id: int
    title: str
    status: str


class CategoryRequest(BaseModel):
    """Request model for creating or updating a category"""
    title: str
