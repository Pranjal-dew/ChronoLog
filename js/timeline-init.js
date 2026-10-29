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

function populateCategoryFilter(events) {
  const filterSelect = document.getElementById('category-filter');
  if (!filterSelect || !events) return;

  const groups = [...new Set(events.map(ev => ev.group).filter(Boolean))].sort();
  filterSelect.innerHTML = '<option value="all">All Topics / Swimlanes</option>';
  groups.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    filterSelect.appendChild(opt);
  });

  filterSelect.addEventListener('change', function () {
    const val = this.value;
    if (val === 'all') {
      if (window.timeline) window.timeline.goTo(0);
      return;
    }
    const idx = events.findIndex(ev => ev.group === val);
    if (idx !== -1 && window.timeline) {
      window.timeline.goTo(idx + 1); // +1 because index 0 is the title slide
    }
  });
}

function initFullscreenToggle() {
  const btn = document.getElementById('btn-fullscreen');
  if (!btn) return;

  btn.addEventListener('click', function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
      btn.title = 'Exit Fullscreen (F)';
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
      btn.title = 'Enter Fullscreen (F)';
    }
  });
}

let currentTimelineData = null;
let eraSlideMap = [];

function setupEraNavigation(eras, events) {
  const container = document.getElementById('era-pills-container');
  if (!container) return;
  container.innerHTML = '';
  eraSlideMap = [];

  if (!eras || eras.length === 0) return;

  eras.forEach((era, idx) => {
    const sYear = parseInt(era.start_date?.year, 10) || 0;
    const eYear = parseInt(era.end_date?.year, 10) || 9999;

    // Find the first milestone whose start year falls within [sYear, eYear]
    let firstEventIdx = -1;
    if (events && events.length > 0) {
      firstEventIdx = events.findIndex(ev => {
        const evYear = parseInt(ev.start_date?.year, 10);
        return !isNaN(evYear) && evYear >= sYear && evYear <= eYear;
      });
    }

    const targetSlide = firstEventIdx !== -1 ? firstEventIdx + 1 : 1;
    const cleanHeadline = (era.text?._rawHeadline || era.text?.headline || `Era ${idx + 1}`).replace(/<[^>]*>/g, '').trim();

    eraSlideMap.push({
      eraIndex: idx,
      headline: cleanHeadline,
      startYear: sYear,
      endYear: eYear,
      targetSlide: targetSlide
    });

    const pill = document.createElement('button');
    pill.className = 'era-pill';
    pill.setAttribute('data-era-index', idx);
    pill.setAttribute('type', 'button');
    pill.setAttribute('title', `Jump to Era ${idx + 1}: ${cleanHeadline}`);
    pill.innerHTML = `<span class="era-pill-num">${idx + 1}</span><span class="era-pill-title">${cleanHeadline}</span>`;

    pill.addEventListener('click', () => {
      if (window.timeline) {
        window.timeline.goTo(targetSlide);
        updateActiveEraPill(idx);
        syncActiveSlideContext();
      }
    });

    container.appendChild(pill);
  });
}

function updateActiveEraPill(activeEraIndex) {
  const container = document.getElementById('era-pills-container');
  if (container) {
    const pills = container.querySelectorAll('.era-pill');
    pills.forEach((p, i) => {
      if (i === activeEraIndex) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  // Synchronize active glow on the bottom time axis era bands
  const axisEras = document.querySelectorAll('.tl-timeera');
  axisEras.forEach((el, i) => {
    el.classList.toggle('tl-timeera-active', i === activeEraIndex);
  });
}

function bindAxisEraInteractivity() {
  const axisEras = document.querySelectorAll('.tl-timeera');
  axisEras.forEach((el, idx) => {
    el.setAttribute('data-era-index', idx);
    if (el.dataset.boundClick) return;
    el.dataset.boundClick = 'true';
    if (eraSlideMap[idx]) {
      el.setAttribute('title', `Click to jump to: ${eraSlideMap[idx].headline}`);
    }
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (eraSlideMap[idx] && window.timeline) {
        window.timeline.goTo(eraSlideMap[idx].targetSlide);
        updateActiveEraPill(idx);
        syncActiveSlideContext();
      }
    });
  });
}

function syncActiveSlideContext() {
  if (!window.timeline || !currentTimelineData) return;

  setTimeout(() => {
    let slideObj = null;
    if (typeof window.timeline.getCurrentSlide === 'function') {
      slideObj = window.timeline.getCurrentSlide();
    }

    const currentId = window.timeline.current_id;
    const events = currentTimelineData.events || [];

    // Check if title slide
    const isTitle = (!currentId || (slideObj && slideObj.data && slideObj.data.type === 'title') || (slideObj && slideObj._el && slideObj._el.container && slideObj._el.container.classList.contains('tl-slide-titleslide')));

    if (isTitle) {
      updateActiveEraPill(-1);
      return;
    }

    let currentEvent = events.find(e => e.id === currentId || e.unique_id === currentId);

    // Fallback: match by current slide data or headline text
    if (!currentEvent && slideObj && slideObj.data) {
      currentEvent = events.find(e => e.id === slideObj.data.id || e.text?.headline === slideObj.data.text?.headline);
    }
    if (!currentEvent && events.length > 0) {
      currentEvent = events[0];
    }

    if (currentEvent) {
      const evYear = parseInt(currentEvent.start_date?.data?.year || currentEvent.start_date?.year, 10);
      let matchingEraIdx = eraSlideMap.findIndex(m => evYear >= m.startYear && evYear <= m.endYear);
      if (matchingEraIdx !== -1) {
        updateActiveEraPill(matchingEraIdx);
      }

      // Inject context badges if not already present in the active slide DOM
      const slideEl = slideObj?._el?.container || document.querySelector(`.tl-slide[id*="${currentEvent.unique_id || currentEvent.id || ''}"]`);
      if (slideEl) {
        const headlineEl = slideEl.querySelector('.tl-headline');
        if (headlineEl && !slideEl.querySelector('.slide-context-bar')) {
          const badgeBar = document.createElement('div');
          badgeBar.className = 'slide-context-bar';

          if (matchingEraIdx !== -1 && currentTimelineData.eras && currentTimelineData.eras[matchingEraIdx]) {
            const eraData = currentTimelineData.eras[matchingEraIdx];
            const eraHeadline = eraData.text?.headline || 'Modern Era';
            const eraShort = eraData.text?._titleOnly || eraHeadline.replace(/<[^>]*>/g, '').split('(')[0].trim();
            badgeBar.innerHTML += `<span class="slide-badge slide-badge-era">${eraShort}</span>`;
          }

          if (currentEvent.group) {
            badgeBar.innerHTML += `<span class="slide-badge slide-badge-group">${currentEvent.group}</span>`;
          }

          const rawYear = currentEvent.start_date?.data?.year || currentEvent.start_date?.year || '';
          const dateStr = currentEvent.display_date || rawYear;
          if (dateStr) {
            badgeBar.innerHTML += `<span class="slide-badge slide-badge-date">${dateStr}</span>`;
          }

          headlineEl.parentNode.insertBefore(badgeBar, headlineEl);
        }
      }
    }
  }, 100);
}

function initKeyboardHotkeys() {
  document.addEventListener('keydown', function (e) {
    // Avoid hijacking when typing into form elements
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }

    if (!window.timeline) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      window.timeline.goToNext();
      syncActiveSlideContext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      window.timeline.goToPrev();
      syncActiveSlideContext();
    } else if (e.key === 'Home') {
      e.preventDefault();
      window.timeline.goTo(0);
      syncActiveSlideContext();
    } else if (e.key === 'End') {
      e.preventDefault();
      const total = currentTimelineData && currentTimelineData.events ? currentTimelineData.events.length : 1;
      window.timeline.goTo(total);
      syncActiveSlideContext();
    } else if (e.key === '1') {
      if (eraSlideMap[0]) {
        window.timeline.goTo(eraSlideMap[0].targetSlide);
        updateActiveEraPill(0);
        syncActiveSlideContext();
      }
    } else if (e.key === '2') {
      if (eraSlideMap[1]) {
        window.timeline.goTo(eraSlideMap[1].targetSlide);
        updateActiveEraPill(1);
        syncActiveSlideContext();
      }
    } else if (e.key === '3') {
      if (eraSlideMap[2]) {
        window.timeline.goTo(eraSlideMap[2].targetSlide);
        updateActiveEraPill(2);
        syncActiveSlideContext();
      }
    } else if (e.key === 'f' || e.key === 'F') {
      const btnFullscreen = document.getElementById('btn-fullscreen');
      if (btnFullscreen) btnFullscreen.click();
    }
  });
}

function initStudyLightbox() {
  const dialog = document.getElementById('study-lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const imgEl = document.getElementById('lightbox-img');
  const headlineEl = document.getElementById('lightbox-headline');
  const captionEl = document.getElementById('lightbox-caption');
  const creditEl = document.getElementById('lightbox-credit');

  if (!dialog || !closeBtn || !imgEl) return;

  closeBtn.addEventListener('click', () => {
    dialog.close();
    imgEl.classList.remove('zoomed');
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
      imgEl.classList.remove('zoomed');
    }
  });

  imgEl.addEventListener('click', () => {
    imgEl.classList.toggle('zoomed');
  });

  const embed = document.getElementById('timeline-embed');
  if (embed) {
    embed.addEventListener('click', (e) => {
      const clickedImg = e.target.closest('.tl-media-image img, .tl-media-item img');
      if (!clickedImg) return;

      const mediaContainer = clickedImg.closest('.tl-media');
      const slide = clickedImg.closest('.tl-slide');

      const headline = slide ? (slide.querySelector('.tl-headline')?.textContent || '') : '';
      const caption = mediaContainer ? (mediaContainer.querySelector('.tl-caption')?.textContent || '') : '';
      const credit = mediaContainer ? (mediaContainer.querySelector('.tl-credit')?.textContent || '') : '';

      imgEl.src = clickedImg.src;
      headlineEl.textContent = headline;
      captionEl.textContent = caption;
      creditEl.textContent = credit ? `Source: ${credit}` : '';

      imgEl.classList.remove('zoomed');
      dialog.showModal();
    });
  }
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatToDDMMMYYYY(dateObj) {
  if (!dateObj || !dateObj.year) return '';
  const y = dateObj.year;
  const m = dateObj.month ? parseInt(dateObj.month, 10) : null;
  const d = dateObj.day ? parseInt(dateObj.day, 10) : null;

  if (d && m && m >= 1 && m <= 12) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    return `${dayStr} ${MONTH_ABBR[m - 1]} ${y}`;
  } else if (m && m >= 1 && m <= 12) {
    return `${MONTH_ABBR[m - 1]} ${y}`;
  }
  return `${y}`;
}

function normalizeEventDisplayDates(events) {
  if (!Array.isArray(events)) return;
  events.forEach(ev => {
    if (!ev.display_date && ev.start_date) {
      let formatted = formatToDDMMMYYYY(ev.start_date);
      if (ev.end_date && ev.end_date.year) {
        const endFormatted = formatToDDMMMYYYY(ev.end_date);
        formatted += ` – ${endFormatted}`;
      }
      ev.display_date = formatted;
    }
  });
}

function normalizeEraHeadlines(eras) {
  if (!Array.isArray(eras)) return;
  eras.forEach((era, idx) => {
    if (!era.text) era.text = {};
    const rawHeadline = era.text.headline || `Era ${idx + 1}`;
    const cleanHeadline = rawHeadline.replace(/<[^>]*>/g, '').trim();

    // Match e.g. "Decline of Mughals & Company Rule (1707–1857)"
    const match = cleanHeadline.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    const title = match && match[1] ? match[1].trim() : cleanHeadline;
    const dates = (match && match[2]) ? match[2].trim() : (era.start_date?.year && era.end_date?.year ? `${era.start_date.year} – ${era.end_date.year}` : '');

    era.text._rawHeadline = cleanHeadline;
    era.text._titleOnly = title;
    era.text._dateRange = dates;

    // Structured two-line label for the bottom axis
    if (dates) {
      era.text.headline = `<span class="tl-era-phase-title">${title}</span><span class="tl-era-phase-dates">${dates}</span>`;
    } else {
      era.text.headline = `<span class="tl-era-phase-title">${title}</span>`;
    }
  });
}

function renderTimeline(data, isLive = false) {
  currentTimelineData = data;
  if (data.events) {
    normalizeEventDisplayDates(data.events);
  }
  if (data.eras) {
    normalizeEraHeadlines(data.eras);
  }
  const eventCountEl = document.getElementById('event-count');
  if (eventCountEl && data.events) {
    eventCountEl.textContent = `${data.events.length} Historical Milestones`;
  }

  populateCategoryFilter(data.events);
  setupEraNavigation(data.eras, data.events);

  if (typeof TL !== 'undefined') {
    const timelineOptions = {
      hash_bookmark: false,
      initial_zoom: 2,
      scale_factor: 1.5,
      timenav_position: 'bottom',
      timenav_height_percentage: 42,
      timenav_mobile_height_percentage: 45,
      timenav_height_min: 260,
      marker_width_min: 150,
      slide_padding_lr: 24,
      optimal_tick_width: 100,
      duration: 500
    };

    window.timeline = new TL.Timeline('timeline-embed', data, timelineOptions);

    window.timeline.on('ready', function () {
      syncActiveSlideContext();
      bindAxisEraInteractivity();
    });

    window.timeline.on('change', function () {
      syncActiveSlideContext();
      bindAxisEraInteractivity();
    });
  }
}

// Data Resolution Priority:
// 1. localStorage (Instant live preview from ChronoLog Studio in current browser)
// 2. modernTimelineData (Master curated data from js/modern-data.js on disk & GitHub Pages)
// 3. Google Sheets CSV (Cloud backup)
async function loadTimelineData() {
  const masterEventCount = (typeof modernTimelineData !== 'undefined' && Array.isArray(modernTimelineData.events)) ? modernTimelineData.events.length : 0;

  // 1. Check localStorage for instant live updates (prefer master data if localStorage has stale/fewer events)
  const localSaved = localStorage.getItem('chronolog_modern_events');
  if (localSaved) {
    try {
      const parsedEvents = JSON.parse(localSaved);
      if (Array.isArray(parsedEvents) && parsedEvents.length >= masterEventCount && parsedEvents.length > 0) {
        let activeEras = [];
        const localEras = localStorage.getItem('chronolog_modern_eras');
        if (localEras) {
          try {
            const parsedEras = JSON.parse(localEras);
            if (Array.isArray(parsedEras) && parsedEras.length > 0) activeEras = parsedEras;
          } catch (e) {}
        }
        if (activeEras.length === 0 && typeof modernTimelineData !== 'undefined' && modernTimelineData.eras) {
          activeEras = modernTimelineData.eras;
        }

        const fullData = {
          title: (typeof modernTimelineData !== 'undefined' && modernTimelineData.title) ? modernTimelineData.title : {
            text: {
              headline: "Modern History (1707 – 1947)",
              text: "<p>Spectrum’s Modern History covers the history of India from the decline of the Mughal Empire to Independence (1707 to 1947).</p>"
            }
          },
          events: parsedEvents,
          eras: activeEras
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
  initFullscreenToggle();
  initKeyboardHotkeys();
  initStudyLightbox();
  loadTimelineData();

  // Instant Cross-Tab Live Sync from ChronoLog Studio
  window.addEventListener('storage', function (e) {
    if (e.key === 'chronolog_modern_events' || e.key === 'chronolog_modern_eras') {
      console.log('ChronoLog Studio updated data in another tab. Reloading timeline...');
      location.reload();
    }
  });

  if ('BroadcastChannel' in window) {
    try {
      const syncChannel = new BroadcastChannel('chronolog_sync');
      syncChannel.onmessage = function (event) {
        if (event.data && (event.data.type === 'UPDATE' || event.data.type === 'UPDATE_ERAS')) {
          console.log('Received live broadcast update from ChronoLog Studio. Refreshing...');
          location.reload();
        }
      };
    } catch (e) {}
  }
});
