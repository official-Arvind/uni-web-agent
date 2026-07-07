from pydantic import BaseModel, Field
from typing import List, Optional
from .site_config import WorkflowStep

class GeneratedWorkflow(BaseModel):
    """Schema used strictly to receive structured output from Gemini."""
    steps: List[WorkflowStep] = Field(description="The ordered steps required to automate the workflow.")
