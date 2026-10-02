"""
Database schema model definitions.
Prepared for future PostgreSQL expansion (users, api_keys, jobs, uploads, exports, usage_logs).
Runs in local serverless/in-memory mode for MVP without requiring external database servers.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class UserRecord(BaseModel):
    id: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tier: str = "free"
    credits: int = 100

class ApiKeyRecord(BaseModel):
    id: str
    user_id: str
    key_hash: str
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class ProcessJobRecord(BaseModel):
    id: str
    status: str  # pending, processing, completed, failed
    preset: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    input_file: str
    output_files: list[str] = []

class UsageLogRecord(BaseModel):
    id: str
    endpoint: str
    duration_ms: float
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    client_ip: Optional[str] = None
