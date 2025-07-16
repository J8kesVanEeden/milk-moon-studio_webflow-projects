(function() {
  let hymnList = [];
  let currentIndex = -1;
  let currentSound = null;

  function getHymnList() {
    return Array.from(document.querySelectorAll('[data-howler][data-howler-src]')).map((el, idx) => ({
      el,
      src: el.getAttribute('data-howler-src'),
      title: el.getAttribute('data-howler-title') || 'Untitled',
      composer: el.getAttribute('data-howler-composer') || '',
      slug: el.getAttribute('data-howler-slug') || '',
      index: idx
    }));
  }

  function updateFixedBar(hymn) {
    const bar = document.querySelector('.fixed-play-bar_wrap');
    if (!bar) return;
    bar.setAttribute('data-howler-status', 'playing');
    bar.style.display = 'flex';
    const titleEl = bar.querySelector('[data-howler-info="title"]');
    if (titleEl) titleEl.textContent = hymn.title;
    const composerEl = bar.querySelector('[data-howler-info="composer"]');
    if (composerEl) composerEl.textContent = hymn.composer;
    const linkEl = bar.querySelector('[data-howler-info="link"]');
    if (linkEl) {
      linkEl.href = hymn.slug ? '/hymn-library/' + hymn.slug : '#';
      linkEl.target = "_blank";
    }
    const progressEl = bar.querySelector('[data-howler-info="progress"]');
    if (progressEl) progressEl.textContent = '0:00';
    const durationEl = bar.querySelector('[data-howler-info="duration"]');
    if (durationEl) durationEl.textContent = '0:00';

    const timelineProgress = bar.querySelector('.howler-player__timeline-progress[data-howler-control="progress"]');
    if (timelineProgress) {
      timelineProgress.style.width = '0%';
      timelineProgress.setAttribute('aria-valuenow', '0');
    }
    const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
    const mobileBar = bar.querySelector('.fixed-play-bar_play-bar[data-howler-progress-bar]');
    if (mobileBar) mobileBar.style.width = '0%';
    if (mobileBarWrap) mobileBarWrap.setAttribute('aria-valuenow', '0');
  }

  function updateItemStatus(idx, status) {
    hymnList.forEach((hymn, i) => {
      hymn.el.setAttribute('data-howler-status', i === idx && status === 'playing' ? 'playing' : 'not-playing');
    });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function playHymn(idx) {
    if (currentSound) {
      currentSound.unload();
      currentSound = null;
    }
    currentIndex = idx;
    const hymn = hymnList[idx];
    if (!hymn) return;
    updateFixedBar(hymn);
    updateItemStatus(idx, 'playing');
    currentSound = new Howl({
      src: [hymn.src],
      html5: true,
      onplay: function() {
        updateProgress();
        document.querySelector('.fixed-play-bar_wrap').setAttribute('data-howler-status', 'playing');
        updateItemStatus(idx, 'playing');
      },
      onpause: function() {
        document.querySelector('.fixed-play-bar_wrap').setAttribute('data-howler-status', 'not-playing');
        updateItemStatus(idx, 'not-playing');
      },
      onend: function() {
        document.querySelector('.fixed-play-bar_wrap').setAttribute('data-howler-status', 'not-playing');
        updateItemStatus(idx, 'not-playing');
        const bar = document.querySelector('.fixed-play-bar_wrap');
        const timelineProgress = bar.querySelector('.howler-player__timeline-progress[data-howler-control="progress"]');
        if (timelineProgress) {
          timelineProgress.style.width = '0%';
          timelineProgress.setAttribute('aria-valuenow', '0');
        }
        const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
        const mobileBar = bar.querySelector('.fixed-play-bar_play-bar[data-howler-progress-bar]');
        if (mobileBar) mobileBar.style.width = '0%';
        if (mobileBarWrap) mobileBarWrap.setAttribute('aria-valuenow', '0');
      },
      onload: function() {
        const bar = document.querySelector('.fixed-play-bar_wrap');
        if (bar) {
          const durationEl = bar.querySelector('[data-howler-info="duration"]');
          if (durationEl) durationEl.textContent = formatTime(currentSound.duration());
        }
        const itemDuration = hymn.el.querySelector('[data-howler-info="duration"]');
        if (itemDuration) itemDuration.textContent = formatTime(currentSound.duration());
      }
    });
    currentSound.play();

    function updateProgress() {
      if (!currentSound || !currentSound.playing()) return;
      const bar = document.querySelector('.fixed-play-bar_wrap');
      const current = currentSound.seek() || 0;
      const duration = currentSound.duration() || 1;
      const percent = Math.min(100, (current / duration) * 100);

      const progressEl = bar.querySelector('[data-howler-info="progress"]');
      if (progressEl) progressEl.textContent = formatTime(current);
      const itemProgress = hymn.el.querySelector('[data-howler-info="progress"]');
      if (itemProgress) itemProgress.textContent = formatTime(current);

      const timelineProgress = bar.querySelector('.howler-player__timeline-progress[data-howler-control="progress"]');
      const timeline = bar.querySelector('.howler-player__timeline[data-howler-control="timeline"]');
      if (timelineProgress) {
        timelineProgress.style.width = percent + '%';
        timelineProgress.setAttribute('aria-valuenow', Math.round(percent));
      }
      if (timeline) timeline.setAttribute('aria-valuenow', Math.round(percent));

      const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
      const mobileBar = bar.querySelector('.fixed-play-bar_play-bar[data-howler-progress-bar]');
      if (mobileBar) mobileBar.style.width = percent + '%';
      if (mobileBarWrap) mobileBarWrap.setAttribute('aria-valuenow', Math.round(percent));

      requestAnimationFrame(updateProgress);
    }
  }

  function togglePlayPause() {
    if (!currentSound) return;
    currentSound.playing() ? currentSound.pause() : currentSound.play();
  }

  function playNext() {
    if (hymnList.length === 0) return;
    let nextIdx = (currentIndex + 1) % hymnList.length;
    playHymn(nextIdx);
  }

  function playPrev() {
    if (hymnList.length === 0) return;
    let prevIdx = (currentIndex - 1 + hymnList.length) % hymnList.length;
    playHymn(prevIdx);
  }

  function shufflePlay() {
    if (hymnList.length <= 1) return;
    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * hymnList.length);
    } while (nextIdx === currentIndex);
    playHymn(nextIdx);
  }

  function replayCurrent() {
    if (currentSound) {
      currentSound.seek(0);
      currentSound.play();
    }
  }

  function setupTimelineSeek() {
    const bar = document.querySelector('.fixed-play-bar_wrap');
    if (!bar) return;

    const timeline = bar.querySelector('.howler-player__timeline[data-howler-control="timeline"]');
    if (timeline) {
      const seekHandler = function(e) {
        if (!currentSound) return;
        const rect = timeline.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        currentSound.seek(percent * (currentSound.duration() || 1));
      };
      timeline.onclick = seekHandler;
      timeline.ontouchstart = seekHandler;
    }

    const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
    if (mobileBarWrap) {
      const seekHandler = function(e) {
        if (!currentSound) return;
        const rect = mobileBarWrap.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        currentSound.seek(percent * (currentSound.duration() || 1));
      };
      mobileBarWrap.onclick = seekHandler;
      mobileBarWrap.ontouchstart = seekHandler;
    }
  }

  function setupFixedBarControls() {
    const bar = document.querySelector('.fixed-play-bar_wrap');
    if (!bar) return;
    bar.querySelectorAll('[data-howler-control="toggle-play"]').forEach(btn => btn.onclick = togglePlayPause);
    bar.querySelectorAll('[data-howler-control="next"]').forEach(btn => btn.onclick = playNext);
    bar.querySelectorAll('[data-howler-control="prev"]').forEach(btn => btn.onclick = playPrev);
    bar.querySelectorAll('[data-howler-control="shuffle"]').forEach(btn => btn.onclick = shufflePlay);
    bar.querySelectorAll('[data-howler-control="replay"]').forEach(btn => btn.onclick = replayCurrent);
    setupTimelineSeek();
  }

  function setupListPlayButtons() {
    hymnList.forEach((hymn, idx) => {
      const playBtn = hymn.el.querySelector('.howler-player_button-play');
      const pauseBtn = hymn.el.querySelector('.howler-player_button-pause');
      
      if (playBtn) {
        // Clear any existing event handlers to prevent duplicates
        playBtn.onclick = null;
        playBtn.onclick = () => playHymn(idx);
      }
      
      if (pauseBtn) {
        // Clear any existing event handlers to prevent duplicates
        pauseBtn.onclick = null;
        pauseBtn.onclick = () => {
          if (currentSound && currentSound.playing() && currentIndex === idx) {
            currentSound.pause();
          }
        };
      }
    });
  }

  function reInitHowlerPlayer() {
    console.log('Reinitializing Howler Player...'); // Debug log
    hymnList = getHymnList();
    setupFixedBarControls();
    setupListPlayButtons();
  }

  // Listen for all Jetboost events
  document.addEventListener('jetboost:filterapplied', reInitHowlerPlayer);
  document.addEventListener('jetboost:pagination', reInitHowlerPlayer);
  document.addEventListener('jetboost:sortapplied', reInitHowlerPlayer);
  document.addEventListener('jetboost:searchapplied', reInitHowlerPlayer); // Also handle search
  document.addEventListener('jetboost:domupdated', reInitHowlerPlayer); // Fallback for any DOM updates

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', reInitHowlerPlayer);

  // Also initialize immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    // Document is still loading, wait for DOMContentLoaded
  } else {
    // Document is already loaded, initialize immediately
    reInitHowlerPlayer();
  }
})();
