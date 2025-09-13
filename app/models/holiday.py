from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text
from sqlalchemy.sql import func
from app.database import Base


class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=True)  # Recurring yearly holidays
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Holiday(id={self.id}, date='{self.date}', name='{self.name}')>"







