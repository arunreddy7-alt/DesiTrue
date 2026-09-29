from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User


security = HTTPBearer(
    auto_error=False,
)
optional_security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Get the authenticated user from the JWT token.
    """

    if not credentials:
        return None

    token = credentials.credentials
    
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    return user


def require_owner(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Allow only the platform owner.
    """

    if current_user.role != "OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required.",
        )

    return current_user


def require_restaurant_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Allow only restaurant administrators.
    """

    if current_user.role != "RESTAURANT_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant admin access required.",
        )

    if current_user.restaurant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant admin is not assigned to a restaurant.",
        )

    return current_user


def require_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Allow any authenticated user.
    """

    return current_user


def check_restaurant_access(
    restaurant_id: int,
    current_user: User,
) -> None:
    """
    Verify that the current user can access a restaurant.

    OWNER:
        Can access every restaurant.

    RESTAURANT_ADMIN:
        Can access only their assigned restaurant.
    """

    if current_user.role == "OWNER":
        return

    if current_user.role == "RESTAURANT_ADMIN":
        if current_user.restaurant_id != restaurant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this restaurant.",
            )

        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this resource.",
    )
def require_restaurant_access(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Verify that the authenticated user can access
    the requested restaurant.

    OWNER:
        Can access any restaurant.

    RESTAURANT_ADMIN:
        Can access only their assigned restaurant.
    """

    if current_user.role == "OWNER":
        return current_user

    if current_user.role != "RESTAURANT_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this restaurant.",
        )

    if current_user.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this restaurant.",
        )

    return current_user
def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    return user