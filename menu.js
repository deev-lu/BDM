// Fügt der Seite den Bereich "Speisekarte" hinzu (nach "Unser Angebot").
// Die Karten (PDF oder Bild) werden im Admin-Bereich unter /admin hochgeladen
// und aus Supabase geladen. Ohne aktive Karte bleibt der Bereich unsichtbar.
(function () {
  var CARDS = [
    { key: 'saison', eyebrow: 'Aktuell', title: 'Saisonkarte', text: 'Was gerade Saison hat – frisch und regional.' },
    { key: 'klassisch', eyebrow: 'Immer da', title: 'Unsere Karte', text: 'Unsere Klassiker, das ganze Jahr über.' },
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function whenPresent(selector) {
    return new Promise(function (resolve) {
      var el = document.querySelector(selector);
      if (el) return resolve(el);
      var obs = new MutationObserver(function () {
        var found = document.querySelector(selector);
        if (found) { obs.disconnect(); resolve(found); }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  function fileUrl(cfg, path) {
    return cfg.url + '/storage/v1/object/public/' + cfg.bucket + '/' + path.split('/').map(encodeURIComponent).join('/');
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildSection(cfg, active) {
    var section = document.createElement('section');
    section.id = 'speisekarte';
    section.style.cssText = 'background:#f5eee0;padding:clamp(64px,9vw,120px) 28px;';

    var cards = CARDS.filter(function (c) { return active[c.key]; }).map(function (c) {
      var url = fileUrl(cfg, active[c.key].storage_path);
      return (
        '<a href="' + esc(url) + '" target="_blank" rel="noopener" style="flex:1 1 300px;min-width:260px;max-width:520px;display:block;background:#faf5ea;border-radius:3px;overflow:hidden;box-shadow:0 8px 30px rgba(22,35,60,0.06);color:#16233c;">' +
          '<div style="padding:30px 30px 34px;">' +
            '<div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:var(--accent,#b0895a);margin-bottom:10px;">' + esc(c.eyebrow) + '</div>' +
            '<h3 style="font-family:\'Cormorant Garamond\',serif;font-weight:500;font-size:28px;margin:0 0 12px;">' + esc(c.title) + '</h3>' +
            '<p style="font-size:16px;font-weight:300;color:rgba(22,35,60,0.78);margin:0 0 22px;">' + esc(c.text) + '</p>' +
            '<span style="display:inline-block;background:#16233c;color:#f5eee0;padding:13px 26px;border-radius:2px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;">Karte ansehen</span>' +
          '</div>' +
        '</a>'
      );
    }).join('');

    section.innerHTML =
      '<div style="max-width:1220px;margin:0 auto;">' +
        '<div style="text-align:center;margin-bottom:56px;">' +
          '<span style="font-size:13px;letter-spacing:0.28em;text-transform:uppercase;color:var(--accent,#b0895a);">Speisekarte</span>' +
          '<h2 style="font-family:\'Cormorant Garamond\',serif;font-weight:500;font-size:clamp(30px,4.5vw,48px);margin:10px 0 0;">Was wir heute für Sie kochen</h2>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:28px;justify-content:center;">' + cards + '</div>' +
      '</div>';
    return section;
  }

  // Menüpunkt "Speisekarte" nach "Angebot" in der Desktop-Navigation und im
  // mobilen Menü (das erst beim Öffnen gerendert wird).
  function addNavLinks() {
    document.querySelectorAll('header a[href="#angebot"]').forEach(function (a) {
      var next = a.nextElementSibling;
      if (next && next.getAttribute('href') === '#speisekarte') return;
      var link = a.cloneNode(true);
      link.setAttribute('href', '#speisekarte');
      link.textContent = 'Speisekarte';
      a.insertAdjacentElement('afterend', link);
      // Der Klon hat keinen React-Handler, also das mobile Menü über den
      // Burger-Button schließen.
      if (a.closest('.bdm-navlinks') === null) {
        link.addEventListener('click', function () {
          var burger = document.querySelector('.bdm-burger');
          if (burger) burger.click();
        });
      }
    });
  }

  function mount(cfg, active) {
    var section = buildSection(cfg, active);
    function ensure() {
      var angebot = document.getElementById('angebot');
      if (angebot && !section.isConnected) angebot.insertAdjacentElement('afterend', section);
      addNavLinks();
    }
    ensure();
    // React rendert Teile der Seite neu (z. B. das mobile Menü) –
    // Bereich und Links bei Bedarf wieder einsetzen.
    new MutationObserver(ensure).observe(document.body, { childList: true, subtree: true });
  }

  var base = document.currentScript ? document.currentScript.src.replace(/[^/]*$/, '') : '/';
  loadScript(base + 'supabase-config.js').then(function () {
    var cfg = window.BDM_SUPABASE;
    if (!cfg || !cfg.url || !cfg.key) return;
    var q = cfg.url + '/rest/v1/menu_files?select=card,storage_path&is_active=eq.true';
    return fetch(q, { headers: { apikey: cfg.key } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var active = {};
        rows.forEach(function (r) { active[r.card] = r; });
        if (!active.saison && !active.klassisch) return;
        return whenPresent('#angebot').then(function () { mount(cfg, active); });
      });
  }).catch(function (e) { console.warn('[speisekarte]', e); });
})();
