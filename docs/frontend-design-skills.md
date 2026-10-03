# Frontend Design Skills Guide: Taste Skill & Impeccable

This guide outlines how [Taste Skill](https://www.tasteskill.dev/) and [Impeccable](https://impeccable.style/) are configured and executed within Flex-Watch to ensure high-craft, anti-slop frontend output.

---

## 1. Overview of Installed Skills

Both skills live in `.agents/skills/`:

| Skill | Directory | Primary Role | Key Focus |
|---|---|---|---|
| **Taste Skill** (`design-taste-frontend`) | [`.agents/skills/taste-skill/`](../.agents/skills/taste-skill/SKILL.md) | Brief inference & aesthetic direction | Prevents generic "AI purple/card" layouts; infers audience, tone, typography hierarchy, and color palettes. |
| **Impeccable** (`impeccable`) | [`.agents/skills/impeccable/`](../.agents/skills/impeccable/SKILL.md) | Craft floor standards & design review | Enforces visual balance, micro-interactions, responsive integrity, typography refinement, and polish. |

---

## 2. Webpage Building Protocol

Whenever you ask to build a webpage, landing page, or frontend component, the agent executes this sequence:

### Step 1: Brief Inference & Aesthetic Calibration (Taste Skill)
- Analyzes page type, audience, brand palette, and design constraints.
- Declares a one-line Design Read before writing code:
  > *"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system or aesthetic family>."*
- Establishes typographic hierarchy, spacing rhythms, and CSS custom properties.

### Step 2: Component Craft & Polish (Impeccable)
- Applies craft floor rules: prevents uniform card grids, unstyled inputs, and repetitive generic containers.
- Enforces active/hover/focus states, contrast requirements, and visual hierarchy.
- Audits and polishes the page for layout balance and subtle motion.

### Step 3: Production Engineering (`frontend-ui-engineering`)
- Validates responsive breakpoints across mobile, tablet, and desktop viewports.
- Enforces semantic HTML and WCAG AA accessibility standards.
