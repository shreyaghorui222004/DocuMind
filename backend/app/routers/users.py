from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import PasswordChange, ProfileUpdate, UserOut
from app.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserOut)
def update_me(body: ProfileUpdate, user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    user.full_name = body.full_name.strip()
    user.profile_picture = body.profile_picture
    db.commit()
    return user


@router.put("/me/password")
def change_password(body: PasswordChange, user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(body.new_password)
    user.token_version += 1  # signs out other sessions; client should log in again
    db.commit()
    return {"message": "Password changed. Please log in again."}
