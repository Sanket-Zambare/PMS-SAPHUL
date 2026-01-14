from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from app.database import Base

class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('user_id', 'role_id', name='pk_user_roles'),
    )


