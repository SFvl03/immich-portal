(function () {
  var cfg = window.PORTAL_CONFIG || {};

  if (cfg.title) {
    document.title = cfg.title;
    var titleEl = document.getElementById('portal-title');
    if (titleEl) titleEl.textContent = cfg.title;
  }

  var frameView = document.getElementById('frame-view');
  var frameUpload = document.getElementById('frame-upload');
  var escapeView = document.getElementById('escape-view');
  var escapeUpload = document.getElementById('escape-upload');

  frameView.src = cfg.immichUrl || '';
  frameUpload.src = cfg.uploadUrl || '';
  escapeView.href = cfg.immichUrl || '#';
  escapeUpload.href = cfg.uploadUrl || '#';

  var tabs = {
    view: {
      btn: document.getElementById('tab-view'),
      pane: document.getElementById('pane-view')
    },
    upload: {
      btn: document.getElementById('tab-upload'),
      pane: document.getElementById('pane-upload')
    }
  };

  var railFill = document.querySelector('.rail-fill');

  function positionRail(btn) {
    if (!railFill || !btn) return;
    var rect = btn.getBoundingClientRect();
    var barRect = btn.closest('.bar').getBoundingClientRect();
    railFill.style.width = rect.width + 'px';
    railFill.style.transform = 'translateX(' + (rect.left - barRect.left) + 'px)';
  }

  function activate(name) {
    Object.keys(tabs).forEach(function (key) {
      var isActive = key === name;
      tabs[key].btn.setAttribute('aria-selected', String(isActive));
      tabs[key].pane.hidden = !isActive;
      tabs[key].pane.classList.toggle('is-active', isActive);
    });
    positionRail(tabs[name].btn);
  }

  Object.keys(tabs).forEach(function (key) {
    tabs[key].btn.addEventListener('click', function () { activate(key); });
  });

  window.addEventListener('resize', function () {
    var current = Object.keys(tabs).find(function (key) {
      return tabs[key].btn.getAttribute('aria-selected') === 'true';
    });
    positionRail(tabs[current].btn);
  });

  // Set initial rail position once fonts/layout have settled
  window.requestAnimationFrame(function () { positionRail(tabs.view.btn); });
})();
