from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..utils.db import Base
import uuid

class MedicalCodeParseResult(Base):
    __tablename__ = "medical_code_parse_result"

    medical_code_parse_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    user_id = Column(UUID(as_uuid=True), nullable=False) # ForeignKey("users.user_id") - avoiding circular import for now or need to handle carefully
    parse_result = Column(JSON, server_default='{}')
    is_draft = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
