(function() {
  let hymnList = [];
  let currentIndex = -1;
  let currentSound = null;
  let observerActive = false;

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
    // FIND THE FIXED PLAYBAR BY ATTRIBUTE
    const bar = document.querySelector('[data-fixed-playbar]');
    
    if (!bar) {
      console.log('❌ No fixed play bar found with [data-fixed-playbar]');
      return;
    }

    // SHOW THE FIXED PLAYBAR - CHANGE FROM DISPLAY NONE TO FLEX
    bar.style.display = 'flex';
    bar.setAttribute('data-howler-status', 'playing');
    
    const titleEl = bar.querySelector('[data-howler-info="title"]');
    if (titleEl) titleEl.textContent = hymn.title;
    
    const composerEl = bar.querySelector('[data-howler-info="composer"]');
    if (composerEl) composerEl.textContent = hymn.composer;
    
    const linkEl = bar.querySelector('[data-howler-info="link"]');
    if (linkEl) {
      const url = hymn.slug ? '/hymn-library/' + hymn.slug : '#';
      
      if (linkEl.tagName === 'A') {
        linkEl.href = url;
        linkEl.target = "_blank";
      } else if (linkEl.tagName === 'BUTTON') {
        linkEl.onclick = function(e) {
          e.preventDefault();
          if (url !== '#') {
            window.open(url, '_blank');
          }
        };
      }
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
    
    console.log('✅ Fixed playbar shown and updated');
  }

  function hideFixedBar() {
    const bar = document.querySelector('[data-fixed-playbar]');
    if (bar) {
      bar.style.display = 'none';
      bar.setAttribute('data-howler-status', 'not-playing');
    }
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
    console.log('🎵 playHymn called with index:', idx);
    
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
        const bar = document.querySelector('[data-fixed-playbar]');
        if (bar) bar.setAttribute('data-howler-status', 'playing');
        updateItemStatus(idx, 'playing');
      },
      onpause: function() {
        const bar = document.querySelector('[data-fixed-playbar]');
        if (bar) bar.setAttribute('data-howler-status', 'not-playing');
        updateItemStatus(idx, 'not-playing');
      },
      onend: function() {
        const bar = document.querySelector('[data-fixed-playbar]');
        if (bar) bar.setAttribute('data-howler-status', 'not-playing');
        updateItemStatus(idx, 'not-playing');
        hideFixedBar();
      },
      onload: function() {
        const bar = document.querySelector('[data-fixed-playbar]');
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
      const bar = document.querySelector('[data-fixed-playbar]');
      if (!bar) return;
      
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
    const bar = document.querySelector('[data-fixed-playbar]');
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
    const bar = document.querySelector('[data-fixed-playbar]');
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
      const toggleButton = hymn.el.querySelector('[data-howler-control="toggle-play"]');
      
      if (toggleButton) {
        toggleButton.onclick = null;
        toggleButton.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🎵 Playing hymn:', idx, hymn.title);
          
          if (currentSound && currentSound.playing() && currentIndex === idx) {
            currentSound.pause();
          } else {
            playHymn(idx);
          }
        };
      }
    });
  }

  function setupDOMObserver() {
    if (observerActive) return;
    
    const targetNode = document.querySelector('[data-howler-list-container]') || document.body;
    const config = { childList: true, subtree: true };
    
    let timeoutId;
    const observer = new MutationObserver(function(mutations) {
      let shouldReinit = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && (node.hasAttribute('data-howler') || node.querySelector('[data-howler]'))) {
              shouldReinit = true;
            }
          });
          
          mutation.removedNodes.forEach(function(node) {
            if (node.nodeType === 1 && (node.hasAttribute('data-howler') || node.querySelector('[data-howler]'))) {
              shouldReinit = true;
            }
          });
        }
      });
      
      if (shouldReinit) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(reInitHowlerPlayer, 200);
      }
    });
    
    observer.observe(targetNode, config);
    observerActive = true;
  }

  function setupEventDelegation() {
    document.body.addEventListener('click', function(e) {
      if (e.target.closest('[data-howler-control="toggle-play"]')) {
        const toggleButton = e.target.closest('[data-howler-control="toggle-play"]');
        const hymnElement = toggleButton.closest('[data-howler]');
        
        if (hymnElement) {
          const idx = hymnList.findIndex(hymn => hymn.el === hymnElement);
          if (idx !== -1) {
            e.preventDefault();
            e.stopPropagation();
            
            if (currentSound && currentSound.playing() && currentIndex === idx) {
              currentSound.pause();
            } else {
              playHymn(idx);
            }
          }
        }
      }
    });
  }

  function reInitHowlerPlayer() {
    const oldCount = hymnList.length;
    hymnList = getHymnList();
    console.log(`Found ${hymnList.length} hymns (was ${oldCount})`);
    setupFixedBarControls();
    setupListPlayButtons();
  }

  function init() {
    reInitHowlerPlayer();
    setupDOMObserver();
    setupEventDelegation();
    
    const jetboostEvents = [
      'jetboost:filterapplied',
      'jetboost:pagination', 
      'jetboost:sortapplied',
      'jetboost:searchapplied',
      'jetboost:domupdated',
      'jetboost:list:updated'
    ];
    
    jetboostEvents.forEach(eventName => {
      document.addEventListener(eventName, function(e) {
        setTimeout(reInitHowlerPlayer, 100);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', function() {
    setTimeout(reInitHowlerPlayer, 500);
  });
})();
