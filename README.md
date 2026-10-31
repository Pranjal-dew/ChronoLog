# ChronoLog — Personal History Timeline & Reading Companion 📜🏛️

An interactive, visual history study companion and reading log built for UPSC and academic study, multi-perspective exploration, and "connecting the dots" across Indian Modern History (1707–1947).

Organized into three classical eras:
- **Ancient History** (c. 3000 BCE – 500 CE) — *Roadmap Phase*
- **Medieval History** (c. 500 CE – 1500 CE) — *Roadmap Phase*
- **Modern History** (c. 1707 CE – 1947 CE) — *Active Focus (Spectrum's Modern India)*

---

## 🏗️ Clean Project Structure

```text
History-Timeline/
├── content/                     # [SOURCE OF TRUTH] Clean, Human-Readable Historical Content
│   ├── eras.yaml                # Master Historical Eras (Decline of Mughals, Crown Rule, Gandhian)
│   ├── title.yaml               # Timeline header, introduction, and book citations metadata
│   └── modern/                  # Individual milestone YAML files (40 files, e.g. 1757-battle-of-plassey.yaml)
│
├── data/                        # [COMPILED DATA] Master JSON dataset
│   └── modern.json              # Compiled master JSON dataset
│
├── js/                          # [FRONTEND ENGINE & SCRIPTS]
│   ├── vis-timeline.min.js      # Bundled Vis-Timeline library (local, high-speed, 60fps)
│   ├── modern-data.js           # Compiled offline-compatible data bundle
│   ├── timeline-vis.js          # Interactive multi-swimlane canvas controller
│   └── revision-feed.js         # Vertical revision feed & study view controller
│
├── css/                         # [STYLING]
│   ├── vis-timeline.min.css     # Core Vis-Timeline CSS
│   └── style.css                # Clean Dark Archival theme (HUD, modals, revision feed)
│
├── chronolog.py                 # [CORE BUILD ENGINE & CLI]
│                                # Commands: build, validate, list, add, serve, gui
│
├── gui.py                       # [DESKTOP HISTORIAN'S STUDIO]
│                                # 2-Vertical Panel desktop app (CustomTkinter + PIL)
│
├── index.html                   # Entry point (auto-redirect to modern.html)
├── modern.html                  # Interactive Modern Indian History Timeline (Vis-Timeline canvas)
├── ancient.html                 # Placeholder roadmap for Ancient History
├── medieval.html                # Placeholder roadmap for Medieval History
│
├── tests/                       # [AUTOMATED TEST SUITE]
│   ├── test_data_sync.py        # Validates YAML <-> JSON <-> JS parity & schemas
│   ├── test_gui_sync.py         # Validates GUI load, CRUD, filtering & live preview
│   └── test_website_sync.js     # Validates web frontend data consumption in Node.js
│
├── .gitignore                   # Clean ignore rules: .cache/, __pycache__/, *.pyc, etc.
└── README.md                    # Streamlined documentation and quickstart guide
```

---

## 🎨 Core Web Capabilities (`modern.html`)

1. **Multi-Swimlane Canvas (`Vis-Timeline 60FPS`)**:
   - Visualizes parallel historical tracks simultaneously (British Power & Policy, Viceroys, Imperial Acts, National Leaders, Mass Movements, Armed & Revolutionary).
   - Fluid mouse-wheel zoom and horizontal panning from centuries down to months.
   - Era and period background highlight bands.

2. **⚡ Connect the Dots**:
   - Clicking any event reveals simultaneous milestones occurring across other historical tracks within that same time window.

3. **📜 Split-Screen Multimedia Dossier**:
   - Embedded inline **YouTube video player** (lectures, archival newsreels, speeches) and high-resolution archival portraits.
   - Curated **Spectrum Chapter Citations** and study notes.

4. **☰ Vertical Revision Feed**:
   - Linear reading mode grouped by decade for rapid revision on mobile or laptop.
   - Instant search and swimlane filtering.

---

## 🖥️ ChronoLog Studio Desktop GUI (`gui.py`)

A full-featured native Python desktop app built with **CustomTkinter** and **PIL (Pillow)** featuring a clean **2-Vertical Panel Architecture**:

```bash
python gui.py
```
*(Or run `python chronolog.py gui`)*

### 2-Panel Layout:
- **Left Panel (Authoring Suite)**:
  - Mode switch: **Milestone Editor** vs **Historical Eras**.
  - Smart date parsing: Accepts `13 Apr 1919`, `1857`, `03 Mar 1707`, or `1919-04-13`.
  - Date ranges & lifespans toggle (e.g. Gandhi 1869–1948).
  - Quick 1-click swimlane pills (`Political`, `Freedom Struggle`, `Movements`, `Wars`, etc.).
  - Spectrum / NCERT / Bipan Chandra book citations.
  - Formatting toolbar: `Quote`, `Bullet`, `Bold`, `Tag`.
  - Media attachment with instant YouTube auto-detection and custom background tints.
- **Right Panel (Studio Monitor)**:
  - **Top: Authentic Slide Preview**: Live rendering of archival photos, YouTube thumbnails with play button overlay, gold serif dates, and citation notes.
  - **Bottom: Chronicle & Milestones Feed**: Real-time search, swimlane filter, grouping by Era or Swimlane, and 1-click action buttons (`Edit`, `Duplicate`, `Delete`).

---

## ⚙️ ChronoLog CLI Tool (`chronolog.py`)

Manage content, validate datasets, and compile bundles directly from the terminal:

```bash
# Launch the desktop studio GUI
python chronolog.py gui

# Recompile YAML content into js/modern-data.js and data/modern.json
python chronolog.py build

# Validate all milestone files for syntax & date errors
python chronolog.py validate

# List all milestones in a clean formatted table in terminal
python chronolog.py list

# Interactively create a new historical milestone via CLI prompt
python chronolog.py add

# Start local web server to test timeline in browser
python chronolog.py serve
```

---

## 🧪 Automated Testing & Data Sync Verification

ChronoLog includes a comprehensive automated test suite ensuring that content written via the Desktop GUI, edited in YAML, and consumed by the Web Canvas remains in 100% synchronization:

```bash
# 1. Run Python data sync and GUI lifecycle tests (pytest)
python -m pytest tests/

# 2. Run Node.js web runtime validation test
node tests/test_website_sync.js
```

What the tests verify:
- **YAML <-> JSON <-> JS parity**: Guarantees zero divergence between raw content files and production bundles.
- **GUI Operations**: Tests milestone creation, editing, deleting, search filtering, and live preview rendering.
- **Web Frontend Contract**: Confirms all dates parse cleanly into browser `Date` objects, eras encompass events, and timeline sorting is strictly chronological.

---

## 🌐 Deploying to GitHub Pages (Free Hosting)

Host your timeline live so you can access it from your phone, tablet, or laptop anytime:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Update history timeline with Vis-Timeline and ChronoLog Studio"
   git push origin main
   ```
2. In your GitHub repository, go to **Settings** &rarr; **Pages**.
3. Under **Build and deployment** &rarr; **Source**, select **Deploy from a branch**.
4. Choose branch `main` and folder `/(root)`, then click **Save**.
5. Your timeline will be live in 1–2 minutes at `https://<your-username>.github.io/<repo-name>/`!
