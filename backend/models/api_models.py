from pydantic import BaseModel, Field
from typing import List, Optional, Any
from .site_config import SiteSettings, WorkflowConfig, WorkflowStep

class GlobalSettings(BaseModel):
    gemini_api_key: Optional[str] = None
    default_proxy: Optional[str] = None
    default_proxy_username: Optional[str] = None
    default_proxy_password: Optional[str] = None

class SiteResponse(BaseModel):
    domain: str
    settings: SiteSettings
    workflow_count: int

class WorkflowResponse(BaseModel):
    workflow_id: str
    workflow_name: str
    workflow_description: str
    start_url: str
    steps_count: int
    heal_count: int
    last_successful_run: Optional[str] = None

class RunWorkflowRequest(BaseModel):
    headless: bool = True
    screenshot_on_fail: bool = True

class RunWorkflowResponse(BaseModel):
    status: str = Field(description="'success' or 'error'")
    message: str
    logs_url: str
    screenshots: List[str] = []

class CreateSiteRequest(BaseModel):
    domain: str

class GenerateWorkflowRequest(BaseModel):
    workflow_name: str
    workflow_description: str
    start_url: str

class AutoSetupRequest(BaseModel):
    capabilities: str

class ErrorResponse(BaseModel):
    detail: str
