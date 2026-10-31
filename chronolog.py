#!/usr/bin/env python3
"""
ChronoLog CMS & Build Engine
High-performance historical content compiler for Indian Modern History (1707–1947).
Compiles content/*.yaml into offline-ready datasets (data/modern.json & js/modern-data.js).
"""

import os
import sys
import re
import json
import yaml
import argparse
from pathlib import Path
from datetime import datetime

# Configure UTF-8 stdout for cross-platform terminal compatibility
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Project Directory Paths
PROJECT_ROOT = Path(__file__).parent.resolve()
CONTENT_DIR = PROJECT_ROOT / "content"
MODERN_DIR = CONTENT_DIR / "modern"
DATA_DIR = PROJECT_ROOT / "data"
JS_DIR = PROJECT_ROOT / "js"
MODERN_DATA_JS = JS_DIR / "modern-data.js"
MODERN_DATA_JSON = DATA_DIR / "modern.json"
TITLE_FILE = CONTENT_DIR / "title.yaml"
ERAS_FILE = CONTENT_DIR / "eras.yaml"
SWIMLANES_FILE = CONTENT_DIR / "swimlanes.yaml"
MODERN_HTML = PROJECT_ROOT / "modern.html"

# Hierarchical Vis-Timeline Swimlanes & Taxonomy
BOARD_TAXONOMY = {
    "British Power & Policy": {
        "id": "grp_british",
        "icon": "👑",
        "order": 1,
        "subgroups": {
            "British PMs": {"id": "sub_pms", "icon": "🇬🇧", "label": "British Prime Ministers", "order": 1},
            "Viceroys & Governors-General": {"id": "sub_viceroys", "icon": "🏛️", "label": "Viceroys & Governors-General", "order": 2},
            "Acts & Policies": {"id": "sub_acts", "icon": "📜", "label": "Imperial Acts & Policies", "order": 3}
        }
    },
    "Indian Freedom Struggle": {
        "id": "grp_national",
        "icon": "✊",
        "order": 2,
        "subgroups": {
            "National Leaders (Lifespans)": {"id": "sub_leaders", "icon": "🕊️", "label": "National Leaders (Lifespans)", "order": 4},
            "Mass Movements & Satyagrahas": {"id": "sub_movements", "icon": "🔥", "label": "Mass Satyagrahas & Campaigns", "order": 5},
            "Armed & Revolutionary": {"id": "sub_revolutionary", "icon": "⚡", "label": "Armed & Revolutionary Events", "order": 6}
        }
    }
}

LEGACY_GROUP_MAP = {
    "Gandhi": ("Indian Freedom Struggle", "National Leaders (Lifespans)"),
    "Nehru": ("Indian Freedom Struggle", "National Leaders (Lifespans)"),
    "Bose": ("Indian Freedom Struggle", "National Leaders (Lifespans)"),
    "Jannah": ("Indian Freedom Struggle", "National Leaders (Lifespans)"),
    "Company Rule": ("British Power & Policy", "Acts & Policies"),
    "British": ("British Power & Policy", "Acts & Policies"),
    "Incidents": ("Indian Freedom Struggle", "Armed & Revolutionary"),
    "Revolt & Resistance": ("Indian Freedom Struggle", "Armed & Revolutionary"),
    "Movements & Revolts": ("Indian Freedom Struggle", "Mass Movements & Satyagrahas"),
    "British PMs": ("British Power & Policy", "British PMs"),
    "Viceroys": ("British Power & Policy", "Viceroys & Governors-General"),
    "Viceroys & Governors-General": ("British Power & Policy", "Viceroys & Governors-General"),
    "Acts & Policies": ("British Power & Policy", "Acts & Policies"),
    "National Leaders (Lifespans)": ("Indian Freedom Struggle", "National Leaders (Lifespans)"),
    "Mass Movements & Satyagrahas": ("Indian Freedom Struggle", "Mass Movements & Satyagrahas"),
    "Armed & Revolutionary": ("Indian Freedom Struggle", "Armed & Revolutionary"),
}

PRESET_GROUPS = [
    "Political & Admin",
    "Freedom Struggle",
    "Mass Movements & Satyagrahas",
    "Armed & Revolutionary",
    "National Leaders (Lifespans)",
    "Wars & Battles",
    "Company Rule",
    "British PMs",
    "Viceroys & Governors-General",
    "Acts & Policies",
    "Social Reforms",
    "General"
]

PRESET_SUBGROUPS = [
    "Constitutional Acts",
    "Congress Sessions",
    "Viceroys & Governors-General",
    "National Leaders (Lifespans)",
    "Mass Satyagrahas & Campaigns",
    "Armed & Revolutionary",
    "Peasant & Tribal Movements",
    "Social & Religious Reforms",
    "Economic & Land Revenue",
    "Education & Press"
]


def load_swimlanes() -> list[str]:
    """Load all swimlanes from PRESET_GROUPS, content/swimlanes.yaml, and existing milestones."""
    swimlanes = list(PRESET_GROUPS)
    if SWIMLANES_FILE.exists():
        try:
            with open(SWIMLANES_FILE, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if isinstance(data, list):
                    for item in data:
                        name = item if isinstance(item, str) else (item.get("name") if isinstance(item, dict) else "")
                        name = str(name).strip()
                        if name and name not in swimlanes:
                            swimlanes.append(name)
        except Exception:
            pass
    # Scan existing YAML records for any custom groups
    if MODERN_DIR.exists():
        for yf in list(MODERN_DIR.glob("*.yaml")) + list(MODERN_DIR.glob("*.yml")):
            try:
                with open(yf, "r", encoding="utf-8") as f:
                    rec = yaml.safe_load(f)
                    if isinstance(rec, dict):
                        grp = rec.get("group")
                        if grp and isinstance(grp, str):
                            grp = grp.strip()
                            if grp and grp not in swimlanes:
                                swimlanes.append(grp)
            except Exception:
                pass
    return swimlanes


def load_subgroups() -> list[str]:
    """Load all distinct subgroups from preset list and existing YAML milestones."""
    subgroups = list(PRESET_SUBGROUPS)
    if MODERN_DIR.exists():
        for yf in list(MODERN_DIR.glob("*.yaml")) + list(MODERN_DIR.glob("*.yml")):
            try:
                with open(yf, "r", encoding="utf-8") as f:
                    rec = yaml.safe_load(f)
                    if isinstance(rec, dict):
                        sub = rec.get("subgroup")
                        if sub and isinstance(sub, str):
                            sub = sub.strip()
                            if sub and sub not in subgroups:
                                subgroups.append(sub)
            except Exception:
                pass
    return subgroups


def save_custom_swimlane(name: str) -> list[str]:
    """Save a new swimlane to content/swimlanes.yaml and return updated list."""
    name = name.strip()
    if not name:
        return load_swimlanes()
    current = []
    if SWIMLANES_FILE.exists():
        try:
            with open(SWIMLANES_FILE, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if isinstance(data, list):
                    current = [str(x).strip() for x in data if str(x).strip()]
        except Exception:
            current = []
    if name not in current:
        current.append(name)
        ensure_dirs()
        with open(SWIMLANES_FILE, "w", encoding="utf-8") as f:
            yaml.dump(current, f, sort_keys=False, allow_unicode=True)
    return load_swimlanes()

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


def ensure_dirs():
    """Ensure all required project content and data directories exist."""
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    MODERN_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    JS_DIR.mkdir(parents=True, exist_ok=True)


def extract_youtube_id(url: str) -> str | None:
    """Extract 11-character YouTube video ID from various URL patterns."""
    if not url:
        return None
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|embed\/|\/watch\?v=|\&v=)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def parse_smart_date(date_str) -> dict | None:
    """
    Parse date strings into a normalized {'year': int, 'month': int, 'day': int} dict.
    Supports: '1757', '1857-05-10', '13 Apr 1919', 'April 1919', etc.
    """
    if not date_str:
        return None

    if isinstance(date_str, dict):
        return {k: int(v) for k, v in date_str.items() if v is not None}

    s = str(date_str).strip()

    # Case 1: Plain Year (e.g. '1857' or '-500' for BCE)
    if re.match(r"^-?\d{1,4}$", s):
        return {"year": int(s)}

    # Case 2: ISO YYYY-MM-DD or YYYY-MM
    iso_match = re.match(r"^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$", s)
    if iso_match:
        y, m, d = iso_match.groups()
        res = {"year": int(y), "month": int(m)}
        if d:
            res["day"] = int(d)
        return res

    # Case 3: DD Month YYYY (e.g. '13 Apr 1919' or '13 April 1919')
    dmy_match = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", s)
    if dmy_match:
        d, m_str, y = dmy_match.groups()
        m_num = MONTH_MAP.get(m_str.lower())
        if m_num:
            return {"year": int(y), "month": m_num, "day": int(d)}

    # Case 4: Month YYYY (e.g. 'Apr 1919' or 'August 1947')
    my_match = re.match(r"^([A-Za-z]+)\s+(\d{4})$", s)
    if my_match:
        m_str, y = my_match.groups()
        m_num = MONTH_MAP.get(m_str.lower())
        if m_num:
            return {"year": int(y), "month": m_num}

    # Fallback: extract first 3-4 digit year
    year_match = re.search(r"\b(\d{3,4})\b", s)
    if year_match:
        return {"year": int(year_match.group(1))}

    return None


def format_display_date(start_dict: dict | None, end_dict: dict | None = None) -> str:
    """Format start and optional end date dicts into an elegant display string."""
    if not start_dict:
        return ""

    def fmt_single(d):
        y = str(d.get("year", ""))
        m = d.get("month")
        day = d.get("day")
        if not m:
            return y
        m_name = MONTH_NAMES[int(m) - 1] if (1 <= int(m) <= 12) else str(m)
        if not day:
            return f"{m_name} {y}"
        return f"{int(day):02d} {m_name} {y}"

    start_str = fmt_single(start_dict)
    if not end_dict or not end_dict.get("year"):
        return start_str

    end_str = fmt_single(end_dict)
    return f"{start_str} – {end_str}"


def slugify(text: str) -> str:
    """Generate a clean URL/filename-safe slug from a title string."""
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:60].strip("-")


def build() -> dict:
    """
    Compile all YAML source records into production data files:
    - data/modern.json
    - js/modern-data.js
    """
    ensure_dirs()

    # 1. Load Title & Overview
    title_data = {}
    if TITLE_FILE.exists():
        try:
            with open(TITLE_FILE, "r", encoding="utf-8") as f:
                title_data = yaml.safe_load(f) or {}
        except Exception as e:
            print(f"Warning: Failed to read {TITLE_FILE.name}: {e}")

    # 2. Load Eras
    eras_data = []
    if ERAS_FILE.exists():
        try:
            with open(ERAS_FILE, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if isinstance(data, list):
                    eras_data = data
                elif isinstance(data, dict) and "eras" in data:
                    eras_data = data["eras"]
        except Exception as e:
            print(f"Warning: Failed to read {ERAS_FILE.name}: {e}")

    # 3. Load Milestones from content/modern/*.yaml
    events = []
    yaml_files = sorted(list(MODERN_DIR.glob("*.yaml")) + list(MODERN_DIR.glob("*.yml")))

    for yf in yaml_files:
        try:
            with open(yf, "r", encoding="utf-8") as f:
                item = yaml.safe_load(f)
            if not item:
                continue

            s_date = parse_smart_date(item.get("start_date"))
            if not s_date or not s_date.get("year"):
                continue

            e_date = parse_smart_date(item.get("end_date"))
            disp_date = item.get("display_date") or format_display_date(s_date, e_date)

            headline = item.get("headline") or item.get("text", {}).get("headline") or "Untitled Milestone"
            notes = item.get("notes") or item.get("text", {}).get("text") or ""
            book_note = item.get("book_note", "")

            # Construct narrative body with book citation footnote
            body_html = f"<p>{notes}</p>" if notes else ""
            if book_note:
                body_html += f'\n<div class="book-citation"><i data-lucide="book-open" class="w-3.5 h-3.5 text-secondary inline mr-1"></i><strong>Book Note:</strong> {book_note}</div>'

            # Media enhancement
            media = item.get("media") or {}
            media_url = media.get("url", "")
            yt_id = extract_youtube_id(media_url)
            if yt_id and not media.get("thumbnail"):
                media["thumbnail"] = f"https://img.youtube.com/vi/{yt_id}/hqdefault.jpg"

            # Taxonomy assignment
            raw_group = item.get("group", "General")
            raw_subgroup = item.get("subgroup")
            parent_group = raw_group
            subgroup = raw_subgroup

            if raw_group in LEGACY_GROUP_MAP:
                parent_group, default_sub = LEGACY_GROUP_MAP[raw_group]
                if not subgroup:
                    subgroup = default_sub

            event_obj = {
                "id": str(item.get("id") or f"evt_{s_date.get('year', 0)}_{slugify(headline)}"),
                "start_date": {str(k): str(v) for k, v in s_date.items()},
                "text": {
                    "headline": headline,
                    "text": body_html
                },
                "display_date": disp_date,
                "group": parent_group,
                "subgroup": subgroup or parent_group
            }

            if e_date and e_date.get("year"):
                event_obj["end_date"] = {str(k): str(v) for k, v in e_date.items()}

            if media_url:
                event_obj["media"] = media

            bg = item.get("background")
            if bg and (bg.get("color") or bg.get("url")):
                event_obj["background"] = bg

            events.append(event_obj)
        except Exception as err:
            print(f"Warning: Failed to parse {yf.name}: {err}")

    # Chronological sort
    def sort_key(ev):
        sd = ev.get("start_date", {})
        return (int(sd.get("year", 0)), int(sd.get("month", 1)), int(sd.get("day", 1)))

    events.sort(key=sort_key)

    # Master structure
    master_data = {
        "title": title_data,
        "events": events,
        "eras": eras_data,
        "groups": load_swimlanes(),
        "subgroups": load_subgroups()
    }

    # Write data/modern.json
    with open(MODERN_DATA_JSON, "w", encoding="utf-8") as f:
        json.dump(master_data, f, indent=2, ensure_ascii=False)

    # Write js/modern-data.js (offline fallback for direct file:/// access)
    header_comment = """/**
 * Modern History Timeline Data (Offline Fallback & Local Storage)
 * Spectrum's Modern History of India (1707 - 1947)
 * Generated by ChronoLog CMS (chronolog.py)
 */\n"""
    js_content = (
        header_comment
        + "const modernTimelineData = " + json.dumps(master_data, indent=2, ensure_ascii=False) + ";\n\n"
        + "if (typeof window !== 'undefined') {\n  window.modernTimelineData = modernTimelineData;\n}\n"
        + "if (typeof module !== 'undefined' && module.exports) {\n  module.exports = modernTimelineData;\n}\n"
    )
    with open(MODERN_DATA_JS, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f" Build complete:")
    print(f"   -> {len(events)} Milestones compiled")
    print(f"   -> {len(eras_data)} Historical Eras")
    print(f"   -> Output: {MODERN_DATA_JS.relative_to(PROJECT_ROOT)} ({MODERN_DATA_JS.stat().st_size} bytes)")
    print(f"   -> Output: {MODERN_DATA_JSON.relative_to(PROJECT_ROOT)} ({MODERN_DATA_JSON.stat().st_size} bytes)")
    return master_data


def validate() -> bool:
    """Validate all YAML milestones for schema and date validity."""
    ensure_dirs()
    yaml_files = sorted(list(MODERN_DIR.glob("*.yaml")) + list(MODERN_DIR.glob("*.yml")))
    print(f"\nValidating {len(yaml_files)} milestone files...")
    errors = 0

    for yf in yaml_files:
        try:
            with open(yf, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)

            headline = data.get("headline") or data.get("text", {}).get("headline")
            if not headline:
                print(f"❌ {yf.name}: Missing 'headline'")
                errors += 1

            sd = parse_smart_date(data.get("start_date"))
            if not sd or not sd.get("year"):
                print(f"❌ {yf.name}: Missing valid 'start_date.year'")
                errors += 1
        except Exception as e:
            print(f"❌ {yf.name}: YAML parse error: {e}")
            errors += 1

    if errors == 0:
        print(f" All {len(yaml_files)} milestones passed validation!")
    else:
        print(f" Found {errors} validation errors.")
    return errors == 0


def list_events():
    """Print all milestones in a clean formatted table in terminal."""
    if not MODERN_DATA_JSON.exists():
        build()

    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    events = data.get("events", [])
    print("\n" + "=" * 80)
    print(f" CHRONOLOG HISTORICAL MILESTONES ({len(events)} Entries)")
    print("=" * 80)
    print(f"{'YEAR / DATE':<20} | {'GROUP / SWIMLANE':<22} | {'HEADLINE'}")
    print("-" * 80)

    for ev in events:
        date_str = ev.get("display_date") or ev.get("start_date", {}).get("year", "")
        group = ev.get("group", "General")
        headline = ev.get("text", {}).get("headline", "")
        media_url = ev.get("media", {}).get("url", "")
        media_tag = "[Video]" if "youtu" in media_url else ("[Image]" if media_url else "       ")
        try:
            print(f"{date_str:<20} | {group:<22} | {media_tag:<7} {headline}")
        except UnicodeEncodeError:
            clean_date = str(date_str).encode('ascii', 'replace').decode('ascii')
            clean_hl = headline.encode('ascii', 'replace').decode('ascii')
            print(f"{clean_date:<20} | {group:<22} | {media_tag:<7} {clean_hl}")
    print("=" * 80 + "\n")


def add_interactive():
    """Interactive CLI to prompt for a new milestone and save to content/modern/."""
    ensure_dirs()
    print("\n" + "=" * 60)
    print(" ADD NEW HISTORICAL MILESTONE")
    print("=" * 60)

    headline = ""
    while not headline:
        headline = input("1. Milestone Title / Headline: ").strip()

    start_str = ""
    parsed_start = None
    while not parsed_start:
        start_str = input("2. Start Date (e.g. '1919-04-13', '13 Apr 1919', or '1857'): ").strip()
        parsed_start = parse_smart_date(start_str)
        if not parsed_start:
            print("   Invalid date format. Please try again.")

    end_str = input("3. End Date (Optional for spans/lifespans, press Enter to skip): ").strip()
    parsed_end = parse_smart_date(end_str) if end_str else None

    print("\nSelect or type a Swimlane Group:")
    for idx, grp in enumerate(PRESET_GROUPS, 1):
        print(f"  [{idx}] {grp}")
    grp_choice = input("Select group number (or type custom name): ").strip()
    if grp_choice.isdigit() and 1 <= int(grp_choice) <= len(PRESET_GROUPS):
        group = PRESET_GROUPS[int(grp_choice) - 1]
    elif grp_choice:
        group = grp_choice
    else:
        group = "General"

    book_chapter = input("4. Book Note / Chapter (e.g. 'Spectrum Chapter 15', press Enter to skip): ").strip()
    media_url = input("5. Media URL (YouTube or image link, press Enter to skip): ").strip()
    media_credit = input("   Media Source / Credit: ").strip() if media_url else ""

    print("6. Historical Notes / Summary (Press Enter twice when done):")
    notes_lines = []
    while True:
        line = input()
        if not line and notes_lines and not notes_lines[-1]:
            break
        if not line and not notes_lines:
            break
        notes_lines.append(line)
    notes = "\n".join(notes_lines).strip()

    year = parsed_start.get("year", 0)
    slug = f"{year}-{slugify(headline)}"
    dest_file = MODERN_DIR / f"{slug}.yaml"

    record = {
        "id": f"evt_{year}_{slugify(headline)[:20]}",
        "headline": headline,
        "start_date": parsed_start,
        "display_date": format_display_date(parsed_start, parsed_end),
        "group": group,
        "notes": notes,
        "book_note": book_chapter,
        "media": {"url": media_url, "credit": media_credit} if media_url else {},
        "background": {"color": "#13161f"}
    }
    if parsed_end:
        record["end_date"] = parsed_end

    with open(dest_file, "w", encoding="utf-8") as f:
        yaml.dump(record, f, allow_unicode=True, sort_keys=False)

    print(f"\n Saved milestone to: {dest_file.relative_to(PROJECT_ROOT)}")
    build()


def serve(port=8000):
    """Start local HTTP dev server and open modern.html in browser."""
    import http.server
    import socketserver
    import webbrowser

    os.chdir(PROJECT_ROOT)
    handler = http.server.SimpleHTTPRequestHandler

    while port < 8020:
        try:
            with socketserver.TCPServer(("", port), handler) as httpd:
                print("\n" + "=" * 60)
                print(f" ChronoLog Local Dev Server")
                print(f" URL: http://localhost:{port}/modern.html")
                print(f" Press Ctrl + C to stop")
                print("=" * 60 + "\n")
                webbrowser.open(f"http://localhost:{port}/modern.html")
                httpd.serve_forever()
                break
        except OSError:
            port += 1


def main():
    parser = argparse.ArgumentParser(
        description="ChronoLog CMS — Historical Content Management & Build Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    subparsers.add_parser("gui", help="Launch native Python Studio GUI")
    subparsers.add_parser("build", help="Compile YAML content into modern-data.js and modern.json")
    subparsers.add_parser("validate", help="Validate all milestone files for syntax & date integrity")
    subparsers.add_parser("list", help="Display all milestones in terminal table")
    subparsers.add_parser("add", help="Interactively create a new historical milestone")

    serve_parser = subparsers.add_parser("serve", help="Start local web server")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default: 8000)")

    args = parser.parse_args()

    if not args.command or args.command == "gui":
        import gui
        gui.main()
    elif args.command == "build":
        build()
    elif args.command == "validate":
        validate()
    elif args.command == "list":
        list_events()
    elif args.command == "add":
        add_interactive()
    elif args.command == "serve":
        serve(args.port)


if __name__ == "__main__":
    main()
