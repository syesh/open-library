# 📖 Open Read E-Reader (`open-library`)

> A serene, distraction-free web e-reader and digital library dedicated to public domain literature. Engineered with academic elegance, ergonomic reading themes and seamless EPUB rendering.

---

## ✨ Key Features

- 📚 **Public Domain Scholar Library**: Browse and read curated classic literature in a distraction-free environment.
- 🎨 **Ergonomic Reading Themes**: 
  - 📄 **Paper (Light)**: Soft off-white surface (`#FAF9F6`) designed to minimize glare.
  - 📜 **Archive (Sepia)**: Warm parchment tones ideal for low blue-light evening reading.
  - 🌙 **Night (Dark)**: Low-luminance dark mode for comfortable night reading.
- 📖 **Customizable Typography & Reader UI**:
  - Content rendered with **Merriweather** serif for maximum legibility.
  - Interface powered by **Inter** for clean navigation.
  - Adjustable font size, line spacing, and margin controls.
- 🔖 **Progress Sync & Bookmarking**: Save reading progress, notes and highlights seamlessly.
- 📱 **Responsive Ergonomics**: Tailored layouts for desktop, tablet and mobile displays.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & React**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (`@supabase/ssr`)
- **E-Reader Engine**: [EPUB.js](https://github.com/futurepress/epub.js/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm, pnpm, yarn, or bun

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/open-library.git
   cd open-library
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to explore Open Read.

---

## 📁 Project Structure

```
open-library/
├── src/
│   ├── app/            # Next.js App Router pages and layouts
│   ├── components/     # UI components (Reader, Library, Controls)
│   └── lib/            # Supabase client & utility functions
├── public/             # Static assets & public files
├── supabase/           # Migrations & database setup
├── DESIGN.md           # Design tokens, typography & brand guidelines
└── package.json        # Dependencies & scripts
```
