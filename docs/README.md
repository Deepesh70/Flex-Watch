# 📚 Flex-Watch Technical Documentation

Welcome to the comprehensive technical documentation for **Flex-Watch**, an enterprise-grade movie discovery and streaming web platform built with **React 19**, **Node.js/Express**, **Prisma ORM**, and **Python ML**.

---

## 📑 Documentation Index

| Document | Purpose |
|---|---|
| 📖 **[Project Overview](./project-overview.md)** | High-level summary of the application, goals, technology stack, and user flows. |
| 🛠️ **[Setup & Running Guide](./setup-guide.md)** | Step-by-step instructions for local development (SQLite) and containerized deployment (Docker Compose with Postgres & Redis). |
| 🏛️ **[Architecture Guide](./architecture-guide.md)** | Deep dive into the monorepo design, BFF proxy, singleflight caching, database schema, and resilience mechanisms. |
| 🎬 **[Feature Walkthrough](./feature-walkthrough.md)** | Detailed breakdown of core features: Hero trailer playback, catalog search, persistent watchlist, dynamic ML recommendations, and health probes. |
| 🚀 **[GitHub Actions CI/CD Guide](./github-workflows-guide.md)** | Complete blueprint for setting up automated CI/CD workflows, runners, caching, secrets, and quality gates on any repo. |
| 🎬 **[Launch Video Guide (/brag)](./brag-launch-video-guide.md)** | Guide on using the `/brag` agent skill and Hyperframes to create automated launch videos for Flex-Watch. |

---

## 🏗️ Quick Architecture Snapshot

```
Flex-Watch Monorepo/
├── ⚛️ frontend/     # React 19 Client (UI, Router, Tailwind, Nginx Dockerfile)
├── 🚀 backend/      # Express 4 BFF (Prisma ORM, Caching, Secret Shield, Dockerfile)
├── 🧠 ml-engine/    # Python ML Pipeline (Cosine similarity offline engine)
├── 📁 docs/         # Architectural, setup, and feature specifications
└── 🐳 compose/      # Docker Compose topology (Postgres 16, Redis 7, API, Web)
```
