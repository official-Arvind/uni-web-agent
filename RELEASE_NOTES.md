# 🚀 Release Notes — UNI WEB AGENT v1.0.0

**Release Date:** July 7, 2026  
**Author:** Arvind Ji · Jigar Corporation Pvt Ltd  
**Codename:** *BRUTALIST*

---

## 🎉 Highlights

This is the **initial public release** of UNI WEB AGENT — a production-grade Hybrid Declarative Web Agent that combines the intelligence of Google Gemini 3.5 Flash with the raw execution speed of Playwright.

### What's New

#### 🧠 Core Engine
- **Zero-Token Execution Engine** — AI maps a website once into a JSON workflow. All subsequent runs execute via pure Playwright code, consuming zero API tokens.
- **3-Tier Auto-Healing** — When a website changes its UI and breaks a selector, the agent automatically detects the failure, queries Gemini 3.5 Flash with a screenshot + DOM, and repairs the selector in-place.
- **AI Workflow Mapper** — Powered by Gemini 3.5 Flash with structured JSON output. Generates resilient CSS selectors, XPath fallbacks, and element fingerprints.
- **Auto Setup with AI** — Point the agent at any domain and click one button. The AI automatically deduces all logical workflows (search, login, add to cart, etc.) and generates them.

#### 🤖 Live AI Copilot
- **Natural Language Browser Control** — Type instructions like "Go to amazon.in and search for headphones under ₹500" and watch the AI execute them in real-time via WebSocket streaming.
- **Live Browser View** — See exactly what the AI sees with a real-time screenshot feed streamed over WebSocket.
- **Smart Element Targeting** — The copilot injects unique `jigar-id` attributes into all interactive elements for precise targeting.

#### 🎨 Brutal Modern UI
- **Dark Mode Glassmorphism** — Deep space blacks (#000000), hot pink (#ff007f) and violet (#7c3aed) neon accents, multi-layered glowing shadows.
- **Cyber-Deck Terminal** — The Live Copilot features a futuristic terminal-style interface with scanline effects, monospace typography, and distinct visual blocks for user/AI/system messages.
- **Micro-Animations** — Smooth fade-ins, hover scaling, floating elements, gradient text panning, and bouncing modal entrances.
- **Floating Glass Navbar** — Pill-shaped, backdrop-blurred navigation bar with glowing active tab indicators.

#### 🕵️ Stealth & Anti-Detection
- **Playwright-Stealth Integration** — Automatically patches browser fingerprints to bypass Cloudflare, DataDome, and similar anti-bot systems.
- **Custom User Agent Rotation** — Mimics real Chrome browser signatures.

#### ⚙️ Backend Architecture
- **FastAPI + Pydantic V2** — Modern async Python backend with strict schema validation.
- **Structured Logging** — Rich, prefixed log messages (`[AI_MAPPER]`, `[AUTO_HEALER]`, `[LIVE_AGENT]`) for easy debugging.
- **Exponential Backoff** — All Gemini API calls feature 5-retry exponential backoff (5s → 10s → 20s → 40s → 80s) to survive rate limits and demand spikes.
- **Windows ProactorEventLoop** — Native support for Playwright's async requirements on Windows.

#### 🌐 Deployment
- **GitHub Pages Frontend** — The static frontend UI is deployed to GitHub Pages for public preview.
- **Local Backend Required** — Users run the Python backend on their own machine for full functionality.

---

## 🔧 Technical Details

| Component | Version |
|-----------|---------|
| Python | 3.13 |
| FastAPI | latest |
| Pydantic | V2 |
| React | 19 |
| Vite | 8 (Rolldown) |
| Gemini Model | `gemini-3.5-flash` |
| Playwright | latest |
| Crawl4AI | 0.9.0 |

---

## 📋 Known Issues

- `gemini-3.5-flash` is currently experiencing high demand (503 errors). The built-in exponential backoff handles this automatically, but initial Auto Setup may take 30-60 seconds during peak hours.
- GitHub Pages deployment is frontend-only. Full agent functionality requires a local backend running on port 8000.

---

## 🙏 Acknowledgments

- **Google DeepMind** — For the incredible Gemini 3.5 Flash model
- **Microsoft Playwright** — For the best browser automation framework
- **Crawl4AI** — For seamless web content extraction

---

*Built with ❤️ by Arvind Ji · Jigar Corporation Pvt Ltd*
