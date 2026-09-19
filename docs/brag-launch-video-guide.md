# 🎬 Flex-Watch Launch Video Guide (`/brag`)

This document details the configuration, architecture, and usage of the **`/brag`** agent skill integrated into Flex-Watch.

---

## 📌 Overview

The `/brag` skill (sourced from [`latent-spaces/brag`](https://github.com/latent-spaces/brag)) enables AI coding agents (Antigravity, Claude Code, Cursor, OpenCode, Codex) to turn Flex-Watch into a polished, high-energy launch video with music, sound effects, animations, and ready-to-post social media copy.

Rather than relying on screen recordings or third-party editing suites, the skill reads the Flex-Watch codebase directly (React components, Tailwind dark theme tokens, and README features) and renders deterministic MP4 videos via [Hyperframes](https://hyperframes.heygen.com/) using headless Chromium and FFmpeg.

---

## 📁 Directory Structure

The skill and its assets are located under `.agents/skills/brag/`:

```
Flex-Watch/
├── .agents/
│   └── skills/
│       └── brag/
│           ├── SKILL.md                 # Primary skill instructions & rubric
│           ├── assets/
│           │   ├── music/               # Curated soundtrack tracks (.mp3) & cue data (.json)
│           │   └── sfx/                 # Sound effects (interface, impact, casino, keyboard)
│           ├── references/              # Detailed execution references
│           │   ├── audio.md             # Audio timing & sync guidelines
│           │   ├── step-1-inspect.md    # Codebase inspection rubric
│           │   ├── step-2-plan.md       # Storyboard & pacing planning
│           │   ├── step-3-compose.md    # Hyperframes composition specifications
│           │   ├── step-4-deliver.md    # WCAG validation, preview & rendering
│           │   └── tones.md             # Tone presets (cinematic, polished, etc.)
│           └── scripts/
│               └── analyze_music_cues.py # Music analysis & beat detection utility
```

---

## ⚙️ Prerequisites

1. **Node.js**: v18+ (already configured for Flex-Watch).
2. **FFmpeg**: Required by Hyperframes for encoding and poster frame extraction.
   - Test in terminal:
     ```powershell
     ffmpeg -version
     ```
   - If not installed on Windows:
     ```powershell
     winget install Gyan.FFmpeg
     ```
3. **Hyperframes CLI**:
   - Executed on-demand via `npx hyperframes` (no permanent global install strictly needed).

---

## 🚀 How to Use

### 1. In AI Agent Chat
Invoke the skill directly when chatting with an agent in this project:

```text
/brag --tone cinematic --format landscape
```

#### Available Parameters:
| Option | Values | Default | Description |
|---|---|---|---|
| `--tone` | `cinematic`, `polished`, `yc-parody`, `chaotic`, `deadpan`, `app-store` | `cinematic` (recommended for Flex-Watch) | Controls pacing, copy style, and animation energy. |
| `--format` | `landscape` (16:9), `vertical` (9:16), `square` (1:1) | `landscape` | Video aspect ratio (e.g. `vertical` for TikTok / Reels / Shorts). |
| `--duration` | `15` to `25` (seconds) | `auto` | Total runtime of the video. |
| `--voice` | flag | off | Enables Kokoro narration. |
| `--no-music` | flag | off | Disables background music track. |
| `--no-sfx` | flag | off | Disables UI sound effects. |

---

## 🔄 Lifecycle Pipeline

1. **Inspection**:
   The agent scans `frontend/src`, `frontend/tailwind.config.js`, and `README.md` to extract Flex-Watch's branding, dark cinematic palette (`#0f0f0f`, crimson accents), hero carousel, and ML content-based filtering.
2. **Planning (`brag-output/brag-plan.md`)**:
   Answers the 9-question rubric and designs a multi-scene storyboard.
3. **Composition (`brag-output/composition/`)**:
   Generates the HTML, CSS, and JS animation timeline, copying relevant audio tracks and SFX from `.agents/skills/brag/assets/`.
4. **Validation**:
   ```powershell
   cd brag-output/composition
   npx hyperframes check
   ```
   Validates layout boundaries and WCAG color contrast compliance.
5. **Interactive Preview**:
   ```powershell
   npx hyperframes preview
   ```
   Spins up a local server to preview the animation in your browser before rendering.
6. **Rendering**:
   ```powershell
   cd brag-output/composition
   npx hyperframes render --quality high --output ../brag.mp4
   ```
   Produces `brag-output/brag.mp4` (with `brag.jpg` baked as frame 0 thumbnail), extracts `brag-output/brag.jpg` for external platform thumbnail uploads, and writes `brag-output/share-copy.txt` along with multi-platform variants in `brag-output/share-copy-variants.md`.

