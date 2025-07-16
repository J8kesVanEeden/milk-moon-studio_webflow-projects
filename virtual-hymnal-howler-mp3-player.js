(function() {
  let hymnList = [];
  let currentIndex = -1;
  let currentSound = null;

  // Helper: Build hymn list from DOM
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

  // Helper: Update the global fixed play bar
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

    // Reset both progress bars and ARIA
    // Desktop
    const timelineProgress = bar.querySelector('.howler-player__timeline-progress[data-howler-control="progress"]');
    if (timelineProgress) {
      timelineProgress.style.width = '0%';
      timelineProgress.setAttribute('aria-valuenow', '0');
    }
    // Mobile
    const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
    const mobileBar = bar.querySelector('.fixed-play-bar_play-bar[data-howler-progress-bar]');
    if (mobileBar) mobileBar.style.width = '0%';
    if (mobileBarWrap) mobileBarWrap.setAttribute('aria-valuenow', '0');
  }

  // Helper: Update per-item play/pause UI
  function updateItemStatus(idx, status) {
    hymnList.forEach((hymn, i) => {
      hymn.el.setAttribute('data-howler-status', i === idx && status === 'playing' ? 'playing' : 'not-playing');
    });
  }

  // Helper: Format seconds as mm:ss
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Play a hymn by index
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
        // Reset both progress bars on end
        const bar = document.querySelector('.fixed-play-bar_wrap');
        // Desktop
        const timelineProgress = bar.querySelector('.howler-player__timeline-progress[data-howler-control="progress"]');
        if (timelineProgress) {
          timelineProgress.style.width = '0%';
          timelineProgress.setAttribute('aria-valuenow', '0');
        }
        // Mobile
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

      // Update time text
      const progressEl = bar.querySelector('[data-howler-info="progress"]');
      if (progressEl) progressEl.textContent = formatTime(current);
      const itemProgress = hymn.el.querySelector('[data-howler-info="progress"]');
      if (itemProgress) itemProgress.textContent = formatTime(current);

      // Desktop progress bar
      const timelineProgress = bar.querySelector('.howler-player__timeline-progress[data-howler-control="progress"]');
      const timeline = bar.querySelector('.howler-player__timeline[data-howler-control="timeline"]');
      if (timelineProgress) {
        timelineProgress.style.width = percent + '%';
        timelineProgress.setAttribute('aria-valuenow', Math.round(percent));
      }
      if (timeline) timeline.setAttribute('aria-valuenow', Math.round(percent));

      // Mobile progress bar
      const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
      const mobileBar = bar.querySelector('.fixed-play-bar_play-bar[data-howler-progress-bar]');
      if (mobileBar) mobileBar.style.width = percent + '%';
      if (mobileBarWrap) mobileBarWrap.setAttribute('aria-valuenow', Math.round(percent));

      requestAnimationFrame(updateProgress);
    }
  }

  function togglePlayPause() {
    if (!currentSound) return;
    if (currentSound.playing()) {
      currentSound.pause();
    } else {
      currentSound.play();
    }
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

  // SEEKING: Click/tap on both progress bars to seek
  function setupTimelineSeek() {
    const bar = document.querySelector('.fixed-play-bar_wrap');
    if (!bar) return;

    // Desktop
    const timeline = bar.querySelector('.howler-player__timeline[data-howler-control="timeline"]');
    if (timeline) {
      timeline.onclick = function(e) {
        if (!currentSound) return;
        const rect = timeline.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const seekTime = percent * (currentSound.duration() || 1);
        currentSound.seek(seekTime);
      };
      timeline.ontouchstart = function(e) {
        if (!currentSound) return;
        const rect = timeline.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const seekTime = percent * (currentSound.duration() || 1);
        currentSound.seek(seekTime);
      };
    }

    // Mobile
    const mobileBarWrap = bar.querySelector('.fixed-play-bar_play-bar_wrap');
    if (mobileBarWrap) {
      mobileBarWrap.onclick = function(e) {
        if (!currentSound) return;
        const rect = mobileBarWrap.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const seekTime = percent * (currentSound.duration() || 1);
        currentSound.seek(seekTime);
      };
      mobileBarWrap.ontouchstart = function(e) {
        if (!currentSound) return;
        const rect = mobileBarWrap.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const seekTime = percent * (currentSound.duration() || 1);
        currentSound.seek(seekTime);
      };
    }
  }

  // Set up all controls in the fixed bar
  function setupFixedBarControls() {
    const bar = document.querySelector('.fixed-play-bar_wrap');
    if (!bar) return;
    bar.querySelectorAll('[data-howler-control="toggle-play"]').forEach(btn => {
      btn.onclick = togglePlayPause;
    });
    bar.querySelectorAll('[data-howler-control="next"]').forEach(btn => {
      btn.onclick = playNext;
    });
    bar.querySelectorAll('[data-howler-control="prev"]').forEach(btn => {
      btn.onclick = playPrev;
    });
    bar.querySelectorAll('[data-howler-control="shuffle"]').forEach(btn => {
      btn.onclick = shufflePlay;
    });
    bar.querySelectorAll('[data-howler-control="replay"]').forEach(btn => {
      btn.onclick = replayCurrent;
    });
    setupTimelineSeek();
  }

  // Set up play/pause for each hymn item
  function setupListPlayButtons() {
    document.querySelectorAll('[data-howler][data-howler-src]').forEach((el, idx) => {
      const playBtn = el.querySelector('.howler-player_button-play');
      const pauseBtn = el.querySelector('.howler-player_button-pause');
      if (playBtn) playBtn.onclick = () => playHymn(idx);
      if (pauseBtn) pauseBtn.onclick = () => {
        if (currentSound && currentSound.playing() && currentIndex === idx) {
          currentSound.pause();
        }
      };
    });
  }

  // Re-initialize after Jetboost/Webflow loads new items
  function reInitHowlerPlayer() {
    hymnList = getHymnList();
    setupFixedBarControls();
    setupListPlayButtons();
  }

  // Listen for Jetboost events (if using Jetboost)
  document.addEventListener('jetboost:filterapplied', reInitHowlerPlayer);
  document.addEventListener('jetboost:pagination', reInitHowlerPlayer);
  document.addEventListener('jetboost:sortapplied', reInitHowlerPlayer); // <-- ADD THIS LINE

  // Also re-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', reInitHowlerPlayer);

})();
