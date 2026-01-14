from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from app.database import Base

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('role_id', 'permission_id', name='pk_role_permissions'),
    )


