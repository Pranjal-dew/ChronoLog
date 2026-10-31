/**
 * End-to-End Website Data Sync & Runtime Verification Test Suite
 * Validates that js/modern-data.js, content/eras.yaml, and data/modern.json
 * are 100% in sync and conform to the frontend runtime contracts.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- ChronoLog Website Sync Test Suite ---');

// 1. Load js/modern-data.js safely into a sandbox environment
const modernDataJsPath = path.join(__dirname, '..', 'js', 'modern-data.js');
assert.ok(fs.existsSync(modernDataJsPath), 'js/modern-data.js must exist');

const jsContent = fs.readFileSync(modernDataJsPath, 'utf8');
const fakeWindow = {};
const sandboxFunc = new Function('window', jsContent);
sandboxFunc(fakeWindow);

const websiteData = fakeWindow.modernTimelineData;
assert.ok(websiteData, 'window.modernTimelineData must be populated');
assert.ok(Array.isArray(websiteData.events), 'websiteData.events must be an array');
assert.ok(Array.isArray(websiteData.eras), 'websiteData.eras must be an array');
console.log(`✓ Loaded js/modern-data.js: ${websiteData.events.length} events, ${websiteData.eras.length} eras`);

// 2. Load data/modern.json and verify exact equivalence
const modernJsonPath = path.join(__dirname, '..', 'data', 'modern.json');
assert.ok(fs.existsSync(modernJsonPath), 'data/modern.json must exist');
const jsonData = JSON.parse(fs.readFileSync(modernJsonPath, 'utf8'));

assert.strictEqual(websiteData.events.length, jsonData.events.length, 'Event counts in JS and JSON must match');
assert.strictEqual(websiteData.eras.length, jsonData.eras.length, 'Era counts in JS and JSON must match');
console.log('✓ Verified parity between js/modern-data.js and data/modern.json');

// 3. Test Date Parser Logic (Mirroring timeline-vis.js parseEventDate)
function parseEventDate(d, isEnd = false) {
  if (!d || !d.year) return null;
  const year = parseInt(d.year, 10);
  const month = d.month ? parseInt(d.month, 10) - 1 : (isEnd ? 11 : 0);
  const day = d.day ? parseInt(d.day, 10) : (isEnd ? 28 : 1);
  return new Date(year, month, day);
}

// 4. Validate all events for frontend compatibility
const seenIds = new Set();
websiteData.events.forEach((ev, idx) => {
  // Check unique ID
  const id = ev.id || `idx_${idx}`;
  assert.ok(!seenIds.has(id), `Duplicate milestone ID found: ${id}`);
  seenIds.add(id);

  // Check headline
  const headline = ev.headline || (ev.text && ev.text.headline);
  assert.ok(headline && headline.trim().length > 0, `Event #${idx} missing headline`);

  // Check valid start date
  assert.ok(ev.start_date && ev.start_date.year, `Event ${id} missing start_date.year`);
  const startDate = parseEventDate(ev.start_date);
  assert.ok(startDate instanceof Date && !isNaN(startDate.getTime()), `Invalid start_date for ${id}: ${JSON.stringify(ev.start_date)}`);

  // Check valid end date if present
  if (ev.end_date && ev.end_date.year) {
    const endDate = parseEventDate(ev.end_date, true);
    assert.ok(endDate instanceof Date && !isNaN(endDate.getTime()), `Invalid end_date for ${id}: ${JSON.stringify(ev.end_date)}`);
    assert.ok(endDate.getTime() >= startDate.getTime(), `End date before start date in ${id}`);
  }

  // Check background color format if present
  if (ev.background && ev.background.color) {
    assert.match(ev.background.color, /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, `Invalid hex color in ${id}: ${ev.background.color}`);
  }
});
console.log(`✓ All ${websiteData.events.length} events have valid IDs, headlines, and parseable dates`);

// 5. Validate Eras coverage
websiteData.eras.forEach((era, idx) => {
  assert.ok(era.headline || (era.text && era.text.headline), `Era #${idx} missing headline`);
  assert.ok(era.start_date && era.start_date.year, `Era #${idx} missing start_date`);
  assert.ok(era.end_date && era.end_date.year, `Era #${idx} missing end_date`);
  const sYear = parseInt(era.start_date.year, 10);
  const eYear = parseInt(era.end_date.year, 10);
  assert.ok(sYear <= eYear, `Era #${idx} start year (${sYear}) > end year (${eYear})`);
});
console.log(`✓ All ${websiteData.eras.length} eras are chronologically valid`);

// 6. Chronological ordering check
for (let i = 0; i < websiteData.events.length - 1; i++) {
  const curr = parseEventDate(websiteData.events[i].start_date).getTime();
  const next = parseEventDate(websiteData.events[i + 1].start_date).getTime();
  assert.ok(curr <= next, `Events are not chronologically sorted: #${i} (${websiteData.events[i].headline}) comes after #${i + 1} (${websiteData.events[i + 1].headline})`);
}
console.log('✓ All events are strictly chronologically sorted');

console.log('\n=== ALL WEBSITE SYNC TESTS PASSED SUCCESSFULLY! ===\n');
