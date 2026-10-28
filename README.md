# ChronoLog — Personal History Timeline 📜🏛️

An interactive, visual history study companion and reading log built with [TimelineJS3](https://timeline.knightlab.com/). 

Organized into three classical eras:
- **Ancient History** (c. 3000 BCE – 500 CE)
- **Medieval History** (c. 500 CE – 1500 CE)
- **Modern History** (c. 1500 CE – Present) — *Active Focus*

---

## 🚀 Quick Start (Running Locally)

Because this project is built with lightweight vanilla web standards and CDN-hosted TimelineJS:

1. **Option 1 (Instant):** Double-click `modern.html` or `index.html` to open directly in any web browser.
2. **Option 2 (Local Server):** If using VS Code, use the **Live Server** extension, or run:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js / npx
   npx serve .
   ```
   Then open `http://localhost:8000` in your browser.

---

## 🎨 Features
- **TimelineJS3 Engine**: Interactive horizontal timeline with zooming, panning, and date ticks.
- **Dark Archival Theme**: Elegant typography and layout tuned for historical research and book notes.
- **Multi-Era Navigation**: Seamless switching between Ancient, Medieval, and Modern history.
- **Rich Media**: Supports archival photographs, portraits, YouTube videos, and Wikipedia articles.

---

### Supported Media Types in `media.url`:
- Images (PNG, JPG, WebP)
- Wikimedia Commons public domain image links
- YouTube videos (simply paste the standard YouTube watch URL)
- Wikipedia article URLs
- Spotify tracks, Google Maps, Twitter/X posts, etc.

---

## 🌐 Deploying to GitHub Pages (Free Hosting)

You can host your timeline live so you can access it from your phone, tablet, or laptop anytime:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Add modern history timeline and reading log"
   git push origin main
   ```
2. In your GitHub repository, go to **Settings** &rarr; **Pages**.
3. Under **Build and deployment** &rarr; **Source**, select **Deploy from a branch**.
4. Choose branch `main` and folder `/(root)`, then click **Save**.
5. Your timeline will be live in 1–2 minutes at `https://<your-username>.github.io/history-timeline/`!

---

## 📂 Project Directory Structure

```
History-Timeline/
├── index.html            # Gateway / redirects to modern timeline
├── modern.html           # Modern history timeline viewer
├── ancient.html          # Ancient history timeline (placeholder for phase 2)
├── medieval.html         # Medieval history timeline (placeholder for phase 3)
├── css/
│   └── style.css         # Dark archival academia styling & timeline overrides
├── js/
│   ├── modern-data.js    # Curated modern events, eras, and reading log entries
│   └── timeline-init.js  # TimelineJS setup and modal interactive controls
├── LICENSE               # Apache-2.0
└── README.md             # Project documentation and guide
```
