from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class SelectorFingerprint(BaseModel):
    """Multi-attribute element fingerprint for self-healing."""
    tag: str = Field(description="HTML tag name (e.g., 'button', 'input')")
    id: Optional[str] = Field(None, description="Element ID attribute")
    classes: List[str] = Field(default_factory=list, description="CSS class list")
    aria_label: Optional[str] = Field(None, description="ARIA label text")
    text_content: Optional[str] = Field(None, description="Visible text content")
    role: Optional[str] = Field(None, description="ARIA role")
    placeholder: Optional[str] = Field(None, description="Input placeholder")
    name: Optional[str] = Field(None, description="Name attribute")

class ElementSelector(BaseModel):
    """Resilient element selector with fallback chain."""
    element_name: str = Field(description="Human-readable element identifier")
    primary: str = Field(description="Primary CSS selector")
    fallbacks: List[str] = Field(default_factory=list, description="Fallback selectors: XPath, aria, text")
    fingerprint: SelectorFingerprint = Field(description="Multi-attribute fingerprint for healing")

class WorkflowStep(BaseModel):
    """Single step in an automation workflow."""
    step_number: int
    action: Literal["navigate", "click", "type", "select", "wait", "scroll", "screenshot", "extract"]
    description: str = Field(description="Human-readable description of this step")
    target: Optional[ElementSelector] = Field(None, description="Target element (not needed for navigate/wait)")
    value: Optional[str] = Field(None, description="Value to type, URL to navigate to, option to select")
    wait_after_ms: int = Field(default=1000, description="Wait time after action in ms")
    screenshot_after: bool = Field(default=False, description="Take screenshot after this step")

class WorkflowConfig(BaseModel):
    """Complete workflow configuration — the core of the hybrid cache."""
    workflow_id: str = Field(description="Unique ID for the workflow")
    workflow_name: str = Field(description="Name of the automated workflow")
    workflow_description: str = Field(description="What this workflow does")
    start_url: str = Field(description="Starting URL for the workflow")
    steps: List[WorkflowStep] = Field(description="Ordered list of automation steps")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    version: int = Field(default=1, description="Config version, incremented on heal")
    heal_count: int = Field(default=0, description="Number of times auto-healed")
    last_successful_run: Optional[datetime] = None

class ProxyConfig(BaseModel):
    server: str
    username: Optional[str] = None
    password: Optional[str] = None

class SiteSettings(BaseModel):
    domain: str
    proxy: Optional[ProxyConfig] = None
    use_camoufox: bool = True
