/**
 * TimelineJS Initialization & Google Sheets Live Sync
 */

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1QuhAkXdh-Nl9hpXx9GFqXoQ9zCctbIOnYs5bL7o-owQ/export?format=csv";

// Robust CSV Parser supporting quotes and multi-line text
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.some(cell => cell !== '')) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some(cell => cell !== '')) {
      lines.push(row);
    }
  }
  return lines;
}

// Convert Knight Lab Google Sheet CSV structure to TimelineJS JSON
function csvToTimelineJSON(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return null;

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const col = (name) => headers.indexOf(name);

  const idxYear = col('year');
  const idxMonth = col('month');
  const idxDay = col('day');
  const idxTime = col('time');
  const idxEndYear = col('end year');
  const idxEndMonth = col('end month');
  const idxEndDay = col('end day');
  const idxEndTime = col('end time');
  const idxDisplayDate = col('display date');
  const idxHeadline = col('headline');
  const idxText = col('text');
  const idxMedia = col('media');
  const idxMediaCredit = col('media credit');
  const idxMediaCaption = col('media caption');
  const idxMediaThumbnail = col('media thumbnail');
  const idxType = col('type');
  const idxGroup = col('group');
  const idxBackground = col('background');

  let title = null;
  const events = [];
  const eras = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const headline = r[idxHeadline] || '';
    const text = r[idxText] || '';
    const year = r[idxYear];
    const type = (r[idxType] || '').toLowerCase().trim();

    // Skip empty filler rows
    if (!headline && !text && !year) continue;

    const entry = {
      text: {
        headline: headline,
        text: text ? `<p>${text}</p>` : ''
      }
    };

    if (r[idxDisplayDate]) {
      entry.display_date = r[idxDisplayDate];
    }

    if (r[idxGroup]) {
      entry.group = r[idxGroup];
    }

    if (r[idxBackground]) {
      entry.background = { color: r[idxBackground] };
    }

    if (r[idxMedia]) {
      let mediaUrl = r[idxMedia].trim();
      // Clean YouTube tracking parameters like ?si=... to avoid player configuration errors
      if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
        mediaUrl = mediaUrl.replace(/[\?&]si=[^&]+/, '');
      }
      entry.media = {
        url: mediaUrl,
        credit: r[idxMediaCredit] || '',
        caption: r[idxMediaCaption] || '',
        thumbnail: r[idxMediaThumbnail] || ''
      };
    }

    if (year) {
      entry.start_date = { year: year.trim() };
      if (r[idxMonth]) entry.start_date.month = r[idxMonth].trim();
      if (r[idxDay]) entry.start_date.day = r[idxDay].trim();
      if (r[idxTime]) {
        const parts = r[idxTime].split(':');
        entry.start_date.hour = parts[0] || '0';
        entry.start_date.minute = parts[1] || '0';
      }
    }

    if (r[idxEndYear]) {
      entry.end_date = { year: r[idxEndYear].trim() };
      if (r[idxEndMonth]) entry.end_date.month = r[idxEndMonth].trim();
      if (r[idxEndDay]) entry.end_date.day = r[idxEndDay].trim();
      if (r[idxEndTime]) {
        const parts = r[idxEndTime].split(':');
        entry.end_date.hour = parts[0] || '0';
        entry.end_date.minute = parts[1] || '0';
      }
    }

    // Only the first title entry acts as the timeline title slide;
    // subsequent entries marked title are treated as standard events so no data is lost.
    if (type === 'title' && !title) {
      title = entry;
    } else if (type === 'era') {
      eras.push(entry);
    } else {
      events.push(entry);
    }
  }

  return { title, events, eras };
}

function renderTimeline(data, isLive = false) {
  const eventCountEl = document.getElementById('event-count');
  if (eventCountEl && data.events) {
    eventCountEl.textContent = `${data.events.length} Historical Milestones`;
  }

  if (typeof TL !== 'undefined') {
    const timelineOptions = {
      hash_bookmark: false,
      initial_zoom: 2,
      scale_factor: 1.5,
      timenav_position: 'bottom',
      optimal_tick_width: 80,
      duration: 500
    };

    window.timeline = new TL.Timeline('timeline-embed', data, timelineOptions);
  }
}

// Data Resolution Priority:
// 1. localStorage (Instant live preview from ChronoLog Studio in current browser)
// 2. modernTimelineData (Master curated data from js/modern-data.js on disk & GitHub Pages)
// 3. Google Sheets CSV (Cloud backup)
async function loadTimelineData() {
  // 1. Check localStorage for instant live updates
  const localSaved = localStorage.getItem('chronolog_modern_events');
  if (localSaved) {
    try {
      const parsedEvents = JSON.parse(localSaved);
      if (Array.isArray(parsedEvents) && parsedEvents.length > 0) {
        const fullData = {
          title: (typeof modernTimelineData !== 'undefined' && modernTimelineData.title) ? modernTimelineData.title : {
            text: {
              headline: "Modern History (1707 – 1947)",
              text: "<p>Spectrum’s Modern History covers the history of India from the decline of the Mughal Empire to Independence (1707 to 1947).</p>"
            }
          },
          events: parsedEvents
        };
        renderTimeline(fullData, true);
        return;
      }
    } catch (e) {
      console.warn('Could not parse localStorage events:', e);
    }
  }

  // 2. Local modern-data.js master dataset
  if (typeof modernTimelineData !== 'undefined' && modernTimelineData.events && modernTimelineData.events.length > 0) {
    renderTimeline(modernTimelineData, false);
    return;
  }

  // 3. Fall back to Google Sheet if local data is not available
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL, { cache: 'no-cache' });
    if (res.ok) {
      const csvText = await res.text();
      const parsedData = csvToTimelineJSON(csvText);
      if (parsedData && parsedData.events && parsedData.events.length > 0) {
        renderTimeline(parsedData, true);
        return;
      }
    }
    throw new Error('Failed to parse remote Google Sheet');
  } catch (err) {
    console.warn('Could not fetch Google Sheet:', err);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  loadTimelineData();

  // Instant Cross-Tab Live Sync from ChronoLog Studio
  window.addEventListener('storage', function (e) {
    if (e.key === 'chronolog_modern_events') {
      console.log('ChronoLog Studio updated events in another tab. Reloading timeline...');
      location.reload();
    }
  });

  if ('BroadcastChannel' in window) {
    try {
      const syncChannel = new BroadcastChannel('chronolog_sync');
      syncChannel.onmessage = function (event) {
        if (event.data && event.data.type === 'UPDATE') {
          console.log('Received live broadcast update from ChronoLog Studio. Refreshing...');
          location.reload();
        }
      };
    } catch (e) {}
  }
});
