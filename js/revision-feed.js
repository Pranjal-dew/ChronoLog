/**
 * ChronoLog Revision Feed & TimelineJS-Inspired Story Carousel
 * Linear, immersive slide-by-slide learning with Prev/Next controls,
 * active recall preview, and interactive bottom timeline scrub strip.
 */

(function () {
  'use strict';

  let allEvents = [];
  let currentFiltered = [];
  let currentSlideIndex = 0;
  let activeSubmode = 'story'; // 'story' | 'grid'

  function getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }

  function getDecadeLabel(yearStr) {
    const y = parseInt(yearStr, 10);
    if (isNaN(y)) return 'Timeline';
    if (y < 1750) return 'Early 18th Century (Decline of Mughals)';
    if (y < 1800) return 'Late 18th Century (Company Ascendancy)';
    if (y < 1850) return 'Early 19th Century (British Expansion)';
    if (y < 1860) return '1850s (The Great Revolt of 1857)';
    if (y < 1885) return '1860s – 1870s (Crown Rule & Early Awakenings)';
    if (y < 1905) return '1880s – 1890s (Birth of INC & Moderate Phase)';
    if (y < 1919) return '1905 – 1918 (Swadeshi & Home Rule Movements)';
    if (y < 1930) return '1919 – 1929 (Rowlatt, Non-Cooperation & Simon Boycott)';
    if (y < 1940) return '1930 – 1939 (Civil Disobedience & Round Table Conferences)';
    return '1940 – 1947 (Quit India, INA & Independence)';
  }

  // =========================================================================
  // 1. TimelineJS Story Slide Renderer (Active Default)
  // =========================================================================
  function renderStorySlide(index) {
    if (currentFiltered.length === 0) {
      const mediaBox = document.getElementById('story-media-box');
      const bodyBox = document.getElementById('story-body-box');
      const headlineEl = document.getElementById('story-headline');
      if (mediaBox) mediaBox.innerHTML = '';
      if (bodyBox) bodyBox.innerHTML = '<p class="empty-feed-state">No milestones match your search.</p>';
      if (headlineEl) headlineEl.textContent = 'No Milestones Found';
      return;
    }

    // Clamp index
    if (index < 0) index = 0;
    if (index >= currentFiltered.length) index = currentFiltered.length - 1;
    currentSlideIndex = index;

    const evt = currentFiltered[index];
    const prevEvt = index > 0 ? currentFiltered[index - 1] : null;
    const nextEvt = index < currentFiltered.length - 1 ? currentFiltered[index + 1] : null;

    // Elements
    const mediaBox = document.getElementById('story-media-box');
    const headlineEl = document.getElementById('story-headline');
    const groupBadge = document.getElementById('story-group-badge');
    const dateBadge = document.getElementById('story-date-badge');
    const indexPill = document.getElementById('story-slide-index');
    const bodyBox = document.getElementById('story-body-box');
    const connectedBox = document.getElementById('story-connected-dots');
    const prevBtn = document.getElementById('story-nav-prev');
    const nextBtn = document.getElementById('story-nav-next');
    const prevLabel = document.getElementById('story-prev-label');
    const nextLabel = document.getElementById('story-next-label');

    const headline = evt.text?.headline || evt.headline || 'Milestone';
    const displayDate = evt.display_date || evt.start_date?.year || 'Historical Date';
    const trackName = evt.subgroup || evt.group || 'Modern History';

    if (headlineEl) headlineEl.textContent = headline;
    if (dateBadge) dateBadge.textContent = displayDate;
    if (groupBadge) groupBadge.textContent = trackName;
    if (indexPill) indexPill.textContent = `${index + 1} / ${currentFiltered.length}`;

    // Render Media (Left Section)
    if (mediaBox) {
      mediaBox.innerHTML = '';
      const mediaUrl = evt.media?.url;
      if (mediaUrl) {
        const ytId = getYouTubeId(mediaUrl);
        if (ytId) {
          mediaBox.innerHTML = `
            <div class="modal-video-box">
              <div class="video-responsive-wrapper">
                <iframe src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1" title="${headline}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
              </div>
              ${evt.media?.caption ? `<div class="modal-media-caption">${evt.media.caption}</div>` : ''}
              <div class="modal-media-meta">
                ${evt.media?.credit ? `<span class="modal-media-credit">${evt.media.credit}</span>` : ''}
                <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener noreferrer" class="modal-yt-ext-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube ↗
                </a>
              </div>
            </div>
          `;
        } else {
          mediaBox.innerHTML = `
            <div class="modal-image-box">
              <div class="modal-image-wrapper">
                <img src="${mediaUrl}" alt="${headline}" loading="lazy" />
              </div>
              ${evt.media?.caption ? `<div class="modal-media-caption">${evt.media.caption}</div>` : ''}
              ${evt.media?.credit ? `<div class="modal-media-credit">${evt.media.credit}</div>` : ''}
            </div>
          `;
        }
      } else {
        mediaBox.innerHTML = `
          <div class="modal-no-media-seal">
            <div class="seal-icon">📜</div>
            <div class="seal-title">Archival Record</div>
            <div class="seal-subtitle">${trackName}</div>
            <div class="seal-year">${displayDate}</div>
          </div>
        `;
      }
    }

    // Render Narrative Body & Spectrum Notes (Right Section)
    if (bodyBox) {
      let bodyHtml = evt.text?.text || evt.notes || '<p>Archival milestone in Indian Modern History.</p>';
      if (evt.book_note && !bodyHtml.includes('book-citation')) {
        bodyHtml += `\n<div class="book-citation"><strong>Book Note:</strong> ${evt.book_note}</div>`;
      }
      bodyBox.innerHTML = bodyHtml;
    }

    // Connected Dots Chips
    if (connectedBox) {
      connectedBox.innerHTML = '';
      const relationships = window.chronoLog?.getConnectedDots ? window.chronoLog.getConnectedDots(evt.id) : [];
      if (relationships && relationships.length > 0) {
        connectedBox.innerHTML = `
          <div class="story-connected-title">🔗 Connected Dots:</div>
          <div class="modal-connected-pills">
            ${relationships.map(rel => `
              <button class="modal-connected-pill" data-event-id="${rel.id}" title="${rel.headline}">
                <span>${rel.headline}</span>
                <span class="pill-date">(${rel.display_date || rel.start_date?.year})</span>
              </button>
            `).join('')}
          </div>
        `;
        connectedBox.querySelectorAll('.modal-connected-pill').forEach(pill => {
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = pill.getAttribute('data-event-id');
            const targetIdx = currentFiltered.findIndex(item => item.id === targetId);
            if (targetIdx !== -1) {
              renderStorySlide(targetIdx);
            } else if (window.chronoLog?.selectEventById) {
              window.chronoLog.selectEventById(targetId);
            }
          });
        });
      }
    }

    // Update Prev / Next Buttons & Preview Labels
    if (prevBtn) {
      prevBtn.disabled = index === 0;
      prevBtn.classList.toggle('disabled', index === 0);
    }
    if (nextBtn) {
      nextBtn.disabled = index === currentFiltered.length - 1;
      nextBtn.classList.toggle('disabled', index === currentFiltered.length - 1);
    }
    if (prevLabel) {
      if (prevEvt) {
        const prevTitle = prevEvt.text?.headline || prevEvt.headline || 'Previous';
        const prevYear = prevEvt.start_date?.year || '';
        prevLabel.textContent = `${prevYear ? prevYear + ': ' : ''}${prevTitle}`;
      } else {
        prevLabel.textContent = 'Start of Timeline';
      }
    }
    if (nextLabel) {
      if (nextEvt) {
        const nextTitle = nextEvt.text?.headline || nextEvt.headline || 'Next';
        const nextYear = nextEvt.start_date?.year || '';
        nextLabel.textContent = `${nextYear ? nextYear + ': ' : ''}${nextTitle}`;
      } else {
        nextLabel.textContent = 'End of Timeline';
      }
    }

    // Update Bottom Scrub Strip Active Tick & Auto-scroll
    updateScrubStripActive(index);
  }

  // =========================================================================
  // 2. TimelineJS Bottom Scrub Strip Navigator
  // =========================================================================
  function renderScrubStrip() {
    const strip = document.getElementById('story-scrub-strip');
    if (!strip) return;

    if (currentFiltered.length === 0) {
      strip.innerHTML = '<span class="strip-empty">No milestones</span>';
      return;
    }

    strip.innerHTML = currentFiltered.map((evt, idx) => {
      const year = evt.start_date?.year || evt.display_date || 'Date';
      const headline = evt.text?.headline || evt.headline || 'Milestone';
      const isActive = idx === currentSlideIndex;
      return `
        <button class="strip-tick-item ${isActive ? 'active' : ''}" data-slide-index="${idx}" title="${year}: ${headline}">
          <span class="strip-tick-pin"></span>
          <span class="strip-tick-year">${year}</span>
          <span class="strip-tick-title">${headline}</span>
        </button>
      `;
    }).join('');

    strip.querySelectorAll('.strip-tick-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-slide-index'), 10);
        if (!isNaN(idx)) {
          renderStorySlide(idx);
        }
      });
    });
  }

  function updateScrubStripActive(index) {
    const strip = document.getElementById('story-scrub-strip');
    if (!strip) return;

    strip.querySelectorAll('.strip-tick-item').forEach((btn, idx) => {
      const isActive = idx === index;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  function cleanSnippetText(rawHtml) {
    if (!rawHtml) return '';
    const temp = document.createElement('div');
    temp.innerHTML = rawHtml;
    // Remove citation block so it doesn't pollute the narrative preview
    temp.querySelectorAll('.book-citation').forEach(el => el.remove());
    const text = temp.textContent || temp.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  function getBookCitationNote(evt) {
    if (evt.book_note) return evt.book_note;
    if (evt.text?.text && evt.text.text.includes('book-citation')) {
      const temp = document.createElement('div');
      temp.innerHTML = evt.text.text;
      const citation = temp.querySelector('.book-citation');
      if (citation) {
        return citation.textContent.replace(/^Book Note:\s*/i, '').trim();
      }
    }
    return null;
  }

  // =========================================================================
  // 3. Overview Decade Grid View
  // =========================================================================
  function renderGridView(eventsToRender) {
    const feedContainer = document.getElementById('revision-feed-container');
    if (!feedContainer) return;

    if (!eventsToRender || eventsToRender.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-feed-state">
          <p>No historical milestones match your search.</p>
        </div>
      `;
      return;
    }

    // Group events by era/decade bucket
    const grouped = new Map();
    eventsToRender.forEach(evt => {
      const label = getDecadeLabel(evt.start_date?.year);
      if (!grouped.has(label)) {
        grouped.set(label, []);
      }
      grouped.get(label).push(evt);
    });

    let html = '';

    grouped.forEach((eventsInBucket, bucketTitle) => {
      html += `
        <section class="feed-era-section">
          <div class="feed-era-header">
            <span class="feed-era-dot"></span>
            <h3 class="feed-era-title">${bucketTitle}</h3>
            <span class="feed-era-count">${eventsInBucket.length} events</span>
          </div>
          <div class="feed-cards-grid">
      `;

      eventsInBucket.forEach(evt => {
        const headline = evt.text?.headline || evt.headline || 'Milestone';
        const displayDate = evt.display_date || evt.start_date?.year || 'Historical Date';
        const group = evt.group || 'General';
        const hasMedia = !!evt.media?.url;
        const ytId = hasMedia ? getYouTubeId(evt.media.url) : null;
        const isYT = !!ytId;
        const bookNote = getBookCitationNote(evt);
        const snippetText = cleanSnippetText(evt.text?.text || evt.notes || '');

        let citationBadge = '';
        if (bookNote) {
          citationBadge = `<span class="badge-citation" title="Book Note from Spectrum">📖 Spectrum Note</span>`;
        }

        let mediaPill = '';
        if (isYT) {
          mediaPill = `<span class="badge-yt" title="Includes YouTube Clip">🎥 Video</span>`;
        } else if (hasMedia) {
          mediaPill = `<span class="badge-img" title="Archival Image">🖼️ Photo</span>`;
        }

        // Thumbnail preview header for grid cards
        let mediaHeader = '';
        if (isYT) {
          mediaHeader = `
            <div class="feed-card-thumb feed-card-thumb-video">
              <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="${headline}" loading="lazy" />
              <div class="feed-card-thumb-play" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
              </div>
            </div>
          `;
        } else if (hasMedia) {
          mediaHeader = `
            <div class="feed-card-thumb">
              <img src="${evt.media.url}" alt="${headline}" loading="lazy" />
            </div>
          `;
        }

        // Dedicated Book Note footer row if exists
        let citationRow = '';
        if (bookNote) {
          citationRow = `
            <div class="feed-card-book-note">
              <span class="book-note-label">Spectrum:</span>
              <span class="book-note-val">${bookNote}</span>
            </div>
          `;
        }

        html += `
          <article class="feed-card" data-event-id="${evt.id}" tabindex="0" role="button" aria-label="Open ${headline}">
            ${mediaHeader}
            <div class="feed-card-inner">
              <div class="feed-card-header">
                <span class="feed-card-date">${displayDate}</span>
                <div class="feed-card-badges">
                  ${mediaPill}
                  ${citationBadge}
                  <span class="feed-group-tag">${group}</span>
                </div>
              </div>
              <h4 class="feed-card-title">${headline}</h4>
              <p class="feed-card-snippet">${snippetText}</p>
              ${citationRow}
              <div class="feed-card-footer">
                <span class="feed-inspect-prompt">Read Story Slide →</span>
              </div>
            </div>
          </article>
        `;
      });

      html += `
          </div>
        </section>
      `;
    });

    feedContainer.innerHTML = html;
    ensureFeedDelegation(feedContainer);
  }

  let feedDelegationAttached = false;
  function ensureFeedDelegation(feedContainer) {
    if (feedDelegationAttached) return;
    feedContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.feed-card');
      if (!card) return;
      const id = card.getAttribute('data-event-id');
      const targetIdx = currentFiltered.findIndex(evt => evt.id === id);
      if (targetIdx !== -1) {
        // Switch to Story Slide and display target
        setSubmode('story');
        renderStorySlide(targetIdx);
      } else if (window.chronoLog?.openDossier) {
        const selected = allEvents.find(evt => evt.id === id);
        if (selected) window.chronoLog.openDossier(selected);
      }
    });

    feedContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.feed-card');
        if (card) {
          e.preventDefault();
          card.click();
        }
      }
    });
    feedDelegationAttached = true;
  }

  // =========================================================================
  // 4. Submode Switcher (Story Mode vs Grid View)
  // =========================================================================
  function setSubmode(mode) {
    activeSubmode = mode;
    const storyContainer = document.getElementById('story-carousel-view');
    const gridContainer = document.getElementById('revision-feed-container');
    const btnStory = document.getElementById('feed-mode-story');
    const btnGrid = document.getElementById('feed-mode-grid');

    if (mode === 'story') {
      storyContainer?.classList.remove('hidden');
      gridContainer?.classList.add('hidden');
      btnStory?.classList.add('active');
      btnStory?.setAttribute('aria-selected', 'true');
      btnGrid?.classList.remove('active');
      btnGrid?.setAttribute('aria-selected', 'false');
      renderStorySlide(currentSlideIndex);
    } else {
      storyContainer?.classList.add('hidden');
      gridContainer?.classList.remove('hidden');
      btnGrid?.classList.add('active');
      btnGrid?.setAttribute('aria-selected', 'true');
      btnStory?.classList.remove('active');
      btnStory?.setAttribute('aria-selected', 'false');
      renderGridView(currentFiltered);
    }
  }

  function setupFeedControls() {
    const searchInput = document.getElementById('feed-search-input');
    const groupSelect = document.getElementById('feed-group-filter');
    const btnStory = document.getElementById('feed-mode-story');
    const btnGrid = document.getElementById('feed-mode-grid');
    const prevBtn = document.getElementById('story-nav-prev');
    const nextBtn = document.getElementById('story-nav-next');

    btnStory?.addEventListener('click', () => setSubmode('story'));
    btnGrid?.addEventListener('click', () => setSubmode('grid'));

    prevBtn?.addEventListener('click', () => {
      if (currentSlideIndex > 0) renderStorySlide(currentSlideIndex - 1);
    });

    nextBtn?.addEventListener('click', () => {
      if (currentSlideIndex < currentFiltered.length - 1) renderStorySlide(currentSlideIndex + 1);
    });

    function applyFilter() {
      const q = (searchInput?.value || '').toLowerCase().trim();
      const selectedGrp = groupSelect?.value || 'all';

      currentFiltered = allEvents.filter(evt => {
        const matchesGroup = (selectedGrp === 'all') || (evt.group === selectedGrp) || (evt.subgroup === selectedGrp);
        if (!matchesGroup) return false;

        if (!q) return true;
        const headline = (evt.text?.headline || evt.headline || '').toLowerCase();
        const text = (evt.text?.text || evt.notes || '').toLowerCase();
        const year = (evt.start_date?.year ? String(evt.start_date.year) : '').toLowerCase();
        const dispDate = (evt.display_date || '').toLowerCase();

        return headline.includes(q) || text.includes(q) || year.includes(q) || dispDate.includes(q);
      });

      currentSlideIndex = 0;
      renderScrubStrip();
      if (activeSubmode === 'story') {
        renderStorySlide(0);
      } else {
        renderGridView(currentFiltered);
      }

      const counter = document.getElementById('feed-counter');
      if (counter) {
        counter.textContent = `Showing ${currentFiltered.length} of ${allEvents.length} milestones`;
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
    }

    if (groupSelect) {
      const groups = [...new Set(allEvents.map(e => e.group || e.subgroup).filter(Boolean))].sort();
      groupSelect.innerHTML = '<option value="all">All Swimlanes</option>';
      groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        groupSelect.appendChild(opt);
      });
      groupSelect.addEventListener('change', applyFilter);
    }
  }

  // =========================================================================
  // 5. Public Initialization & Keyboard Shortcuts
  // =========================================================================
  window.renderRevisionFeed = function (events) {
    allEvents = events || (window.chronoLog?.getActiveEvents() || []);
    currentFiltered = [...allEvents];
    setupFeedControls();
    renderScrubStrip();
    setSubmode('story');
    const counter = document.getElementById('feed-counter');
    if (counter) {
      counter.textContent = `Showing ${currentFiltered.length} of ${allEvents.length} milestones`;
    }
  };

  // Wire up view switcher (Canvas vs Feed) and Keyboard Navigation
  document.addEventListener('DOMContentLoaded', () => {
    const btnCanvasView = document.getElementById('btn-view-canvas');
    const btnFeedView = document.getElementById('btn-view-feed');
    const canvasContainer = document.getElementById('view-canvas-wrapper');
    const feedContainer = document.getElementById('view-feed-wrapper');
    const eraSubnav = document.querySelector('.era-subnav');

    function switchView(viewName) {
      if (viewName === 'feed') {
        canvasContainer?.classList.add('hidden');
        eraSubnav?.classList.add('hidden');
        feedContainer?.classList.remove('hidden');
        btnCanvasView?.classList.remove('active');
        btnFeedView?.classList.add('active');
        if (allEvents.length === 0) {
          window.renderRevisionFeed();
        }
      } else {
        feedContainer?.classList.add('hidden');
        eraSubnav?.classList.remove('hidden');
        canvasContainer?.classList.remove('hidden');
        btnFeedView?.classList.remove('active');
        btnCanvasView?.classList.add('active');
      }
    }

    if (btnCanvasView && btnFeedView) {
      btnCanvasView.addEventListener('click', () => switchView('canvas'));
      btnFeedView.addEventListener('click', () => switchView('feed'));
    }

    // Keyboard Shortcuts:
    // 1: Swimlanes | 2: Revision Feed
    // ArrowLeft / ArrowRight: Navigate Story Slides (when revision feed is open)
    window.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;

      if (e.key === '1') {
        switchView('canvas');
        return;
      }
      if (e.key === '2') {
        switchView('feed');
        return;
      }

      // If Feed is visible and not hidden, allow Arrow Left / Right slide navigation
      if (!feedContainer?.classList.contains('hidden') && activeSubmode === 'story') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentSlideIndex > 0) renderStorySlide(currentSlideIndex - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (currentSlideIndex < currentFiltered.length - 1) renderStorySlide(currentSlideIndex + 1);
        }
      }
    });

    // Touch Swipe support on Mobile for Story Slide Stage
    let touchStartX = 0;
    const stage = document.getElementById('story-carousel-view');
    if (stage) {
      stage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      stage.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 50) {
          if (diffX < 0 && currentSlideIndex < currentFiltered.length - 1) {
            renderStorySlide(currentSlideIndex + 1); // Swipe left -> Next
          } else if (diffX > 0 && currentSlideIndex > 0) {
            renderStorySlide(currentSlideIndex - 1); // Swipe right -> Prev
          }
        }
      }, { passive: true });
    }

    // Initial render trigger
    setTimeout(() => {
      window.renderRevisionFeed();
    }, 100);
  });

})();
