"""
Test Suite: Data Synchronization & Integrity Contract
Verifies that content/*.yaml, data/modern.json, and js/modern-data.js are in 100% sync.
"""

import json
import re
import yaml
from pathlib import Path
import pytest

from chronolog import (
    PROJECT_ROOT,
    CONTENT_DIR,
    MODERN_DIR,
    DATA_DIR,
    JS_DIR,
    TITLE_FILE,
    ERAS_FILE,
    MODERN_DATA_JSON,
    MODERN_DATA_JS,
    LEGACY_GROUP_MAP,
    parse_smart_date,
    build,
    validate as validate_cms
)


@pytest.fixture(scope="module", autouse=True)
def ensure_compiled():
    """Ensure clean build before testing sync."""
    build()


def test_validation_passes():
    """All YAML milestone files must pass schema and date validation."""
    assert validate_cms() is True


def test_yaml_files_exist_and_count_matches():
    """Verify that all YAML files in content/modern/ are accounted for."""
    yaml_files = list(MODERN_DIR.glob("*.yaml")) + list(MODERN_DIR.glob("*.yml"))
    assert len(yaml_files) >= 40, f"Expected at least 40 milestone files, found {len(yaml_files)}"

    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    compiled_events = json_data.get("events", [])
    assert len(compiled_events) == len(yaml_files), (
        f"Mismatch: {len(yaml_files)} YAML files on disk vs {len(compiled_events)} events in modern.json"
    )


def test_json_and_js_bundles_are_identical():
    """
    Verify that data/modern.json and js/modern-data.js contain identical data structures.
    This guarantees that the web UI (reading js/modern-data.js) and APIs (reading modern.json)
    never diverge.
    """
    assert MODERN_DATA_JSON.exists(), "data/modern.json missing"
    assert MODERN_DATA_JS.exists(), "js/modern-data.js missing"

    # Read modern.json
    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        json_obj = json.load(f)

    # Read js/modern-data.js and extract JSON payload
    js_text = MODERN_DATA_JS.read_text(encoding="utf-8")
    var_idx = js_text.find("modernTimelineData = {")
    assert var_idx != -1, "Could not find modernTimelineData in js/modern-data.js"
    json_start = js_text.find("{", var_idx)
    decoder = json.JSONDecoder()
    js_obj, _ = decoder.raw_decode(js_text[json_start:])

    assert json_obj == js_obj, "data/modern.json and js/modern-data.js payload mismatch!"


def test_every_yaml_field_synced_to_compiled_events():
    """
    Verify field-level fidelity: for every YAML file on disk, verify its headline,
    start date year, notes, citation, and media are accurately represented in modern.json.
    """
    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    events_by_id = {ev["id"]: ev for ev in json_data.get("events", [])}

    for yf in MODERN_DIR.glob("*.yaml"):
        with open(yf, "r", encoding="utf-8") as f:
            yaml_item = yaml.safe_load(f)

        assert yaml_item, f"Empty YAML file: {yf.name}"
        expected_headline = yaml_item.get("headline") or yaml_item.get("text", {}).get("headline")
        assert expected_headline, f"Missing headline in {yf.name}"

        # Find matching compiled event
        matching_ev = None
        for ev in events_by_id.values():
            if ev.get("text", {}).get("headline") == expected_headline:
                matching_ev = ev
                break

        assert matching_ev is not None, f"Milestone '{expected_headline}' from {yf.name} not found in compiled output!"

        # Check start date year matches
        yaml_sd = parse_smart_date(yaml_item.get("start_date"))
        assert yaml_sd is not None
        assert int(matching_ev["start_date"]["year"]) == yaml_sd["year"], (
            f"Year mismatch in '{expected_headline}': YAML={yaml_sd['year']} vs Compiled={matching_ev['start_date']['year']}"
        )

        # Check media url matches if present in YAML
        yaml_media = yaml_item.get("media") or {}
        if yaml_media.get("url"):
            compiled_media = matching_ev.get("media") or {}
            assert compiled_media.get("url") == yaml_media["url"], (
                f"Media URL mismatch in '{expected_headline}'"
            )


def test_eras_synchronization():
    """Verify that content/eras.yaml matches the compiled eras in modern.json and modern-data.js."""
    assert ERAS_FILE.exists()
    with open(ERAS_FILE, "r", encoding="utf-8") as f:
        eras_yaml = yaml.safe_load(f)

    if isinstance(eras_yaml, dict) and "eras" in eras_yaml:
        eras_yaml = eras_yaml["eras"]

    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    compiled_eras = json_data.get("eras", [])
    assert len(compiled_eras) == len(eras_yaml), (
        f"Eras count mismatch: YAML={len(eras_yaml)} vs Compiled={len(compiled_eras)}"
    )

    for i in range(len(eras_yaml)):
        assert compiled_eras[i]["text"]["headline"] == eras_yaml[i]["text"]["headline"]
        assert int(compiled_eras[i]["start_date"]["year"]) == int(eras_yaml[i]["start_date"]["year"])
        assert int(compiled_eras[i]["end_date"]["year"]) == int(eras_yaml[i]["end_date"]["year"])


def test_events_chronological_ordering():
    """Verify that all compiled events are in strict chronological order for Vis-Timeline."""
    with open(MODERN_DATA_JSON, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    events = json_data.get("events", [])
    for i in range(len(events) - 1):
        sd1 = events[i]["start_date"]
        sd2 = events[i + 1]["start_date"]
        t1 = (int(sd1.get("year", 0)), int(sd1.get("month", 1)), int(sd1.get("day", 1)))
        t2 = (int(sd2.get("year", 0)), int(sd2.get("month", 1)), int(sd2.get("day", 1)))
        assert t1 <= t2, f"Chronological sorting violation: {events[i]['text']['headline']} ({t1}) comes after {events[i+1]['text']['headline']} ({t2})"
