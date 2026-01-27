# Copilot Instructions for Portfolio Codebase

## Architecture Overview

This is a **hybrid portfolio site** with both vanilla JS/HTML pages and React/Next.js components. The project consists of:

- **Frontend**: HTML pages (`index.html`, `projects.html`, `project-detail.html`, `about.html`)
- **Data Layer**: Centralized project data in `js/data.js` (global `window.projects` array)
- **JavaScript Modules**: Vanilla JS files handling specific features (header scroll, project rendering, detail views)
- **React Components**: `components/ProjectCard.tsx` (appears to be prepared for Next.js integration)
- **Styling**: CSS-in-JS and modular CSS (`css/style.css`, `styles/projectDetail.module.css`)

## Critical Data Structure

**All project information** is stored in `js/data.js` as `window.projects[]` array. Each project object contains:

```javascript
{
  id: "01",
  year: "2024",
  categories: ["Event", "Experience Design"],
  title: "Project Name",
  description: "Short description",
  roles: ["Direction", "Design"],
  thumb: "assets/images/projects1.jpg",
  // Detail page fields (context, problem, process[], result, learnings, tools, links)
}
```

**Key pattern**: Fields have multiple aliases for flexibility (e.g., `description` OR `summary`, `categories` OR `category`). Always check both when reading data.

## Page-to-Data Flow

1. **`projects.html`** → `js/project-list.js` reads `window.projects`, applies search/filter/sort, renders to `#project-grid`
2. **`project-detail.html`** → `js/project-view.js` uses URL param `?id=XX`, finds matching project, builds detail HTML
3. **Header behavior**: `js/main.js` manages scroll-state styling (glassmorphism effect on scroll)

## Design System & Conventions

### CSS Variables (in `:root`)
- **Colors**: `--bg`, `--text`, `--sub` (subtext), `--border`
- **Glass effect**: `--glass-bg`, `--glass-blur`, `--glass-shadow` for modern frosted glass UI
- **CTA styling**: `--cta-line`, `--cta-stroke` for link underline animations
- **Spacing**: `--container-pad: 7vw`, `--container-max: 1300px` for responsive layout

### Component Classes
- `.glass-card` / `.glass-panel`: Backdrop blur + border + shadow (reusable pattern)
- `.detail-*`: Prefixed classes for project detail pages
- `.cta-link`: Custom button/link with animated arrow decoration

### Typography
- Fonts: `--font-en: Inter` (sans), `--font-jp: Shippori Mincho` (serif)
- Japanese content uses serif font; English uses sans-serif

## Vanilla JS Patterns

### 1. DOM-based State Management
No framework state—uses `sessionStorage` and DOM classes for state:
- `sessionStorage.getItem('intro_seen_v1')` tracks one-time animations
- `.intro-lock` class prevents scrolling during intro overlay
- `.header-top` / `.header-scrolled` toggles header styling

### 2. Template String Rendering
```javascript
// projects/project-list.js pattern:
grid.innerHTML = filteredData.map(p => `<a href="...">...</a>`).join('');
```

### 3. URL Parameter Reading
```javascript
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
```

## Important Developer Notes

1. **Language**: Mixed Japanese/English. Project descriptions and context are primarily Japanese; UI/code uses English.

2. **Asset Paths**: Images reference `assets/images/` (e.g., `projects1.jpg`, `projects2.jpg`). Ensure these exist when adding projects.

3. **Search/Filter Logic**: `project-list.js` performs three operations sequentially:
   - Search (title + categories)
   - Filter (by single category)
   - Sort (by year, newest first)

4. **Detail Page Flexibility**: `project-view.js` handles multiple data schemas via fallbacks (e.g., `p.context ?? p.ontext ?? p.overview`), supporting both old and new project formats.

5. **Next.js Future**: `pages/projects/[id].tsx` suggests future dynamic routing—currently unused but structured for Next.js migration.

## Common Modifications

- **Add a project**: Add object to `window.projects[]` in `js/data.js`, ensure `thumb` image exists
- **Modify project detail layout**: Edit template in `js/project-view.js` (lines ~30-80)
- **Change header behavior**: Edit scroll handlers in `js/main.js` or CSS in `css/style.css`
- **Update styling**: Modify CSS variables in `:root` block for global changes, or component-specific CSS rules

## Testing & Debugging

- Check browser console for missing `#project-grid` or `#detail-root` elements
- Use `window.projects` in browser DevTools to inspect project data
- Test intro overlay state by clearing `sessionStorage` in DevTools
