# AI-Meeting: Frontend-First Project Configuration

@AGENTS.md

**⚠️ CRITICAL**: This project uses a specific Next.js version with breaking changes. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Check for deprecation notices.

---

## 🎨 Frontend Skills Priority

**Use this order when building UI/interfaces:**

### 1. **frontend-design** (PRIMARY)
Read `.claude/skills/frontend-design/SKILL.md` FIRST for any:
- Web components, pages, applications
- React/Vue/HTML layouts
- Styling, aesthetics, UX
- Landing pages, dashboards, posters
- **Triggers**: "build", "create", "design", "component", "interface", "page"

**Mindset**: BOLD aesthetic direction. Avoid "AI slop" (generic Inter, purple gradients, centered everything). Be intentional and creative.

### 2. **web-artifacts-builder** (FOR COMPLEX REACT)
Read `.claude/skills/web-artifacts-builder/SKILL.md` when:
- Building multi-component React apps
- Need state management, routing, shadcn/ui components
- Creating self-contained, bundled HTML artifacts
- **Triggers**: "React app", "interactive dashboard", "complex artifact", "shadcn/ui"

**Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui

### 3. **theme-factory** (FOR STYLING)
Read `.claude/skills/theme-factory/SKILL.md` when:
- Applying consistent theming to slides, docs, reports
- Need color palettes + font pairings
- Building themed variations of artifacts
- **Triggers**: "theme", "styling", "color scheme", "consistent look"

**Available**: 10 pre-set themes + custom theme generation

---

## 📄 Supporting Skills (As Needed)

- **canvas-design** → Special canvas/SVG effects
- **brand-guidelines** → Brand consistency checks
- **algorithmic-art** → Generative/artistic elements
- **pdf, docx, pptx, xlsx** → Export formats

---

## ⚡ Quick Workflow

1. **User requests UI** → Read `frontend-design/SKILL.md`
2. **If it's complex React** → ALSO read `web-artifacts-builder/SKILL.md`
3. **If it needs theming** → Apply `theme-factory`
4. **Code & bundle** → Share as artifact

---

## 🚫 Design Anti-Patterns

Explicitly AVOID:
- ❌ Inter, Roboto, Arial fonts (use distinctive choices)
- ❌ Purple gradients on white
- ❌ Over-centered layouts
- ❌ Uniform rounded corners everywhere
- ❌ "AI slop" aesthetics

**Instead**: Be intentional, bold, context-specific, and creative.

---

## 🛠 Tech Stack

- **Framework**: React 18 + TypeScript (or vanilla HTML/CSS/JS)
- **Next.js**: ⚠️ Custom version — read docs in `node_modules/next/dist/docs/`
- **Styling**: Tailwind CSS 3.4+ with CSS variables
- **Components**: shadcn/ui (40+ pre-installed)
- **Bundling**: Parcel (for multi-component artifacts)
- **Fonts**: Distinctive typography choices (not system fonts)

---

## 📝 When In Doubt

Ask yourself:
1. Is this a UI/interface? → `frontend-design`
2. Is it complex React with state? → `web-artifacts-builder`
3. Does it need consistent theming? → `theme-factory`
4. Is the output not HTML/UI? → Check supporting skills
5. Involves Next.js? → Check `node_modules/next/dist/docs/` for breaking changes

---

## 🎯 Project Goal

Build **distinctive, production-grade frontend interfaces** that solve real problems with **exceptional design quality** and **creative, unforgettable aesthetics** — while respecting the custom Next.js version in this project.