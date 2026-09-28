/* The Growth Den — contact modal.
 * Intercepts every link to the booking calendar and asks: send a message, or schedule time live?
 * "Send a message" posts a short form to FormSubmit, which relays it to logan@thegrowthden.com.
 * Included on every page via <script src="/assets/contact.js" defer>. No dependencies.
 */
(function () {
  if (window.__gdContact) return;
  window.__gdContact = true;

  var EMAIL = 'logan@thegrowthden.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;
  var CAL = 'https://calendar.app.google/dy8683mNDXyWAkPo9';

  var css = [
    '.gdc-overlay{position:fixed;inset:0;background:rgba(26,16,37,.72);display:none;align-items:center;justify-content:center;padding:16px;z-index:9999;opacity:0;transition:opacity .18s ease}',
    '.gdc-overlay.is-open{display:flex}.gdc-overlay.is-in{opacity:1}',
    '.gdc-panel{position:relative;width:100%;max-width:520px;background:#fcf3d6;color:#1a1025;border-radius:22px;padding:34px 32px 30px;box-shadow:0 30px 80px rgba(0,0,0,.35);font-family:Poppins,system-ui,sans-serif;line-height:1.6;transform:translateY(10px);transition:transform .18s ease}',
    '.gdc-overlay.is-in .gdc-panel{transform:none}',
    '.gdc-close{position:absolute;top:14px;right:14px;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:#6b5f78;font-size:26px;line-height:1;cursor:pointer}',
    '.gdc-close:hover{background:rgba(52,31,68,.08);color:#341f44}',
    '.gdc-tag{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#fe7c2b;margin:0 0 8px}',
    '.gdc-panel h2{margin:0 0 6px;font-size:26px;font-weight:700;color:#341f44;line-height:1.2}',
    '.gdc-panel p{margin:0 0 18px;font-size:16px;color:#1a1025}',
    '.gdc-choice{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}',
    '.gdc-btn{display:block;width:100%;text-align:center;border:0;border-radius:100px;padding:14px 20px;font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;transition:transform .12s ease,background .12s ease}',
    '.gdc-btn:hover{transform:translateY(-1px)}',
    '.gdc-btn-primary{background:#fe7c2b;color:#fff}.gdc-btn-primary:hover{background:#f06d1a}',
    '.gdc-btn-dark{background:#341f44;color:#fff}.gdc-btn-dark:hover{background:#4a2d62}',
    '.gdc-btn[disabled]{opacity:.6;cursor:default;transform:none}',
    '.gdc-form{display:none;margin-top:18px}.gdc-form.is-on{display:block}',
    '.gdc-form label{display:block;font-size:14px;font-weight:500;color:#341f44;margin:12px 0 5px}',
    '.gdc-form input,.gdc-form textarea{width:100%;font:inherit;font-size:16px;padding:12px 14px;border:1px solid rgba(52,31,68,.18);border-radius:12px;background:#fff;color:#1a1025}',
    '.gdc-form input:focus,.gdc-form textarea:focus{outline:2px solid #fe7c2b;outline-offset:1px;border-color:transparent}',
    '.gdc-form textarea{min-height:120px;resize:vertical}',
    '.gdc-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '.gdc-actions{display:flex;align-items:center;gap:16px;margin-top:18px;flex-wrap:wrap}',
    '.gdc-actions .gdc-btn{width:auto;padding:13px 28px}',
    '.gdc-link{background:none;border:0;padding:0;font:inherit;font-size:14px;color:#6b5f78;cursor:pointer;text-decoration:underline}',
    '.gdc-note{font-size:14px;color:#6b5f78;margin:12px 0 0}',
    '.gdc-done{display:none;margin-top:8px}.gdc-done.is-on{display:block}',
    '.gdc-error{color:#b3261e;font-size:14px;margin-top:10px;display:none}.gdc-error.is-on{display:block}',
    '@media (max-width:480px){.gdc-panel{padding:28px 22px 24px;border-radius:18px}.gdc-choice{grid-template-columns:1fr}.gdc-panel h2{font-size:22px}}'
  ].join('');

  var markup =
    '<div class="gdc-panel" role="dialog" aria-modal="true" aria-labelledby="gdc-title">' +
      '<button class="gdc-close" type="button" aria-label="Close">&times;</button>' +
      '<div class="gdc-view" data-view="choice">' +
        '<p class="gdc-tag">Let’s talk</p>' +
        '<h2 id="gdc-title">Send a message or schedule time live?</h2>' +
        '<p>Either works. A message gets a reply from me within a business day. Scheduling grabs 30 minutes on my calendar.</p>' +
        '<div class="gdc-choice">' +
          '<button class="gdc-btn gdc-btn-dark" type="button" data-act="message">Send a message</button>' +
          '<a class="gdc-btn gdc-btn-primary" data-act="schedule" href="' + CAL + '" target="_blank" rel="noopener">Schedule time live</a>' +
        '</div>' +
      '</div>' +
      '<div class="gdc-view" data-view="form" style="display:none">' +
        '<p class="gdc-tag">Send a message</p>' +
        '<h2>What’s going on with growth?</h2>' +
        '<p>A couple of lines is plenty. I read every one of these myself.</p>' +
        '<form class="gdc-form is-on" novalidate>' +
          '<label for="gdc-name">Name</label>' +
          '<input id="gdc-name" name="name" type="text" autocomplete="name" required />' +
          '<label for="gdc-email">Email</label>' +
          '<input id="gdc-email" name="email" type="email" autocomplete="email" required />' +
          '<label for="gdc-msg">Message</label>' +
          '<textarea id="gdc-msg" name="message" required placeholder="Brand, roughly where you are, and what you’re trying to fix."></textarea>' +
          '<div class="gdc-hp" aria-hidden="true"><label>Leave this empty<input name="_honey" type="text" tabindex="-1" autocomplete="off" /></label></div>' +
          '<div class="gdc-error" role="alert"></div>' +
          '<div class="gdc-actions">' +
            '<button class="gdc-btn gdc-btn-primary" type="submit">Send</button>' +
            '<button class="gdc-link" type="button" data-act="back">Actually, let’s schedule time</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
      '<div class="gdc-view" data-view="done" style="display:none">' +
        '<p class="gdc-tag">Sent</p>' +
        '<h2>Got it. Thanks.</h2>' +
        '<p>I’ll reply within a business day from ' + EMAIL + '. If you’d rather not wait, you can also grab time now.</p>' +
        '<div class="gdc-actions">' +
          '<a class="gdc-btn gdc-btn-primary" href="' + CAL + '" target="_blank" rel="noopener">Schedule time live</a>' +
          '<button class="gdc-link" type="button" data-act="close">Close</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var overlay, panel, lastFocus, calHref = CAL;

  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    overlay = document.createElement('div');
    overlay.className = 'gdc-overlay';
    overlay.innerHTML = markup;
    document.body.appendChild(overlay);
    panel = overlay.firstChild;

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    panel.querySelector('.gdc-close').addEventListener('click', close);
    panel.addEventListener('click', function (e) {
      var act = e.target.closest && e.target.closest('[data-act]');
      if (!act) return;
      var a = act.getAttribute('data-act');
      if (a === 'message') { show('form'); setTimeout(function () { panel.querySelector('#gdc-name').focus(); }, 30); }
      else if (a === 'back') { show('choice'); }
      else if (a === 'close') { close(); }
      else if (a === 'schedule') { track('contact_schedule_click'); setTimeout(close, 150); }
    });
    panel.querySelector('form').addEventListener('submit', submit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('is-open')) close(); });
  }

  function show(name) {
    var views = panel.querySelectorAll('.gdc-view');
    for (var i = 0; i < views.length; i++) views[i].style.display = views[i].getAttribute('data-view') === name ? '' : 'none';
  }

  function open(href) {
    if (!overlay) build();
    calHref = href || CAL;
    var links = panel.querySelectorAll('a[href*="calendar.app.google"]');
    for (var i = 0; i < links.length; i++) links[i].href = calHref;
    show('choice');
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    requestAnimationFrame(function () { overlay.classList.add('is-in'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () { panel.querySelector('[data-act="message"]').focus(); }, 30);
    track('contact_modal_open');
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-in');
    document.body.style.overflow = '';
    setTimeout(function () { overlay.classList.remove('is-open'); }, 180);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function submit(e) {
    e.preventDefault();
    var form = e.target, err = panel.querySelector('.gdc-error'), btn = form.querySelector('[type="submit"]');
    var name = form.name.value.trim(), email = form.email.value.trim(), message = form.message.value.trim();
    err.classList.remove('is-on');
    if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      err.textContent = 'Name, a real email, and a message, and we’re good.';
      err.classList.add('is-on');
      return;
    }
    if (form._honey.value) { show('done'); return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    var payload = {
      name: name, email: email, message: message,
      _subject: 'Growth Den site: message from ' + name,
      _template: 'table', _captcha: 'false',
      page: location.href
    };
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || String(res.j.success) === 'false') throw new Error(res.j.message || 'send failed');
        track('contact_form_submit');
        form.reset();
        show('done');
      })
      .catch(function () {
        var mailto = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Growth Den site: message from ' + name) +
          '&body=' + encodeURIComponent(message + '\n\n' + name + '\n' + email);
        err.innerHTML = 'That didn’t go through. <a href="' + mailto + '">Email me directly</a> instead, or schedule time above.';
        err.classList.add('is-on');
      })
      .then(function () { btn.disabled = false; btn.textContent = 'Send'; });
  }

  function track(ev) {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: ev }); } catch (_) {}
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href*="calendar.app.google"]');
    if (!a || (overlay && overlay.contains(a))) return;
    e.preventDefault();
    open(a.href);
  });
})();
