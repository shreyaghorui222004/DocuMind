import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _strong(p: str) -> str:
    if len(p) < 8 or not re.search(r"[A-Za-z]", p) or not re.search(r"\d", p):
        raise ValueError("Password must be at least 8 characters and include a letter and a number")
    return p


class SignupIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(max_length=128)

    _pw = field_validator("password")(_strong)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)
    remember_me: bool = False


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: str = Field(max_length=128)

    _pw = field_validator("new_password")(_strong)


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    profile_picture: str | None = Field(default=None, max_length=500)


class PasswordChange(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(max_length=128)

    _pw = field_validator("new_password")(_strong)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    email: EmailStr
    profile_picture: str | None
    created_at: datetime
