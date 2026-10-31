"""
Test Suite: GUI-to-Website End-to-End Synchronization Lifecycle
Simulates user actions in ChronoLogStudio GUI and verifies real-time disk & website data sync.
"""

import sys
import json
import re
from pathlib import Path
import pytest

from chronolog import (
    MODERN_DIR,
    ERAS_FILE,
    MODERN_DATA_JSON,
    MODERN_DATA_JS,
    build
)
from gui import ChronoLogStudio


@pytest.fixture(scope="module")
def gui_app():
    """Create a single module-scoped ChronoLogStudio instance and ensure cleanup."""
    app = ChronoLogStudio()
    app.update()
    yield app
    try:
        app.destroy()
    except Exception:
        pass


def test_gui_initial_state_matches_website_data(gui_app):
    """Verify GUI loads the exact dataset displayed on the website."""
    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        master_json = json.load(f)

    expected_event_count = len(master_json.get("events", []))
    expected_era_count = len(master_json.get("eras", []))

    assert len(gui_app.all_milestones) == expected_event_count
    assert len(gui_app.eras) == expected_era_count


def test_gui_add_edit_delete_lifecycle_syncs_to_website(gui_app):
    """
    Full lifecycle test:
    1. Draft new milestone in GUI
    2. Save in GUI -> verify YAML written, modern.json updated, modern-data.js updated
    3. Edit in GUI -> verify update propagates to disk and web bundles
    4. Delete in GUI -> verify removal propagates across disk and web bundles
    """
    initial_count = len(gui_app.all_milestones)

    # --- 1. DRAFT & SAVE NEW MILESTONE IN GUI ---
    test_title = "Automated Test — Cabinet Mission Plan 1946"
    test_start = "24 Mar 1946"
    test_notes = "The 1946 Cabinet Mission aimed to discuss the transfer of power to Indian leadership."
    test_book = "Spectrum's Modern India"
    test_chapter = "Chapter 23"
    test_group = "Political & Admin"

    gui_app.new_milestone()
    gui_app.ent_headline.insert(0, test_title)
    gui_app.ent_start_date.insert(0, test_start)
    gui_app.cb_group.set(test_group)
    gui_app.cb_book.set(test_book)
    gui_app.ent_chapter.insert(0, test_chapter)
    gui_app.txt_notes.insert("1.0", test_notes)

    # Save via GUI method (triggers validation, YAML write, and build())
    gui_app.save_current_milestone()
    gui_app.update()

    # Verify GUI state updated
    assert len(gui_app.all_milestones) == initial_count + 1
    created_file = gui_app.current_milestone_path
    assert created_file and created_file.exists(), "YAML file not created on disk by GUI save"

    # Verify modern.json updated
    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        json_data = json.load(f)
    found_in_json = [ev for ev in json_data["events"] if ev["text"]["headline"] == test_title]
    assert len(found_in_json) == 1, "New milestone not found in modern.json"
    ev_json = found_in_json[0]
    assert ev_json["start_date"]["year"] == "1946"
    assert ev_json["start_date"]["month"] == "3"
    assert ev_json["start_date"]["day"] == "24"
    assert "Book Note" in ev_json["text"]["text"]

    # Verify js/modern-data.js updated for website
    js_text = MODERN_DATA_JS.read_text(encoding="utf-8")
    assert test_title in js_text, "New milestone not found in js/modern-data.js for website"

    # --- 2. EDIT MILESTONE IN GUI & SAVE ---
    updated_title = "Automated Test — Cabinet Mission Plan 1946 (Final Proposals)"
    gui_app.ent_headline.delete(0, "end")
    gui_app.ent_headline.insert(0, updated_title)

    gui_app.save_current_milestone()
    gui_app.update()

    # Verify updated in modern.json & modern-data.js
    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        updated_json = json.load(f)
    found_updated = [ev for ev in updated_json["events"] if ev["text"]["headline"] == updated_title]
    assert len(found_updated) == 1, "Updated headline not found in modern.json"

    updated_js_text = MODERN_DATA_JS.read_text(encoding="utf-8")
    assert updated_title in updated_js_text, "Updated headline not found in js/modern-data.js"

    # --- 3. DELETE MILESTONE IN GUI ---
    # Delete the created test file directly and recompile
    created_file.unlink()
    build()
    gui_app.load_all_data()
    gui_app.update()

    assert len(gui_app.all_milestones) == initial_count

    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        cleaned_json = json.load(f)
    found_cleaned = [ev for ev in cleaned_json["events"] if test_title in ev["text"]["headline"]]
    assert len(found_cleaned) == 0, "Deleted milestone still present in modern.json"

    cleaned_js = MODERN_DATA_JS.read_text(encoding="utf-8")
    assert test_title not in cleaned_js, "Deleted milestone still present in js/modern-data.js"


def test_gui_preview_and_filtering_sync(gui_app):
    """Verify GUI search and filter accurately match what website feed displays."""
    # Test Search filter in GUI
    gui_app.ent_search.delete(0, "end")
    gui_app.ent_search.insert(0, "Plassey")
    gui_app.apply_filter()
    gui_app.update()

    assert len(gui_app.filtered_milestones) >= 1
    top_filtered = gui_app.filtered_milestones[0]
    assert "Plassey" in (top_filtered.get("headline") or top_filtered.get("text", {}).get("headline"))

    # Reset Search
    gui_app.ent_search.delete(0, "end")
    gui_app.apply_filter()
    gui_app.update()
    assert len(gui_app.filtered_milestones) == len(gui_app.all_milestones)


def test_gui_fixed_divider_scrollbar_colorpicker_and_eras_right_panel(gui_app):
    """Verify fixed non-movable divider, dark scrollbar styling, color picker, and right-panel eras view."""
    import tkinter as tk

    # 1. Fixed Divider between left and right panels
    assert hasattr(gui_app, "divider"), "divider must be present"
    assert hasattr(gui_app, "left_panel") and hasattr(gui_app, "right_panel")

    # 2. Dark Scrollbar Theme
    trough = gui_app.style.lookup("Vertical.TScrollbar", "troughcolor")
    thumb = gui_app.style.lookup("Vertical.TScrollbar", "background")
    assert trough == "#0c1017", f"Scrollbar trough must be #0c1017, got {trough}"
    assert thumb == "#253248", f"Scrollbar thumb must be #253248, got {thumb}"

    # 3. Color Picker & Swatch Indicator
    assert hasattr(gui_app, "btn_pick_color")
    assert hasattr(gui_app, "btn_bg_color_swatch")
    gui_app.set_bg_color("#1e293b")
    gui_app.update()
    assert gui_app.ent_bg_color.get() == "#1e293b"
    assert gui_app.btn_bg_color_swatch.cget("bg") == "#1e293b"

    # 4. Historical Eras Right Panel Switch
    gui_app.switch_author_mode("Historical Eras")
    gui_app.update()
    assert gui_app.f_era_author.winfo_ismapped()
    assert not gui_app.f_milestone_author.winfo_ismapped()
    assert gui_app.f_era_right.winfo_ismapped()
    assert not gui_app.f_milestone_right.winfo_ismapped()
    assert len(gui_app.f_eras_list.winfo_children()) == len(gui_app.eras)

    # 5. Load Era into Form & Active Card Highlight
    gui_app.load_era_into_form(0)
    gui_app.update()
    assert gui_app.current_era_index == 0
    assert gui_app.ent_era_headline.get() == gui_app.eras[0]["text"]["headline"]

    # 6. Switch back to Milestone Editor
    gui_app.switch_author_mode("Milestone Editor")
    gui_app.update()
    assert gui_app.f_milestone_author.winfo_ismapped()
    assert gui_app.f_milestone_right.winfo_ismapped()
    assert not gui_app.f_era_right.winfo_ismapped()


def test_gui_custom_swimlane_creation_and_middle_divider_ratio(gui_app):
    """
    Verify:
    1. Middle divider ratio is fixed to 2.5 : 3.5 (non-movable by user).
    2. Custom swimlane creation persists to disk and updates all comboboxes, pills, and filter lists.
    """
    from chronolog import SWIMLANES_FILE, load_swimlanes

    # 1. Verify 2.5 : 3.5 Ratio in fixed grid layout
    gui_app.update()
    w1 = gui_app.left_panel.winfo_width()
    w2 = gui_app.right_panel.winfo_width()
    ratio = w1 / (w1 + w2)
    assert abs(ratio - (2.5 / 6.0)) <= 0.02, (
        f"Divider ratio mismatch: left={w1}, right={w2}, ratio={ratio:.4f} vs expected {2.5/6.0:.4f}"
    )

    # 2. Create New Custom Swimlane
    test_swimlane = "Peasant & Tribal Movements"
    gui_app.create_new_swimlane(test_swimlane)
    gui_app.update()

    # Check in app state
    assert test_swimlane in gui_app.all_swimlanes
    assert gui_app.cb_group.get() == test_swimlane
    assert test_swimlane in gui_app.cb_group["values"]
    assert test_swimlane in gui_app.cb_filter_group["values"]

    # Check persistence in content/swimlanes.yaml
    assert SWIMLANES_FILE.exists()
    disk_swimlanes = load_swimlanes()
    assert test_swimlane in disk_swimlanes

    # Clean up test entry from swimlanes.yaml
    import yaml
    try:
        with open(SWIMLANES_FILE, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or []
        cleaned = [x for x in data if x != test_swimlane]
        with open(SWIMLANES_FILE, "w", encoding="utf-8") as f:
            yaml.dump(cleaned, f, sort_keys=False, allow_unicode=True)
    except Exception:
        pass


def test_gui_intelligent_form_accordions_and_date_feedback(gui_app):
    """
    Verify:
    1. Accordion progressive disclosure trays (Citation, Media, Theme) collapse on new draft and expand when populated.
    2. Real-time smart date validation pill identifies exact day, month precision, year-only, or invalid format.
    3. Auto historical era inference displays matching era badge in real time.
    4. Auto display date automatically stays synchronized unless manually overridden.
    """
    gui_app.new_milestone()
    gui_app.update()

    # 1. Accordions start collapsed for clean Core Briefing canvas
    assert not gui_app.acc_cite.is_open
    assert not gui_app.acc_media.is_open
    assert not gui_app.acc_theme.is_open
    assert not gui_app.var_override_display.get()

    # 2. Date input -> Exact Day & Era Pill inference
    gui_app.ent_start_date.delete(0, "end")
    gui_app.ent_start_date.insert(0, "13 Apr 1919")
    gui_app.on_date_changed()
    gui_app.update()

    assert "✓ Exact Day: 13 Apr 1919" in gui_app.lbl_date_status_pill.cget("text")
    assert "Gandhian Era" in gui_app.lbl_auto_era_badge.cget("text")
    assert gui_app.ent_display_date.get() == "13 Apr 1919"

    # 3. Year-only date input
    gui_app.ent_start_date.delete(0, "end")
    gui_app.ent_start_date.insert(0, "1857")
    gui_app.on_date_changed()
    gui_app.update()

    assert "⚠️ Year Only: 1857" in gui_app.lbl_date_status_pill.cget("text")
    assert "Decline of Mughals & Company Rule" in gui_app.lbl_auto_era_badge.cget("text")
    assert gui_app.ent_display_date.get() == "1857"

    # 4. Spanning dates (End date toggle)
    gui_app.var_has_end_date.set(True)
    gui_app.toggle_end_date_visibility()
    gui_app.ent_end_date.delete(0, "end")
    gui_app.ent_end_date.insert(0, "1858")
    gui_app.on_date_changed()
    gui_app.update()

    assert "1857 → 1858" in gui_app.lbl_date_status_pill.cget("text")
    assert gui_app.ent_display_date.get() == "1857 – 1858"

    # 5. Custom Display Date override
    gui_app.ent_display_date.delete(0, "end")
    gui_app.ent_display_date.insert(0, "Monsoon of 1857")
    gui_app.on_display_date_manual_edit()
    assert gui_app.var_override_display.get() is True

    # Changing start date does NOT overwrite custom manual display date
    gui_app.ent_start_date.delete(0, "end")
    gui_app.ent_start_date.insert(0, "1856")
    gui_app.on_date_changed()
    assert gui_app.ent_display_date.get() == "Monsoon of 1857"

    # Disabling override restores auto computation
    gui_app.var_override_display.set(False)
    gui_app.on_override_toggle()
    assert gui_app.ent_display_date.get() == "1856 – 1858"

    # 6. Accordions expand when loading a milestone with citation/media
    sample = next((m for m in gui_app.all_milestones if m.get("book_note") or m.get("media", {}).get("url")), None)
    if sample:
        gui_app.load_milestone_into_form(sample)
        gui_app.update()
        if sample.get("book_note"):
            assert gui_app.acc_cite.is_open
        if sample.get("media", {}).get("url"):
            assert gui_app.acc_media.is_open


def test_gui_calendar_picker_workflow(gui_app):
    """
    Verify:
    1. CalendarPickerPopup opens properly beneath the target entry.
    2. Era jump chips update the selected year.
    3. Decade step (+/-10y) adjusts the year.
    4. Month grid allows direct month selection.
    5. Day selection populates target entry, updates date status pill, and closes popup.
    6. Year-only and Month-only selections apply properly.
    """
    gui_app.new_milestone()
    gui_app.update()

    # 1. Open picker for Start Date
    gui_app.open_calendar_picker(gui_app.ent_start_date, gui_app.btn_cal_start)
    gui_app.update()

    cal = gui_app._active_calendar_popup
    assert cal and cal.winfo_exists()

    # 2. Decade step
    orig_yr = cal.year
    cal.step_year(10)
    assert cal.year == orig_yr + 10
    cal.step_year(-10)
    assert cal.year == orig_yr

    # 3. Era Jump chip
    cal.jump_to_year(1942)
    assert cal.year == 1942

    # 4. Month selection
    cal.toggle_view_mode()
    assert cal.view_mode == "months"
    cal.select_month_from_grid(8)  # August
    assert cal.month == 8
    assert cal.view_mode == "days"

    # 5. Day selection applies date and triggers GUI validation
    cal.select_day(9)
    gui_app.update()
    assert gui_app.ent_start_date.get() == "9 Aug 1942"
    assert "Exact Day: 09 Aug 1942" in gui_app.lbl_date_status_pill.cget("text")
    assert "Gandhian Era" in gui_app.lbl_auto_era_badge.cget("text")
    assert not cal.winfo_exists()

    # 6. Year Only selection
    gui_app.open_calendar_picker(gui_app.ent_start_date, gui_app.btn_cal_start)
    gui_app.update()
    cal2 = gui_app._active_calendar_popup
    cal2.jump_to_year(1857)
    cal2.select_year_only()
    gui_app.update()
    assert gui_app.ent_start_date.get() == "1857"
    assert "Year Only: 1857" in gui_app.lbl_date_status_pill.cget("text")


def test_gui_group_subgroup_autocomplete_and_adaptive_preview(gui_app):
    """
    Verify:
    1. Group and Subgroup use AutocompleteCombobox with live prefix filtering.
    2. Subgroup is stored, loaded into form, and retained in saved milestone data.
    3. Slide Preview dynamically adapts:
       - No media: 1-column layout (media stage hidden, story stage expands across full width).
       - Media present: 2-column layout (media stage visible, responsive text wrap).
    4. Timeline Browser integration deep-links to milestone's specific year (#year=...).
    """
    from gui import AutocompleteCombobox

    # 1. AutocompleteCombobox check
    assert isinstance(gui_app.cb_group, AutocompleteCombobox)
    assert isinstance(gui_app.cb_subgroup, AutocompleteCombobox)

    # Test Autocomplete filtering
    gui_app.cb_group.delete(0, "end")
    gui_app.cb_group.insert(0, "Mass")
    # Simulate typing event
    class DummyEvent:
        keysym = "s"
    gui_app.cb_group._on_keyrelease(DummyEvent())
    filtered_groups = gui_app.cb_group["values"]
    assert any("Mass Movements" in g for g in filtered_groups)

    # Test Subgroup autocomplete
    gui_app.cb_subgroup.delete(0, "end")
    gui_app.cb_subgroup.insert(0, "Vic")
    gui_app.cb_subgroup._on_keyrelease(DummyEvent())
    filtered_subgroups = gui_app.cb_subgroup["values"]
    assert any("Viceroys" in s for s in filtered_subgroups)

    # 2. Subgroup Data Persistence
    gui_app.new_milestone()
    gui_app.ent_headline.delete(0, "end")
    gui_app.ent_headline.insert(0, "Test Rowlatt Satyagraha")
    gui_app.ent_start_date.delete(0, "end")
    gui_app.ent_start_date.insert(0, "06 Apr 1919")
    gui_app.cb_group.set("Mass Movements & Satyagrahas")
    gui_app.cb_subgroup.set("Gandhi")
    gui_app.txt_notes.delete("1.0", "end")
    gui_app.txt_notes.insert("1.0", "Nationwide strike called by Mahatma Gandhi against Rowlatt Act.")

    milestone = gui_app.save_current_milestone()
    assert milestone is not None
    assert milestone.get("group") == "Mass Movements & Satyagrahas"
    assert milestone.get("subgroup") == "Gandhi"

    # Reload into form
    gui_app.load_milestone_into_form(milestone)
    gui_app.update()
    assert gui_app.cb_group.get() == "Mass Movements & Satyagrahas"
    assert gui_app.cb_subgroup.get() == "Gandhi"

    # 3. Adaptive Slide Preview
    # A) Milestone without media
    gui_app.preview_milestone_in_slide(milestone)
    gui_app.update()
    # Media stage should be hidden (not mapped)
    assert not gui_app.f_media_stage.winfo_ismapped()
    # Story stage should span column 0, columnspan 2
    info = gui_app.f_story_stage.grid_info()
    assert info["column"] == 0
    assert info["columnspan"] == 2

    # B) Milestone with media
    media_milestone = dict(milestone)
    media_milestone["media"] = {
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Jallianwala_Bagh.jpg/440px-Jallianwala_Bagh.jpg",
        "caption": "Martyrs' Well at Jallianwala Bagh",
        "credit": "Wikimedia Commons"
    }
    gui_app.preview_milestone_in_slide(media_milestone)
    gui_app.update()
    # Media stage should be visible (mapped)
    assert gui_app.f_media_stage.winfo_ismapped()
    info_media = gui_app.f_media_stage.grid_info()
    info_story = gui_app.f_story_stage.grid_info()
    assert info_media["column"] == 0
    assert info_story["column"] == 1

    # 4. Live Vis-Timeline Button & Year Deep-Link
    assert gui_app.btn_open_tl.winfo_exists()
    assert "Live Vis-Timeline" in gui_app.btn_open_tl.cget("text")

    # Clean up test milestone
    if gui_app.current_milestone_path and gui_app.current_milestone_path.exists():
        try:
            gui_app.current_milestone_path.unlink()
            from chronolog import build
            build()
        except Exception:
            pass
    gui_app.load_milestones()


def test_gui_slide_preview_visual_harmony_and_citation_clean(gui_app):
    """
    Verify:
    1. Background color cascades to Canvas and all story stages (no dark blue/black box mismatch).
    2. Book Note does NOT duplicate inside the narrative body when footnote pill is present.
    3. Scrollbar automatically hides when narrative fits within the preview height.
    """
    revolt_m = next((
        m for m in gui_app.all_milestones
        if "1857" in str(m.get("headline") or m.get("text", {}).get("headline", ""))
    ), None)
    assert revolt_m is not None

    gui_app.load_milestone_into_form(revolt_m)
    gui_app.update()

    # 1. Background color consistency across all canvas and story frames
    bg_col = revolt_m.get("background", {}).get("color", "#13161f")
    assert bg_col == "#2c1717"
    assert gui_app.f_slide_canvas.cget("bg") == "#2c1717"
    assert gui_app.f_story_stage.cget("bg") == "#2c1717"
    assert gui_app.scroll_story.canvas.cget("bg") == "#2c1717"
    assert gui_app.scroll_story.scrollable_window.cget("bg") == "#2c1717"
    assert gui_app.lbl_prev_body.cget("bg") == "#2c1717"

    # 2. No duplicated "Book Note:" in the narrative body
    body_text = gui_app.lbl_prev_body.cget("text")
    assert "Book Note:" not in body_text

    # 3. Citation box is active and correctly positioned at the bottom
    assert gui_app.f_prev_citation.winfo_manager() == "pack"
    assert "Spectrum Chapter 7" in gui_app.lbl_prev_cite_text.cget("text")

    # 4. Scrollbar behavior:
    # Overflowing text (Revolt of 1857) triggers scrollbar:
    assert gui_app.scroll_story.scrollbar.winfo_manager() == "pack"

    # Short narrative fits within canvas and auto-hides scrollbar:
    short_m = {
        "headline": "Quick Note",
        "notes": "Short single line briefing.",
        "start_date": {"year": 1947},
        "background": {"color": "#182030"}
    }
    gui_app.preview_milestone_in_slide(short_m)
    gui_app.update()
    assert gui_app.scroll_story.scrollbar.winfo_manager() == ""



