/**
 * ChronoLog Custom History Timeline Canvas Engine
 * Dedicated Multi-Swimlane Historical Exploration Board
 * Zero External Dependencies · 60fps Native 2D Navigation · Precision Timestamps
 */

(function () {
  'use strict';

  window.chronoLog = window.chronoLog || {};

  // Global State
  let currentActiveEvents = [];
  let currentActiveEras = [];
  let currentSelectedEventId = null;
  let isModalTransitioning = false;

  // Timeline Engine Configuration & Dimensions
  const MIN_YEAR = 1700;
  const MAX_YEAR = 1950;
  const DEFAULT_ZOOM = 14; // pixels per year
  const MIN_ZOOM = 4.5;
  const MAX_ZOOM = 85;

  let zoomLevel = DEFAULT_ZOOM;
  let activeCategory = 'all';

  // Interaction State
  let isPanningCanvas = false;
  let panStartX = 0;
  let panStartY = 0;
  let panScrollLeft = 0;
  let panScrollTop = 0;

  // Track Definitions & Taxonomy
  const SUBGROUP_ID_MAP = {
    'British PMs': 'sub_pms',
    'Viceroys & Governors-General': 'sub_viceroys',
    'Viceroys': 'sub_viceroys',
    'Acts & Policies': 'sub_acts',
    'Company Rule': 'sub_acts',
    'British': 'sub_acts',
    'National Leaders (Lifespans)': 'sub_leaders',
    'Gandhi': 'sub_leaders',
    'Nehru': 'sub_leaders',
    'Bose': 'sub_leaders',
    'Jannah': 'sub_leaders',
    'Mass Movements & Satyagrahas': 'sub_movements',
    'Movements & Revolts': 'sub_movements',
    'Armed & Revolutionary': 'sub_revolutionary',
    'Incidents': 'sub_revolutionary',
    'Revolt & Resistance': 'sub_revolutionary'
  };

  const TRACK_TAXONOMY = [
    {
      groupId: 'grp_british',
      title: 'British Power & Policy',
      icon: '👑',
      tracks: [
        { id: 'sub_pms', title: 'British Prime Ministers', icon: '🇬🇧', isRuler: true },
        { id: 'sub_viceroys', title: 'Viceroys & Gov-Generals', icon: '🏛️', isRuler: true },
        { id: 'sub_acts', title: 'Imperial Acts & Charters', icon: '📜', isRuler: false }
      ]
    },
    {
      groupId: 'grp_national',
      title: 'Indian Freedom Struggle',
      icon: '✊',
      tracks: [
        { id: 'sub_leaders', title: 'National Leaders (Lifespans)', icon: '🕊️', isLifespan: true },
        { id: 'sub_movements', title: 'Mass Movements & Satyagrahas', icon: '🔥', isRuler: false },
        { id: 'sub_revolutionary', title: 'Armed & Revolutionary', icon: '⚡', isRuler: false }
      ]
    }
  ];

  // Collapsed Parent Groups
  const collapsedGroups = new Set();

  // Causal Network for Connected Dots
  const CAUSAL_RELATIONSHIPS = {
    'evt_1757_plassey': ['evt_1764_buxar', 'evt_1773_regulating_act'],
    'evt_1764_buxar': ['evt_1757_plassey', 'evt_1773_regulating_act'],
    'evt_1773_regulating_act': ['evt_1757_plassey', 'evt_1764_buxar'],
    'evt_1857_revolt': ['ruler_1858_lord-canning'],
    'ruler_1858_lord-canning': ['evt_1857_revolt'],
    'ruler_1899_lord-curzon': ['ruler_1905_lord-minto-ii', 'ruler_1902_arthur-balfour'],
    'ruler_1905_lord-minto-ii': ['ruler_1899_lord-curzon', 'ruler_1908_h-h-asquith'],
    'evt_3_1919': ['ruler_1916_lord-chelmsford', 'ruler_1916_david-lloyd-george', 'evt_0_1869', 'evt_1793266634084'],
    'evt_1793266634084': ['evt_3_1919', 'ruler_1916_lord-chelmsford', 'evt_0_1869'],
    'ruler_1916_lord-chelmsford': ['evt_3_1919', 'evt_1793266634084', 'ruler_1916_david-lloyd-george'],
    'ruler_1916_david-lloyd-george': ['evt_3_1919', 'ruler_1916_lord-chelmsford'],
    'evt_0_1869': ['evt_3_1919', 'evt_1793266634084', 'evt_1793293081440'],
    'evt_1793293081440': ['evt_3_1919'],
    'ruler_1940_winston-churchill': ['evt_1793293081440', 'evt_1793297300650', 'ruler_1936_lord-linlithgow', 'ruler_1943_lord-wavell'],
    'evt_1793297300650': ['ruler_1940_winston-churchill', 'ruler_1943_lord-wavell', 'ruler_1936_lord-linlithgow'],
    'ruler_1947_lord-mountbatten': ['ruler_1945_clement-attlee', 'evt_0_1869', 'evt_1_1889', 'evt_1876_muhammad_ali_jinnah'],
    'ruler_1945_clement-attlee': ['ruler_1947_lord-mountbatten', 'ruler_1940_winston-churchill']
  };

  // Helper Functions: Media & Dates
  function getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }

  function getYouTubeEmbedUrl(url) {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
  }

  function dateToYearFloat(d, isEnd = false) {
    if (!d || !d.year) return null;
    const year = parseInt(d.year, 10);
    const month = d.month ? parseInt(d.month, 10) - 1 : (isEnd ? 11 : 0);
    const day = d.day ? parseInt(d.day, 10) : (isEnd ? 28 : 1);
    return year + (month / 12) + (day / 365);
  }

  function yearToX(yearFloat) {
    return (yearFloat - MIN_YEAR) * zoomLevel;
  }

  function xToYear(x) {
    return MIN_YEAR + (x / zoomLevel);
  }

  function getTrackBadgeLabel(trackId) {
    const map = {
      'sub_pms': 'British Prime Minister',
      'sub_viceroys': 'Viceroy / Governor-General',
      'sub_acts': 'Imperial Charter / Act',
      'sub_leaders': 'National Leader',
      'sub_movements': 'Mass Movement / Satyagraha',
      'sub_revolutionary': 'Armed & Revolutionary',
      'grp_british': 'British Power & Policy',
      'grp_national': 'Indian Freedom Struggle'
    };
    return map[trackId] || 'Historical Milestone';
  }

  // Load Active Dataset
  function loadActiveData() {
    let events = [];
    let eras = [];

    const masterEvents = (typeof modernTimelineData !== 'undefined' && Array.isArray(modernTimelineData.events)) ? modernTimelineData.events : [];
    const masterEras = (typeof modernTimelineData !== 'undefined' && Array.isArray(modernTimelineData.eras)) ? modernTimelineData.eras : [];

    events = masterEvents;
    eras = masterEras;

    const localSaved = localStorage.getItem('chronolog_modern_events');
    const localEras = localStorage.getItem('chronolog_modern_eras');

    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > masterEvents.length) {
          events = parsed;
        }
      } catch (e) {
        console.warn('Could not parse localStorage events:', e);
      }
    }

    if (localEras && eras.length === 0) {
      try {
        const parsedEras = JSON.parse(localEras);
        if (Array.isArray(parsedEras) && parsedEras.length > 0) {
          eras = parsedEras;
        }
      } catch (e) {
        console.warn('Could not parse localStorage eras:', e);
      }
    }

    events.sort((a, b) => {
      const ya = parseInt(a.start_date?.year || '0', 10);
      const yb = parseInt(b.start_date?.year || '0', 10);
      if (ya !== yb) return ya - yb;
      const ma = parseInt(a.start_date?.month || '1', 10);
      const mb = parseInt(b.start_date?.month || '1', 10);
      if (ma !== mb) return ma - mb;
      const da = parseInt(a.start_date?.day || '1', 10);
      const db = parseInt(b.start_date?.day || '1', 10);
      return da - db;
    });

    currentActiveEvents = events;
    currentActiveEras = eras;
    return { events, eras };
  }

  // Hover Card Component HTML
  function createHoverCardComponent(evt, targetTrackId) {
    const headline = evt.text?.headline || evt.headline || 'Historical Milestone';
    const displayDate = evt.display_date || (evt.start_date ? String(evt.start_date.year) : '');
    const trackLabel = getTrackBadgeLabel(targetTrackId);

    let showcaseHtml = '';
    if (evt.media && evt.media.url) {
      const ytId = getYouTubeId(evt.media.url);
      if (ytId) {
        showcaseHtml = `
          <div class="hover-media-wrapper is-video">
            <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="" class="hover-media-img" loading="lazy" />
            <div class="hover-video-badge">
              <span class="hover-play-icon">▶</span>
              <span class="hover-video-label">Video Clip</span>
            </div>
            <span class="hover-media-type-pill">Archival Footage</span>
          </div>`;
      } else {
        showcaseHtml = `
          <div class="hover-media-wrapper is-image">
            <img src="${evt.media.url}" alt="" class="hover-media-img" loading="lazy" onerror="this.onerror=null; this.parentElement.classList.add('is-seal'); this.parentElement.innerHTML='<span class=\\'hover-seal-watermark\\'>📜</span><div class=\\'hover-seal-meta\\'><span class=\\'hover-seal-tag\\'>${trackLabel}</span><span class=\\'hover-seal-sub\\'>Historical Dossier</span></div>';" />
            <span class="hover-media-type-pill">Archival Record</span>
          </div>`;
      }
    } else {
      showcaseHtml = `
        <div class="hover-media-wrapper is-seal">
          <span class="hover-seal-watermark">📜</span>
          <div class="hover-seal-meta">
            <span class="hover-seal-tag">${trackLabel}</span>
            <span class="hover-seal-sub">Historical Dossier</span>
          </div>
        </div>`;
    }

    return `
      <div class="timeline-hover-card">
        <div class="hover-card-showcase">
          ${showcaseHtml}
        </div>
        <div class="hover-card-body">
          <div class="hover-card-meta-row">
            <div class="hover-track-badge">
              <span class="track-dot"></span>
              <span>${trackLabel}</span>
            </div>
            <div class="hover-date-badge">${displayDate}</div>
          </div>
          <div class="hover-card-title">${headline}</div>
          <div class="hover-card-footer">
            <span class="hover-action-hint">Click milestone for dossier</span>
            <span class="hover-action-arrow">→</span>
          </div>
        </div>
      </div>
    `.trim();
  }

  // Lane Allocation Algorithm (Pack items without collisions)
  function allocateTrackLanes(items) {
    const lanes = [];
    const LANE_GAP_PX = 8;

    items.sort((a, b) => a.startX - b.startX);

    items.forEach(item => {
      let placedLane = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= item.startX) {
          placedLane = i;
          lanes[i] = item.startX + item.renderedWidth + LANE_GAP_PX;
          break;
        }
      }
      if (placedLane === -1) {
        placedLane = lanes.length;
        lanes.push(item.startX + item.renderedWidth + LANE_GAP_PX);
      }
      item.laneIndex = placedLane;
    });

    return {
      items,
      laneCount: Math.max(1, lanes.length)
    };
  }

  // Render History Canvas Engine
  function renderHistoryCanvas() {
    const container = document.getElementById('timeline-vis');
    if (!container) return;

    const { events, eras } = loadActiveData();
    const totalStageWidth = Math.max(1200, Math.round((MAX_YEAR - MIN_YEAR) * zoomLevel));

    // Filter events by track or search
    const filteredEvents = activeCategory === 'all'
      ? events
      : events.filter(e => {
          const subKey = e.subgroup || e.group || 'General';
          const trackId = SUBGROUP_ID_MAP[subKey] || ('sub_custom_' + subKey.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
          if (activeCategory === 'grp_british') return ['sub_pms', 'sub_viceroys', 'sub_acts'].includes(trackId);
          if (activeCategory === 'grp_national') return ['sub_leaders', 'sub_movements', 'sub_revolutionary'].includes(trackId);
          return trackId === activeCategory || (e.group || 'General') === activeCategory;
        });

    // Bucket events into tracks
    const trackItemsMap = new Map();
    TRACK_TAXONOMY.forEach(group => {
      group.tracks.forEach(track => {
        trackItemsMap.set(track.id, []);
      });
    });

    filteredEvents.forEach(evt => {
      const subKey = evt.subgroup || evt.group || 'General';
      const trackId = SUBGROUP_ID_MAP[subKey] || 'sub_movements';
      if (!trackItemsMap.has(trackId)) {
        trackItemsMap.set(trackId, []);
      }

      const sYearFloat = dateToYearFloat(evt.start_date, false);
      if (sYearFloat === null) return;

      const hasEnd = evt.end_date && evt.end_date.year;
      const eYearFloat = hasEnd ? dateToYearFloat(evt.end_date, true) : null;
      const isRange = hasEnd && eYearFloat > sYearFloat;

      const startX = yearToX(sYearFloat);
      let renderedWidth = 0;

      if (isRange) {
        const endX = yearToX(eYearFloat);
        renderedWidth = Math.max(50, endX - startX);
      } else {
        const headline = evt.text?.headline || evt.headline || '';
        renderedWidth = Math.min(220, Math.max(60, (headline.length * 6.5) + 24));
      }

      trackItemsMap.get(trackId).push({
        evt,
        trackId,
        isRange,
        startYearFloat: sYearFloat,
        endYearFloat: eYearFloat,
        startX,
        renderedWidth
      });
    });

    // Compute lanes & track heights
    const trackLayouts = new Map();
    TRACK_TAXONOMY.forEach(group => {
      group.tracks.forEach(track => {
        const items = trackItemsMap.get(track.id) || [];
        const layout = allocateTrackLanes(items);
        const LANE_HEIGHT = 34; // 26px pill + 8px gap
        const trackHeight = Math.max(46, layout.laneCount * LANE_HEIGHT + 14);
        trackLayouts.set(track.id, {
          items: layout.items,
          laneCount: layout.laneCount,
          trackHeight
        });
      });
    });

    // Preserve scroll position across re-renders
    const oldViewport = document.getElementById('hist-viewport');
    const prevScrollLeft = oldViewport ? oldViewport.scrollLeft : null;
    const prevScrollTop = oldViewport ? oldViewport.scrollTop : null;

    // 1. Build Left Sidebar HTML
    let sidebarHtml = `
      <div class="hist-sidebar-header">
        <span class="hist-sidebar-title">HISTORICAL SWIMLANES</span>
      </div>
      <div class="hist-sidebar-tracks-list" id="hist-sidebar-tracks-list">
    `;

    TRACK_TAXONOMY.forEach(group => {
      const isCollapsed = collapsedGroups.has(group.groupId);
      sidebarHtml += `
        <div class="hist-group-wrapper ${isCollapsed ? 'is-collapsed' : ''}" data-group-id="${group.groupId}">
          <div class="hist-group-header" data-group-toggle="${group.groupId}">
            <span class="hist-group-chevron">${isCollapsed ? '▶' : '▼'}</span>
            <span class="hist-group-icon">${group.icon}</span>
            <span class="hist-group-title">${group.title}</span>
          </div>
          <div class="hist-group-children" style="${isCollapsed ? 'display: none;' : ''}">
      `;

      group.tracks.forEach(track => {
        const layout = trackLayouts.get(track.id);
        const height = layout ? layout.trackHeight : 46;
        sidebarHtml += `
          <div class="hist-sidebar-track-item" data-track-id="${track.id}" style="height: ${height}px;">
            <span class="hist-track-icon">${track.icon}</span>
            <span class="hist-track-name">${track.title}</span>
          </div>
        `;
      });

      sidebarHtml += `
          </div>
        </div>
      `;
    });
    sidebarHtml += `</div>`;

    // 2. Build Stage Canvas HTML (Grid, Tracks, Laser Guide, Sticky Axis)
    // Year Grid Lines (Major & Minor)
    let gridHtml = '';
    const { tickInterval } = getTickInterval(zoomLevel);
    for (let yr = MIN_YEAR; yr <= MAX_YEAR; yr += tickInterval) {
      const x = Math.round(yearToX(yr));
      const isMajor = (yr % 10 === 0) || (yr === 1757 || yr === 1857 || yr === 1947);
      gridHtml += `
        <div class="hist-grid-line ${isMajor ? 'is-major' : 'is-minor'}" style="left: ${x}px;"></div>
      `;
    }

    // Tracks & Milestone Elements
    let tracksHtml = '';
    TRACK_TAXONOMY.forEach(group => {
      const isCollapsed = collapsedGroups.has(group.groupId);
      tracksHtml += `
        <div class="hist-stage-group ${isCollapsed ? 'is-collapsed' : ''}" data-group-id="${group.groupId}" style="${isCollapsed ? 'display: none;' : ''}">
      `;

      group.tracks.forEach(track => {
        const layout = trackLayouts.get(track.id);
        const height = layout ? layout.trackHeight : 46;

        let milestonesHtml = '';
        if (layout && layout.items) {
          layout.items.forEach(item => {
            const evt = item.evt;
            const topY = item.laneIndex * 34 + 6;
            const headline = evt.text?.headline || evt.headline || 'Milestone';
            const displayDate = evt.display_date || (evt.start_date ? String(evt.start_date.year) : '');

            if (item.isRange) {
              const cleanTitle = headline.replace(/^(Prime Minister|Lord|Sir)\s+/i, '');
              const rulerClass = track.isRuler ? 'is-ruler' : (track.isLifespan ? 'is-lifespan' : '');

              milestonesHtml += `
                <div class="hist-range-bar track-${track.id} ${rulerClass}"
                     data-event-id="${evt.id}"
                     data-track-id="${track.id}"
                     data-start-x="${item.startX}"
                     data-date="${displayDate}"
                     style="left: ${Math.round(item.startX)}px; top: ${topY}px; width: ${Math.round(item.renderedWidth)}px;">
                  <span class="range-cell-title">${cleanTitle}</span>
                </div>
              `;
            } else {
              // Point Milestone: Only the event name
              milestonesHtml += `
                <div class="hist-milestone-pill track-${track.id}"
                     data-event-id="${evt.id}"
                     data-track-id="${track.id}"
                     data-start-x="${item.startX}"
                     data-date="${displayDate}"
                     style="left: ${Math.round(item.startX)}px; top: ${topY}px;">
                  <span class="pill-title">${headline}</span>
                </div>
              `;
            }
          });
        }

        tracksHtml += `
          <div class="hist-stage-track-row track-${track.id}" data-track-id="${track.id}" style="height: ${height}px;">
            ${milestonesHtml}
          </div>
        `;
      });

      tracksHtml += `</div>`;
    });

    // Sticky Date Axis Ticks
    const { labelInterval } = getTickInterval(zoomLevel);
    let axisTicksHtml = '';
    for (let yr = MIN_YEAR; yr <= MAX_YEAR; yr += tickInterval) {
      const x = Math.round(yearToX(yr));
      const showLabel = (yr % labelInterval === 0) || (yr === 1757 || yr === 1857 || yr === 1947);
      axisTicksHtml += `
        <div class="hist-axis-tick ${showLabel ? 'has-label' : ''}" style="left: ${x}px;">
          <div class="hist-axis-mark"></div>
          ${showLabel ? `<span class="hist-axis-year">${yr}</span>` : ''}
        </div>
      `;
    }

    // Assemble Full Canvas Shell
    container.innerHTML = `
      <div class="hist-canvas-shell">
        <!-- Sticky Left Track Sidebar -->
        <aside class="hist-sidebar" id="hist-sidebar">
          ${sidebarHtml}
        </aside>

        <!-- Main Scrollable Stage Viewport -->
        <div class="hist-viewport" id="hist-viewport">
          <div class="hist-stage-canvas" id="hist-stage-canvas" style="width: ${totalStageWidth}px;">
            
            <!-- 1. Vertical Year Grid Layer -->
            <div class="hist-grid-layer" id="hist-grid-layer">
              ${gridHtml}
            </div>

            <!-- 2. Tracks & Milestones Layer -->
            <div class="hist-tracks-layer" id="hist-tracks-layer">
              ${tracksHtml}
            </div>

            <!-- 3. Interactive Laser Drop Line (Milestone to Date Axis Connection) -->
            <div class="hist-laser-guide" id="hist-laser-guide" style="display: none;">
              <div class="hist-laser-beam" id="hist-laser-beam"></div>
              <div class="hist-laser-badge" id="hist-laser-badge"></div>
            </div>

            <!-- 4. Sticky Bottom Date Axis -->
            <nav class="hist-sticky-date-axis" id="hist-sticky-date-axis" style="width: ${totalStageWidth}px;">
              <div class="hist-axis-ticks-container">
                ${axisTicksHtml}
              </div>
            </nav>

          </div>
        </div>

        <!-- Floating Milestone Hover Card Portal -->
        <div class="hist-hover-portal" id="hist-hover-portal" style="display: none;"></div>
      </div>
    `;

    // Restore scroll positions or initial center
    const viewport = document.getElementById('hist-viewport');
    if (viewport) {
      if (prevScrollLeft !== null) {
        viewport.scrollLeft = prevScrollLeft;
        viewport.scrollTop = prevScrollTop;
      } else {
        // Initial center on 1857 (Turning point)
        const targetX = yearToX(1857);
        viewport.scrollLeft = Math.max(0, targetX - viewport.clientWidth / 2);
      }
    }

    // Attach Interactivity
    bindHistoryCanvasEvents();
    updateEventCounter();
  }

  // Adaptive Date Tick & Label Intervals
  function getTickInterval(zoom) {
    if (zoom >= 35) return { tickInterval: 1, labelInterval: 5 };
    if (zoom >= 18) return { tickInterval: 1, labelInterval: 10 };
    if (zoom >= 10) return { tickInterval: 5, labelInterval: 10 };
    if (zoom >= 6) return { tickInterval: 5, labelInterval: 20 };
    return { tickInterval: 10, labelInterval: 25 };
  }

  // Bind All History Canvas Engine Interactions
  function bindHistoryCanvasEvents() {
    const container = document.getElementById('timeline-vis');
    const viewport = document.getElementById('hist-viewport');
    const stageCanvas = document.getElementById('hist-stage-canvas');
    const sidebar = document.getElementById('hist-sidebar');
    const hoverPortal = document.getElementById('hist-hover-portal');
    const laserGuide = document.getElementById('hist-laser-guide');
    const laserBeam = document.getElementById('hist-laser-beam');
    const laserBadge = document.getElementById('hist-laser-badge');

    if (!viewport || !stageCanvas) return;

    // 1. Synchronize Sidebar Scroll with Viewport Scroll
    viewport.addEventListener('scroll', () => {
      if (sidebar) {
        sidebar.scrollTop = viewport.scrollTop;
      }
    });

    // 2. Collapsible Track Group Toggles
    container.querySelectorAll('[data-group-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const groupId = btn.getAttribute('data-group-toggle');
        if (collapsedGroups.has(groupId)) {
          collapsedGroups.delete(groupId);
        } else {
          collapsedGroups.add(groupId);
        }
        renderHistoryCanvas();
      });
    });

    // 3. Milestone Hover & Click Handlers
    container.querySelectorAll('.hist-milestone-pill, .hist-range-bar').forEach(el => {
      const eventId = el.getAttribute('data-event-id');
      const trackId = el.getAttribute('data-track-id');
      const startX = parseFloat(el.getAttribute('data-start-x'));
      const displayDate = el.getAttribute('data-date');
      const evt = currentActiveEvents.find(e => e.id === eventId);

      el.addEventListener('mouseenter', (e) => {
        // Laser Guide Drop Line
        if (laserGuide && laserBeam && laserBadge) {
          const milestoneRect = el.getBoundingClientRect();
          const canvasRect = stageCanvas.getBoundingClientRect();
          const topRel = milestoneRect.bottom - canvasRect.top;

          laserGuide.style.display = 'block';
          laserGuide.style.left = `${Math.round(startX)}px`;
          laserBeam.style.top = `${Math.round(topRel)}px`;
          laserBadge.textContent = displayDate;
        }

        // Hover Card Tooltip
        if (hoverPortal && evt) {
          hoverPortal.innerHTML = createHoverCardComponent(evt, trackId);
          hoverPortal.style.display = 'block';

          const rect = el.getBoundingClientRect();
          const portalWidth = 280;
          let left = rect.left + (rect.width / 2) - (portalWidth / 2);
          let top = rect.top - 240;

          // Clamping to screen boundaries
          if (left < 16) left = 16;
          if (left + portalWidth > window.innerWidth - 16) left = window.innerWidth - portalWidth - 16;
          if (top < 70) top = rect.bottom + 12;

          hoverPortal.style.left = `${Math.round(left)}px`;
          hoverPortal.style.top = `${Math.round(top)}px`;
        }
      });

      el.addEventListener('mouseleave', () => {
        if (laserGuide) laserGuide.style.display = 'none';
        if (hoverPortal) hoverPortal.style.display = 'none';
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (evt) {
          selectEventById(evt.id);
        }
      });
    });

    // 4. Stage Pan Navigation (Click & Drag on empty canvas background)
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hist-milestone-pill, .hist-range-bar, .hist-sticky-date-axis')) return;
      isPanningCanvas = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panScrollLeft = viewport.scrollLeft;
      panScrollTop = viewport.scrollTop;
      document.body.classList.add('is-panning-canvas');
    });

    window.addEventListener('mousemove', (e) => {
      if (isPanningCanvas) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        viewport.scrollLeft = panScrollLeft - dx;
        viewport.scrollTop = panScrollTop - dy;
      }
    });

    window.addEventListener('mouseup', () => {
      if (isPanningCanvas) {
        isPanningCanvas = false;
        document.body.classList.remove('is-panning-canvas');
      }
    });

    // 5. Smooth Zoom via Ctrl + Wheel / Trackpad Pinch
    viewport.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        applyZoom(factor, e.clientX);
      }
    }, { passive: false });
  }

  // Programmatic Zoom Engine
  function applyZoom(scaleFactor, clientX = null) {
    const viewport = document.getElementById('hist-viewport');
    if (!viewport) return;

    const viewportRect = viewport.getBoundingClientRect();
    const anchorClientX = clientX !== null ? clientX : (viewportRect.left + viewportRect.width / 2);
    const stageX = (anchorClientX - viewportRect.left) + viewport.scrollLeft;
    const anchorYear = xToYear(stageX);

    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * scaleFactor));
    if (Math.abs(newZoom - zoomLevel) < 0.05) return;

    zoomLevel = newZoom;
    renderHistoryCanvas();

    // Re-anchor scrollLeft to keep cursor year locked in place
    const updatedViewport = document.getElementById('hist-viewport');
    if (updatedViewport) {
      const newStageX = yearToX(anchorYear);
      updatedViewport.scrollLeft = Math.max(0, newStageX - (anchorClientX - viewportRect.left));
    }
  }

  // Jump smoothly to center a specific historical year
  function jumpToYear(year) {
    const targetX = yearToX(year);
    const viewport = document.getElementById('hist-viewport');
    if (viewport) {
      viewport.scrollTo({
        left: Math.max(0, targetX - viewport.clientWidth / 2),
        behavior: 'smooth'
      });
    }
  }

  // Connected Dots Highlighting
  function highlightConnectedDots(selectedId) {
    document.querySelectorAll('.hist-milestone-pill.is-connected, .hist-range-bar.is-connected').forEach(el => {
      el.classList.remove('is-connected');
    });
    const connectedIds = CAUSAL_RELATIONSHIPS[selectedId] || [];
    connectedIds.forEach(id => {
      const match = document.querySelector(`[data-event-id="${id}"]`);
      if (match) match.classList.add('is-connected');
    });
  }

  // Open & Render Detail Popup Modal
  function openModal(event, direction = null) {
    if (!event) return;
    currentSelectedEventId = event.id;

    const wrapper = document.getElementById('event-modal-wrapper');
    const card = document.getElementById('event-modal-card');
    if (!wrapper || !card) return;

    const isAlreadyOpen = wrapper.classList.contains('open');

    if (direction && isAlreadyOpen && !isModalTransitioning) {
      isModalTransitioning = true;
      const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
      const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

      card.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
      card.classList.add(outClass);

      setTimeout(() => {
        renderModalContent(event);
        card.classList.remove(outClass);
        card.classList.add(inClass);
        void card.offsetWidth;
        card.classList.remove(inClass);
        setTimeout(() => {
          isModalTransitioning = false;
        }, 220);
      }, 130);
    } else {
      renderModalContent(event);
      wrapper.classList.add('open');
      wrapper.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    }
  }

  function renderModalContent(event) {
    const headlineEl = document.getElementById('modal-headline');
    const dateEl = document.getElementById('modal-date');
    const badgeEl = document.getElementById('modal-group-badge');
    const bodyEl = document.getElementById('modal-body');
    const mediaContainer = document.getElementById('modal-media-container');

    const headline = event.text?.headline || event.headline || 'Historical Milestone';
    const displayDate = event.display_date || (event.start_date ? String(event.start_date.year) : '');
    const groupName = event.group || event.subgroup || 'Modern History';
    const bodyHtml = event.text?.text || event.text || '<p>Historical analysis recorded in dossier.</p>';

    if (headlineEl) headlineEl.textContent = headline;
    if (dateEl) dateEl.textContent = displayDate;
    if (badgeEl) badgeEl.textContent = groupName;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;

    // Media Display (YouTube embed or Archival Image)
    if (mediaContainer) {
      mediaContainer.innerHTML = '';
      if (event.media && event.media.url) {
        const ytEmbed = getYouTubeEmbedUrl(event.media.url);
        if (ytEmbed) {
          mediaContainer.innerHTML = `
            <div class="modal-video-wrapper">
              <iframe src="${ytEmbed}" title="${headline}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
        } else {
          mediaContainer.innerHTML = `
            <div class="modal-image-wrapper">
              <img src="${event.media.url}" alt="${headline}" class="modal-archival-image" loading="lazy" />
              ${event.media.caption ? `<p class="modal-media-caption">${event.media.caption}</p>` : ''}
            </div>
          `;
        }
      } else {
        mediaContainer.innerHTML = `
          <div class="modal-empty-media">
            <span class="empty-media-icon">📜</span>
            <span class="empty-media-text">Imperial Archives & Records</span>
          </div>
        `;
      }
    }

    // Connected Dots Inside Modal
    const connectedContainer = document.getElementById('modal-connected-dots');
    if (connectedContainer) {
      connectedContainer.innerHTML = '';
      const relatedIds = CAUSAL_RELATIONSHIPS[event.id] || [];
      const relatedEvents = currentActiveEvents.filter(e => relatedIds.includes(e.id));

      if (relatedEvents.length > 0) {
        connectedContainer.style.display = 'block';
        connectedContainer.innerHTML = `
          <div class="connected-dots-title">🔗 Connected Causes & Consequences:</div>
          <div class="connected-dots-pills">
            ${relatedEvents.map(re => `
              <button class="connected-dot-pill" data-event-id="${re.id}">
                <span class="dot-pill-year">${re.start_date?.year || ''}</span>
                <span class="dot-pill-title">${re.text?.headline || re.headline}</span>
              </button>
            `).join('')}
          </div>
        `;

        connectedContainer.querySelectorAll('.connected-dot-pill').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-event-id');
            selectEventById(targetId);
          });
        });
      } else {
        connectedContainer.style.display = 'none';
      }
    }

    // Modal Flanking Prev / Next Chevrons
    const modalPrevBtn = document.getElementById('modal-btn-prev');
    const modalNextBtn = document.getElementById('modal-btn-next');
    const modalPrevDate = document.getElementById('modal-prev-date');
    const modalPrevTitle = document.getElementById('modal-prev-title');
    const modalNextDate = document.getElementById('modal-next-date');
    const modalNextTitle = document.getElementById('modal-next-title');
    const currentIdx = currentActiveEvents.findIndex(e => e.id === event.id);

    if (modalPrevBtn) {
      const prevEvent = currentIdx > 0 ? currentActiveEvents[currentIdx - 1] : null;
      modalPrevBtn.disabled = !prevEvent;
      modalPrevBtn.classList.toggle('disabled', !prevEvent);
      if (prevEvent) {
        const pYear = prevEvent.display_date || prevEvent.start_date?.year || '';
        const pHead = prevEvent.text?.headline || prevEvent.headline || 'Milestone';
        if (modalPrevDate) modalPrevDate.textContent = pYear;
        if (modalPrevTitle) modalPrevTitle.textContent = pHead;
        modalPrevBtn.title = `Previous: ${pHead} (${pYear}) [← Key]`;
      } else {
        if (modalPrevDate) modalPrevDate.textContent = '';
        if (modalPrevTitle) modalPrevTitle.textContent = 'Beginning of Era';
      }
      modalPrevBtn.onclick = (e) => {
        e.stopPropagation();
        if (prevEvent && !isModalTransitioning) selectEventById(prevEvent.id, 'prev');
      };
    }

    if (modalNextBtn) {
      const nextEvent = (currentIdx >= 0 && currentIdx < currentActiveEvents.length - 1) ? currentActiveEvents[currentIdx + 1] : null;
      modalNextBtn.disabled = !nextEvent;
      modalNextBtn.classList.toggle('disabled', !nextEvent);
      if (nextEvent) {
        const nYear = nextEvent.display_date || nextEvent.start_date?.year || '';
        const nHead = nextEvent.text?.headline || nextEvent.headline || 'Milestone';
        if (modalNextDate) modalNextDate.textContent = nYear;
        if (modalNextTitle) modalNextTitle.textContent = nHead;
        modalNextBtn.title = `Next: ${nHead} (${nYear}) [→ Key]`;
      } else {
        if (modalNextDate) modalNextDate.textContent = '';
        if (modalNextTitle) modalNextTitle.textContent = 'End of Timeline';
      }
      modalNextBtn.onclick = (e) => {
        e.stopPropagation();
        if (nextEvent && !isModalTransitioning) selectEventById(nextEvent.id, 'next');
      };
    }
  }

  function closeModal() {
    const wrapper = document.getElementById('event-modal-wrapper');
    const card = document.getElementById('event-modal-card');
    if (!wrapper) return;
    wrapper.classList.remove('open');
    wrapper.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (card) {
      card.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    }
    isModalTransitioning = false;
    currentSelectedEventId = null;

    const iframe = wrapper.querySelector('iframe');
    if (iframe) iframe.src = '';
  }

  function selectEventById(id, direction = null) {
    const event = currentActiveEvents.find(e => e.id === id);
    if (!event) return;

    highlightConnectedDots(id);
    const startYear = parseInt(event.start_date?.year, 10);
    if (!isNaN(startYear)) {
      jumpToYear(startYear);
    }
    openModal(event, direction);
  }

  // Update Event Counter
  function updateEventCounter() {
    const countEl = document.getElementById('event-count');
    if (countEl) {
      countEl.textContent = `${currentActiveEvents.length} Milestones`;
    }
  }

  // Setup Global Navigation & Filter Listeners
  function setupListeners() {
    // Category Filter Dropdown
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
      categorySelect.innerHTML = `
        <option value="all">All Swimlanes (Complete History)</option>
        <optgroup label="British Power & Policy">
          <option value="grp_british">All British Tracks</option>
          <option value="sub_pms">British Prime Ministers</option>
          <option value="sub_viceroys">Viceroys & Governors-General</option>
          <option value="sub_acts">Imperial Acts & Charters</option>
        </optgroup>
        <optgroup label="Indian Freedom Struggle">
          <option value="grp_national">All Freedom Struggle Tracks</option>
          <option value="sub_leaders">National Leaders (Lifespans)</option>
          <option value="sub_movements">Mass Movements & Satyagrahas</option>
          <option value="sub_revolutionary">Armed & Revolutionary</option>
        </optgroup>
      `;

      categorySelect.addEventListener('change', (e) => {
        activeCategory = e.target.value;
        renderHistoryCanvas();
      });
    }

    // Zoom Controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnFitAll = document.getElementById('btn-fit-all');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => applyZoom(1.3));
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => applyZoom(0.75));
    }
    if (btnFitAll) {
      btnFitAll.addEventListener('click', () => {
        const viewport = document.getElementById('hist-viewport');
        if (viewport) {
          const fitZoom = (viewport.clientWidth - 40) / (MAX_YEAR - MIN_YEAR);
          zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
          renderHistoryCanvas();
          const updatedViewport = document.getElementById('hist-viewport');
          if (updatedViewport) updatedViewport.scrollLeft = 0;
        }
      });
    }

    // Modal Close Button & Backdrop
    const modalClose = document.getElementById('modal-close');
    const modalBackdrop = document.getElementById('modal-backdrop');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    // View Switcher (Swimlanes vs Revision Feed)
    const btnViewCanvas = document.getElementById('btn-view-canvas');
    const btnViewFeed = document.getElementById('btn-view-feed');
    const canvasWrapper = document.getElementById('view-canvas-wrapper');
    const feedWrapper = document.getElementById('view-feed-wrapper');

    function switchView(mode) {
      if (mode === 'canvas') {
        if (canvasWrapper) canvasWrapper.classList.remove('hidden');
        if (feedWrapper) feedWrapper.classList.add('hidden');
        if (btnViewCanvas) btnViewCanvas.classList.add('active');
        if (btnViewFeed) btnViewFeed.classList.remove('active');
        renderHistoryCanvas();
      } else {
        if (canvasWrapper) canvasWrapper.classList.add('hidden');
        if (feedWrapper) feedWrapper.classList.remove('hidden');
        if (btnViewCanvas) btnViewCanvas.classList.remove('active');
        if (btnViewFeed) btnViewFeed.classList.add('active');
        if (window.renderRevisionFeed) {
          window.renderRevisionFeed(currentActiveEvents);
        }
      }
    }

    if (btnViewCanvas) btnViewCanvas.addEventListener('click', () => switchView('canvas'));
    if (btnViewFeed) btnViewFeed.addEventListener('click', () => switchView('feed'));

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;

      const modalWrapper = document.getElementById('event-modal-wrapper');
      const isModalOpen = modalWrapper && modalWrapper.classList.contains('open');

      if (e.key === 'Escape') {
        closeModal();
      } else if (isModalOpen && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const currentIdx = currentActiveEvents.findIndex(evt => evt.id === currentSelectedEventId);
        if (e.key === 'ArrowLeft' && currentIdx > 0) {
          e.preventDefault();
          selectEventById(currentActiveEvents[currentIdx - 1].id, 'prev');
        } else if (e.key === 'ArrowRight' && currentIdx < currentActiveEvents.length - 1) {
          e.preventDefault();
          selectEventById(currentActiveEvents[currentIdx + 1].id, 'next');
        }
      } else if (e.key === '1') {
        switchView('canvas');
      } else if (e.key === '2') {
        switchView('feed');
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    });

    // BroadcastChannel sync from ChronoLog Studio
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('chronolog_sync');
      channel.onmessage = (event) => {
        console.log('⚡ Received sync update from Studio:', event.data);
        loadActiveData();
        renderHistoryCanvas();
        if (window.renderRevisionFeed) {
          window.renderRevisionFeed(currentActiveEvents);
        }
      };
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  }

  // Public API
  window.chronoLog = {
    init: renderHistoryCanvas,
    render: renderHistoryCanvas,
    openModal,
    closeModal,
    selectEventById,
    jumpToYear,
    getActiveEvents: () => currentActiveEvents,
    getActiveEras: () => currentActiveEras
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderHistoryCanvas();
      setupListeners();
    });
  } else {
    renderHistoryCanvas();
    setupListeners();
  }

})();
