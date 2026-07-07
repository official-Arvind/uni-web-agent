<p align="center">
  <img src="frontend/public/logo.png" alt="UNI WEB AGENT" width="80" height="80" style="border-radius: 16px;" />
</p>

<h1 align="center">🤖 UNI WEB AGENT</h1>

<p align="center">
  <strong>The Universal Hybrid Declarative Web Agent</strong><br/>
  <em>by <a href="https://github.com/official-Arvind">Arvind Ji</a> · Jigar Corporation Pvt Ltd</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.13-blue?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/vite-8-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/gemini-3.5_flash-8E75B2?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/playwright-stealth-2EAD33?style=for-the-badge&logo=playwright" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
</p>

---

## 🚀 What is UNI WEB AGENT?

A production-grade **Hybrid Declarative Web Agent** that uses AI (Gemini 3.5 Flash) *only once* to map a website's interactive workflow and generate a deterministic JSON config. All subsequent runs execute via **pure Playwright code with zero API tokens consumed**.

If the website's UI changes and breaks a selector, the agent **auto-heals** itself — it detects the failure, calls the AI to find the new selector, updates the config, and resumes seamlessly. No human intervention required.

### 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   UNI WEB AGENT                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │
│  │  AI Mapper   │──▶│  JSON Config │──▶│  Executor  │  │
│  │ (One-Time)   │   │  (Cached)    │   │ (Zero-Tok) │  │
│  └──────────────┘   └──────────────┘   └─────┬──────┘  │
│                                              │         │
│                                        ┌─────▼──────┐  │
│                                        │Auto-Healer │  │
│                                        │ (On-Error) │  │
│                                        └────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Live AI Copilot (Real-time)           │   │
│  │  Natural language → Browser actions via WebSocket│   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **⚡ Zero-Token Execution** | AI maps the workflow once → cached JSON → pure Playwright execution. Drastically cuts API costs. |
| **🩹 3-Tier Auto-Healing** | Primary CSS → XPath fallback → AI re-mapping. Broken selectors are automatically repaired. |
| **🤖 Live AI Copilot** | Natural language instructions → real-time browser automation via WebSocket streaming. |
| **🔮 Auto Setup with AI** | Point the agent at a domain and it will automatically deduce and generate all logical workflows. |
| **🕵️ Ultimate Stealth** | Powered by Playwright-Stealth to bypass advanced anti-bot protections (Cloudflare, DataDome, etc). |
| **🎨 Brutal Modern UI** | Dark mode, glassmorphism, neon accents, micro-animations, and a cyber-deck terminal interface. |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.13, FastAPI, Pydantic V2, Uvicorn |
| **AI** | Google Gemini 3.5 Flash (Structured Output) |
| **Browser** | Playwright + Stealth + Crawl4AI |
| **Frontend** | React 19, Vite 8 (Rolldown), Vanilla CSS |
| **Realtime** | WebSocket (FastAPI native) |

---

## 📦 Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier works!)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/official-Arvind/uni-web-agent.git
cd uni-web-agent

# Set up Python Backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Install browser drivers
playwright install
crawl4ai-setup

# Set up React Frontend
cd frontend
npm install
```

### 2. Run the Agent

**Terminal 1 — Backend:**
```bash
start_backend.bat
# Or manually:
# venv\Scripts\uvicorn backend.main:app --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser to **http://localhost:5173** 🚀

### 3. Quick Start Guide

1. ⚙️ Click **Settings** → Add your Gemini API Key
2. ➕ Click **Add New Site** → Enter a domain (e.g., `amazon.in`)
3. ✨ Click **Auto Setup with AI** → The AI automatically generates workflows
4. ▶️ Click **Run Now** → Watch the cached workflow execute with zero API tokens!
5. 🤖 Switch to **Live Copilot** → Type natural language commands to control a live browser

---

## 🖥️ Live Demo

> **[Try the Frontend UI →](https://official-arvind.github.io/uni-web-agent/)**
>
> *Note: The live demo shows the frontend interface only. To execute workflows, you must run the backend on your local machine.*

---

## 📁 Project Structure

```
uni-web-agent/
├── backend/
│   ├── api/            # FastAPI routes & WebSocket handlers
│   ├── core/           # AI Mapper, Auto-Healer, Execution Engine, Live Agent
│   ├── models/         # Pydantic V2 data schemas
│   ├── utils/          # File manager & helpers
│   ├── config.py       # Environment configuration
│   └── main.py         # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # React components (Dashboard, LiveCopilot, Modals...)
│   │   ├── App.jsx     # Root application component
│   │   └── index.css   # Brutal design system
│   └── public/         # Static assets
├── sites/              # Generated workflow configs (per-domain)
├── start_backend.bat   # Windows backend launcher with port management
├── requirements.txt    # Python dependencies
└── RELEASE_NOTES.md    # Changelog
```

---

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | `""` | Your Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.5-flash` | AI model to use |
| `SITES_DIR` | `./sites` | Directory to store workflow configs |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `HEADLESS` | `true` | Run browser in headless mode |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/official-Arvind">Arvind Ji</a> · Jigar Corporation Pvt Ltd</strong><br/>
  <em>Powered by Gemini 3.5 Flash · Playwright · FastAPI · React</em>
</p>
