# ChordGrid

A small browser tool for **drawing guitar chord diagrams** and **laying them out on a printable sheet**. You set a sheet title, configure tuning and starting fret, click the fretboard to place notes (with support for open strings and mutes), add each chord to the sheet, preview the full layout, and **download a PNG** of either the multi-chord sheet or the single editor diagram when the sheet is empty.

The UI is a static site: no build step and no framework—just modules and the Canvas API.

## Languages

| Language   | Role                                      |
| ---------- | ----------------------------------------- |
| **HTML**   | Page structure and shell                  |
| **CSS**    | Layout, typography, and component styling |
| **JavaScript** | App logic, drawing, and interactivity (ES modules, no transpiler) |

## Tech stack

- **Canvas 2D API** - chord diagrams, grid, labels, and sheet composite rendering
- **ES modules** (`import` / `export`) - code split across `js/` files (requires serving over `http://`, not `file://`)
- **Google Fonts** - [Outfit](https://fonts.google.com/specimen/Outfit) (UI) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (diagram text)
- **npm + [serve](https://github.com/vercel/serve)** - local static file server for development (optional but convenient)

## Run locally

Browsers block ES modules when opening HTML from the filesystem, so run a tiny HTTP server from the project root:

```bash
npm install
npm start
```

Then open [http://localhost:8080](http://localhost:8080). The same applies if you use another static server (for example `python3 -m http.server 8080`).
