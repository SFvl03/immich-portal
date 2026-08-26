(function () {
  var cfg = window.PORTAL_CONFIG || {};

  if (cfg.title) {
    document.title = cfg.title;
    var titleEl = document.getElementById('portal-title');
    if (titleEl) titleEl.textContent = cfg.title;
  }

  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  function roman(n) { return ROMAN[n] || String(n); }

  function parseAlbums(raw) {
    if (!raw) return [];
    return raw.split(';').map(function (pair) {
      pair = pair.trim();
      if (!pair) return null;
      var idx = pair.indexOf('|');
      if (idx === -1) return null;
      return { name: pair.slice(0, idx).trim(), url: pair.slice(idx + 1).trim() };
    }).filter(Boolean);
  }

  var sections = parseAlbums(cfg.albums);
  if (cfg.uploadUrl) {
    sections.push({ name: 'Add Photos', url: cfg.uploadUrl });
  }

  var tabsEl = document.getElementById('tabs');
  var panesEl = document.getElementById('panes');
  var railFill = document.querySelector('.rail-fill');
  var tabs = [];

  function positionRail(btn) {
    if (!railFill || !btn) return;
    var rect = btn.getBoundingClientRect();
    var barRect = btn.closest('.bar').getBoundingClientRect();
    railFill.style.width = rect.width + 'px';
    railFill.style.transform = 'translateX(' + (rect.left - barRect.left) + 'px)';
  }

  function activate(index) {
    tabs.forEach(function (t, i) {
      var isActive = i === index;
      t.btn.setAttribute('aria-selected', String(isActive));
      t.pane.hidden = !isActive;
      t.pane.classList.toggle('is-active', isActive);
    });
    positionRail(tabs[index].btn);
  }

  sections.forEach(function (section, i) {
    var key = 'tab-' + i;

    var btn = document.createElement('button');
    btn.className = 'tab';
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.id = key;

    var num = document.createElement('span');
    num.className = 'tab-num';
    num.textContent = roman(i + 1);

    var label = document.createElement('span');
    label.className = 'tab-label';
    label.textContent = section.name;

    btn.appendChild(num);
    btn.appendChild(label);
    tabsEl.appendChild(btn);

    var pane = document.createElement('section');
    pane.className = 'pane' + (i === 0 ? ' is-active' : '');
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', key);
    if (i !== 0) pane.hidden = true;

    var iframe = document.createElement('iframe');
    iframe.title = section.name;
    iframe.loading = 'lazy';
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.src = section.url;

    var escapeLink = document.createElement('a');
    escapeLink.className = 'escape';
    escapeLink.target = '_blank';
    escapeLink.rel = 'noopener';
    escapeLink.href = section.url;
    escapeLink.textContent = 'Not loading? Open "' + section.name + '" directly \u2197';

    pane.appendChild(iframe);
    pane.appendChild(escapeLink);
    panesEl.appendChild(pane);

    tabs.push({ btn: btn, pane: pane });
    btn.addEventListener('click', function () { activate(i); });
  });

  window.addEventListener('resize', function () {
    var current = tabs.findIndex(function (t) {
      return t.btn.getAttribute('aria-selected') === 'true';
    });
    if (current !== -1) positionRail(tabs[current].btn);
  });

  window.requestAnimationFrame(function () {
    if (tabs.length) positionRail(tabs[0].btn);
  });
})();
