import os
import json
import logging
from typing import List, Optional
from backend.models.site_config import WorkflowConfig, SiteSettings
from backend.models.api_models import GlobalSettings

logger = logging.getLogger(__name__)

def get_sites_dir() -> str:
    from backend.config import settings
    return settings.SITES_DIR

def ensure_dir(path: str):
    if not os.path.exists(path):
        os.makedirs(path)

def get_global_settings() -> GlobalSettings:
    path = os.path.join(get_sites_dir(), "global_settings.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return GlobalSettings.model_validate_json(f.read())
    return GlobalSettings()

def save_global_settings(settings: GlobalSettings):
    path = os.path.join(get_sites_dir(), "global_settings.json")
    ensure_dir(get_sites_dir())
    with open(path, "w") as f:
        f.write(settings.model_dump_json(indent=2))

def list_sites() -> List[str]:
    sites_dir = get_sites_dir()
    if not os.path.exists(sites_dir):
        return []
    sites = []
    for d in os.listdir(sites_dir):
        if os.path.isdir(os.path.join(sites_dir, d)):
            sites.append(d)
    return sites

def get_site_settings(domain: str) -> SiteSettings:
    path = os.path.join(get_sites_dir(), domain, "site_settings.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return SiteSettings.model_validate_json(f.read())
    return SiteSettings(domain=domain)

def list_workflows(domain: str) -> List[WorkflowConfig]:
    workflows_dir = os.path.join(get_sites_dir(), domain, "workflows")
    if not os.path.exists(workflows_dir):
        return []
    workflows = []
    for f in os.listdir(workflows_dir):
        if f.endswith(".json"):
            with open(os.path.join(workflows_dir, f), "r") as file:
                workflows.append(WorkflowConfig.model_validate_json(file.read()))
    return workflows

def save_workflow(domain: str, workflow: WorkflowConfig):
    workflows_dir = os.path.join(get_sites_dir(), domain, "workflows")
    ensure_dir(workflows_dir)
    path = os.path.join(workflows_dir, f"{workflow.workflow_id}.json")
    with open(path, "w") as f:
        f.write(workflow.model_dump_json(indent=2))
