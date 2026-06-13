from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import SessionLocal, UserProfile

SECRET_KEY = "change_this_secret_before_deployment"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated ="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def hash_password(password: str):
    return pwd_context(password)

def verify_password(password: str, password_hash: str):
    return pwd_context.verify(password, password_hash)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_error = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    db = SessionLocal()
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    db.close()

    if not user:
        raise credentials_error
    
    return user