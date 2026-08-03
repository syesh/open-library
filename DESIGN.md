# Design System & Specifications: Open Read E-Reader

> **Project Name:** Open Read E-Reader ("Public Domain Scholar")  
> **Source:** Stitch MCP (`projects/6645806329613000694`)  
> **Theme:** Public Domain Scholar  
> **Device Target:** Desktop & Mobile Responsive  

---

## 1. Vision & Brand Aesthetics

The design system focuses on academic elegance and cognitive ease, prioritizing the reading experience above all else. The brand personality is scholarly, quiet, and archival, evoking the feeling of a well-curated physical library.

- **Design Style:** **Minimalism** with a **Tactile** touch. It utilizes generous whitespace, centered compositions, and subtle ink-like borders to create a structured, breathing environment.
- **Cognitive Ergonomics:** Visual noise is aggressively minimized so the transition from library browsing to deep reading is completely seamless.
- **Editorial Character:** Avoids digital-first gimmicks in favor of timeless editorial layouts that honor public domain literature.

---

## 2. Color Palette System

The color system is built around three environmental lighting modes:

1. **Light (Paper):** A soft, off-white background (`#FAF9F6`) that mitigates glare and eye strain compared to pure white, paired with deep "Ink" (`#1A1C1A`) text.
2. **Sepia (Archive):** A warm parchment environment engineered for low blue-light evening reading.
3. **Dark (Night):** A low-luminance charcoal experience preserving night vision without harsh high-contrast glare.

### Primary Accents
- **Primary Accent (Scholarly Blue):** `#1A2B3C` — Reserved for primary actions, focused states, and key navigational highlights.
- **Secondary Accent:** `#40627D` / `#5B7C99` — Applied to metadata, status badges, and secondary iconography.

### Complete Color Tokens Matrix

| Category | Token Name | Hex Value | Purpose / Context |
| :--- | :--- | :--- | :--- |
| **Surface** | `surface` / `background` | `#FAF9F6` | Default page background (Paper Mode) |
| | `surface-dim` | `#DBDAD7` | Muted background state |
| | `surface-bright` | `#FAF9F6` | High-contrast surface |
| | `surface-container-lowest` | `#FFFFFF` | Clean white card backgrounds |
| | `surface-container-low` | `#F4F3F1` | Soft container background |
| | `surface-container` | `#EFEEEB` | Neutral container background |
| | `surface-container-high` | `#E9E8E5` | Elevated section backgrounds |
| | `surface-container-highest` | `#E3E2E0` | Highest contrast neutral surface |
| | `on-surface` / `on-background` | `#1A1C1A` | Primary text and sharp UI elements |
| | `on-surface-variant` | `#44474C` | Muted body copy and metadata |
| | `inverse-surface` | `#2F312F` | Tooltips, dark snackbars, dark drawer backgrounds |
| | `inverse-on-surface` | `#F2F1EE` | Light text on inverse surfaces |
| **Primary** | `primary` | `#041627` | Deep primary brand tone |
| | `on-primary` | `#FFFFFF` | High-contrast text on primary |
| | `primary-container` | `#1A2B3C` | Scholarly Blue container accent |
| | `on-primary-container` | `#8192A7` | Text/icons inside primary containers |
| | `primary-fixed` | `#D2E4FB` | Fixed primary highlight accent |
| | `primary-fixed-dim` | `#B7C8DE` | Muted primary fixed accent |
| **Secondary** | `secondary` | `#40627D` | Secondary brand accent |
| | `on-secondary` | `#FFFFFF` | Text on secondary accent |
| | `secondary-container` | `#BCDEFF` | Light blue badge & highlight background |
| | `on-secondary-container` | `#41627E` | Text on secondary container |
| **Tertiary** | `tertiary` | `#211200` | Archival warmth & badge accent |
| | `tertiary-container` | `#38260B` | Deep warm container background |
| | `on-tertiary-container` | `#A88C69` | Muted warm text/accent |
| | `tertiary-fixed` | `#FEDDB5` | Soft amber highlight tone |
| **Borders & Lines**| `outline` | `#74777D` | 1px border stroke for inputs and cards |
| | `outline-variant` | `#C4C6CD` | Subtle divider lines and subtle borders |
| **Status / Error** | `error` | `#BA1A1A` | Alert and validation errors |
| | `error-container` | `#FFDAD6` | Error alert background |

---

## 3. Typography Rules

The typography hierarchy uses a strict **Content vs. Chrome** separation:

- **Content (Serif — *Merriweather*):** Used for titles, chapter headings, and all long-form reading text. Provides ideal typographic "bite" on high-DPI displays.
- **Interface (Sans — *Inter*):** Used for navigation, control panels, metadata labels, and UI controls.
- **Utilities (Monospace — *JetBrains Mono*):** Used for code snippets, line numbers, technical details, or alternative monospace reading view.

### Typographic Scale

| Token Key | Font Family | Size | Weight | Line Height | Letter Spacing | Applied To |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Merriweather | 48px | Bold (700) | 60px | -0.02em | Hero headers, Main book titles (Desktop) |
| `display-lg-mobile` | Merriweather | 32px | Bold (700) | 40px | Normal | Main book titles (Mobile) |
| `headline-md` | Merriweather | 24px | Bold (700) | 32px | Normal | Chapter titles, Book card titles, Section headers |
| `body-reading` | Merriweather | 20px | Regular (400) | 34px (~1.7x) | Normal | Main E-reader text body |
| `body-ui` | Inter | 16px | Regular (400) | 24px | Normal | Standard UI buttons, inputs, navigation items |
| `label-caps` | Inter | 12px | SemiBold (600)| 16px | 0.05em | Author names, Category tags, Eyebrows |
| `code-snippet` | JetBrains Mono | 14px | Regular (400) | 20px | Normal | Line numbers, publisher metadata, code blocks |

---

## 4. Layout, Spacing & Grid System

The spatial design balances a centered reading experience with a responsive grid for library discovery.

### Spacing Tokens

| Token | Value | Description / Usage |
| :--- | :--- | :--- |
| `container-max` | `720px` | Maximum width constraint for reader container |
| `edge-margin` | `2.0rem` (32px) | Minimum horizontal margin from viewport edges |
| `stack-sm` | `0.5rem` (8px) | Tight spacing between title and subtitle/meta |
| `stack-md` | `1.0rem` (16px) | Medium element stacking distance |
| `stack-lg` | `2.5rem` (40px) | Large section spacing and reader top/bottom margins |
| `gutter` | `1.5rem` (24px) | Grid column gap for book library cards |

### Grid Architecture
- **Reader Container:** Constrained strictly to `720px` maximum width. This maintains an optimal line length of **65–75 characters per line**, reducing eye scanning fatigue during continuous reading.
- **Library & Catalog Grid:** 
  - **Desktop (1280px+):** 12-column flexible grid system.
  - **Mobile:** Collapses to 1 or 2 columns based on cover aspect ratios.

---

## 5. Screen Layout Architecture

The project specifies four core screen views:

### 1. Main Library View (`Open Read - Refined Library`)
- **Header Navigation:** Features the "Open Read" brand logo, global search input, collection filters (e.g., Philosophy, Fiction, Science), and quick theme/settings toggles.
- **Featured Banner / Hero Section:** Showcases a handpicked public domain classic with cover art, detailed summary, reading progress, and a prominent "Continue Reading" call to action.
- **Collection Sections:** Horizontal and vertical grid modules organized by genres ("Curated Classics", "Recent Additions", "Short Reads").
- **Book Cards:** Portrait format featuring crisp cover previews, title (`headline-md`), author (`label-caps`), and reading time indicator.

### 2. Browse & Catalog View (`Open Read - Refined Catalog`)
- **Faceted Sidebar Filter:** Offers filtering options by Genre, Publication Era, Language, Author, and Estimated Reading Duration.
- **Sorting Header:** Controls for grid view vs. detailed list view, alongside sort selectors (Title, Author, Popularity, Year).
- **Infinite Scroll / Paginated Grid:** Displays search and catalog results in clean card layouts with 1px borders.

### 3. E-Reader View (`Open Read - Refined Reader`)
- **Centered Reader Column:** `container-max: 720px`, centered with `stack-lg` vertical padding.
- **Top Reading Progress Bar:** A minimal 2px horizontal accent line anchored at the very top of the viewport (`#1A2B3C`).
- **Chapter Header:** Elegant book title eyebrow (`label-caps`) and chapter headline (`headline-md`).
- **Floating Reader Controls (Control Drawer):**
  - **Desktop:** Unobtrusive floating bar anchored near the viewport edge.
  - **Mobile:** Bottom-anchored pull-up drawer with `rounded-xl` top corners.
  - **Controls:** Font size adjuster (`-` / `+`), Font switcher (Serif, Sans, Mono), Theme picker (Paper, Sepia, Night), Table of Contents trigger, and Bookmark button.

### 4. Public Domain Collection View (`Open Read Public Domain Library`)
- **Curated Archive Layout:** Focuses on thematic collections (e.g., "Greek Philosophy", "Victorian Literature").
- **Editorial Headers:** Rich typography headers (`display-lg`), biographical author notes, and historical context metadata.

---

## 6. Elevation, Shapes & Depth

In alignment with the scholarly aesthetic, the interface rejects heavy box-shadows in favor of **Tonal Layers** and **Subtle Outlines**.

### Shape Language (Border Radii)
- `sm`: `0.125rem` (2px) — Badge tag corners
- `DEFAULT`: `0.25rem` (4px) — Buttons, input fields, standard card containers
- `md`: `0.375rem` (6px) — Dialog windows and popup overlays
- `lg`: `0.5rem` (8px) — Main modal containers
- `xl`: `0.75rem` (12px) — Mobile reader control drawer top edges
- `full`: `9999px` — Circular icon buttons and status pills

### Depth Strategy
- **Layering:** Backgrounds and containers are differentiated via subtle shifts in surface hex values (`surface` vs `surface-container-low`) rather than heavy drop shadows.
- **1px Ink Outlines:** Buttons, inputs, and book cards use a 1px solid border (`#74777D` / `#C4C6CD`).
- **Overlays:** Crucial floating overlays (like the reader drawer) utilize a soft, 15% opacity ambient shadow for subtle depth separation.
- **Focus States:** High-visibility 2px solid stroke in Scholarly Blue (`#1A2B3C`) ensures full accessibility and ARIA compliance for keyboard users.

---

## 7. Component Library Guidelines

- **Book Cards:** Minimalist, portrait containers. Cover art is primary, followed by `headline-md` title and `label-caps` author. Uses 1px solid border without drop shadows.
- **Primary Buttons:** Solid Ink (`#041627`) background with Paper (`#FFFFFF`) text, `DEFAULT` rounded corners (0.25rem).
- **Secondary Buttons:** Ghost style with 1px Ink outline and `#1A1C1A` text.
- **Inputs:** Crisp rectangular fields with `label-caps` floating/eyebrow labels for an organized archival aesthetic.
- **Reader Progress Indicator:** Thin `#1A2B3C` bar fixed to the top edge of the browser viewport.
