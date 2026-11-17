/* Anketa na strani Kontakt: koraci rade i bez skripte (radio dugmad + CSS).
   Ova skripta samo dodaje: fokus na pitanje novog koraka, Enter/Razmak na "Nazad" i slanje.
   Slanje: Formspree (POST, JSON) kad je ENDPOINT upisan; dok je prazan, ostaje mailto: sa čitljivo složenom porukom. */
(function () {
  // Upiši adresu forme sa formspree.io, npr. 'https://formspree.io/f/abcdwxyz'. Prazno = mailto: rezerva.
  var ENDPOINT = '';
  var PHONE = '+381 63 504 857';
  // Ograničenje slanja po pregledaču (štiti od duplih klikova i ponavljanja; pravu zaštitu od botova radi Formspree na serveru).
  var MIN_GAP = 60 * 1000;          // najmanje 1 min između dva poslata upita
  var MAX_PER_HOUR = 3;             // najviše 3 upita na sat
  var MIN_FILL = 3000;              // brže od 3 s od otvaranja strane = bot
  var KEY = 'anketa-poslato';
  var f = document.querySelector('form.an');
  if (!f) return;
  var openedAt = Date.now();
  var sending = false;
  var memSent = [];                 // ako localStorage nije dostupan (privatni prozor), pamti se do zatvaranja strane

  function sentTimes() {
    var a;
    try { a = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { a = memSent; }
    if (!Array.isArray(a)) a = [];
    var now = Date.now();
    return a.filter(function (t) { return typeof t === 'number' && t <= now && now - t < 3600 * 1000; });
  }
  function markSent() {
    var a = sentTimes(); a.push(Date.now()); memSent = a;
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  }
  // Koliko ms još treba čekati (0 = može).
  function waitLeft() {
    var a = sentTimes(), now = Date.now();
    if (!a.length) return 0;
    var gap = MIN_GAP - (now - a[a.length - 1]);
    var hour = a.length >= MAX_PER_HOUR ? 3600 * 1000 - (now - a[a.length - MAX_PER_HOUR]) : 0;
    return Math.max(0, gap, hour);
  }

  // Granice dužine polja (HTML dolazi sa kanvasa, pa se postavljaju ovde).
  [['f-ime', 100], ['f-tel', 30], ['f-mail', 120], ['f-poruka', 2000]].forEach(function (x) {
    var el = document.getElementById(x[0]); if (el) el.maxLength = x[1];
  });
  var tel = document.getElementById('f-tel');
  // escape važi i za "v" režim koji pregledači koriste za pattern
  if (tel) { tel.pattern = '[0-9+\\(\\)\\/\\-\\. ]{6,30}'; tel.title = 'Unesite broj telefona, npr. 063 123 4567'; }

  function visibleStep() {
    var s = f.querySelectorAll('.an-s');
    for (var i = 0; i < s.length; i++) if (s[i].offsetParent !== null) return s[i];
    return null;
  }

  // Posle klika na opciju ili "Nazad" fokus ide na pitanje novog koraka (čitači ekrana ga pročitaju).
  f.addEventListener('change', function (e) {
    if (!e.target.matches('input[type=radio]')) return;
    requestAnimationFrame(function () {
      var s = visibleStep();
      var q = s && s.querySelector('.an-q');
      if (q) q.focus();
    });
  });

  // "Nazad" je label, pa mu treba tastatura (dugme "Počni ispočetka" je pravo dugme i ne treba).
  f.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('label.an-bk');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); b.click(); }
  });

  // "Počni ispočetka": reset forme vraća prvi korak, a fokus ide na njegovo pitanje.
  f.addEventListener('reset', function () {
    f.removeAttribute('data-sent');
    setTimeout(function () {
      var s = visibleStep();
      var q = s && s.querySelector('.an-q');
      if (q) q.focus();
    }, 0);
  });

  if (ENDPOINT && !f.querySelector('input[name=_gotcha]')) {
    var hp = document.createElement('input');
    hp.type = 'text'; hp.name = '_gotcha'; hp.tabIndex = -1; hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true'); hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(hp);
  }

  function row(dl, k, v) {
    var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = k; dd.textContent = v; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    if (!f.reportValidity()) return;

    var rows = [];
    f.querySelectorAll('.an-s:not(.s6)').forEach(function (s) {
      var c = s.querySelector('input.a:checked');
      if (c) rows.push([s.querySelector('.an-q').textContent, c.value]);
    });
    var v = function (id) { var el = document.getElementById(id); return (el.value || '').trim().slice(0, el.maxLength > 0 ? el.maxLength : 2000); };
    var name = v('f-ime'), phone = v('f-tel'), mail = v('f-mail'), msg = v('f-poruka');

    var lines = rows.map(function (r) { return r[0] + ' ' + r[1]; });
    lines.push('', 'Ime i prezime: ' + name, 'Telefon: ' + phone);
    if (mail) lines.push('E-pošta: ' + mail);
    if (msg) lines.push('', 'Dodatni opis:', msg);

    var to = (f.getAttribute('action') || '').replace(/^mailto:/, '').split('?')[0];
    var subject = 'Upit sa sajta' + (rows[0] ? ': ' + rows[0][1] : '');

    var done = f.querySelector('.an-done');
    var btn = f.querySelector('.an-send');

    function showDone(title, text) {
      done.textContent = '';
      var h = document.createElement('h3'); h.textContent = title;
      var p = document.createElement('p'); p.textContent = text;
      var dl = document.createElement('dl'); dl.className = 'an-sum';
      rows.forEach(function (r) { row(dl, r[0], r[1]); });
      row(dl, 'Telefon', phone);
      done.appendChild(h); done.appendChild(p); done.appendChild(dl);
      f.setAttribute('data-sent', '');
      done.focus();
    }

    if (!ENDPOINT) {
      showDone('Hvala, ' + name + '. Upit je pripremljen.',
        'Otvorili smo vaš program za e-poštu sa pripremljenom porukom. Pošaljite je da upit stigne do nas. Ako se ništa nije otvorilo, pozovite nas na ' + PHONE + '.');
      if (to) location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      return;
    }

    var err = f.querySelector('.an-err');
    if (!err) {
      err = document.createElement('p'); err.className = 'an-err'; err.setAttribute('role', 'alert');
      err.style.cssText = 'margin:0;font-size:14px;line-height:1.5;font-weight:600;color:#6b0f1a';
      btn.parentNode.insertBefore(err, btn);
    }
    err.textContent = '';

    var left = waitLeft();
    if (left > 0) {
      var min = Math.ceil(left / 60000);
      err.textContent = 'Već ste nam poslali upit. Sledeći možete poslati za ' + min + (min === 1 ? ' minut' : ' minuta') + '. Ako je hitno, pozovite nas na ' + PHONE + '.';
      return;
    }

    // Dugme: točkić se vrti dok traje slanje, pa se krug zatvori i pojavi se štiklirano (CSS .an-spin na strani Kontakt).
    var label = btn.firstChild.textContent, arr = btn.querySelector('.ft-arr'), arrHtml = arr.innerHTML;
    sending = true;
    btn.disabled = true; btn.firstChild.textContent = 'Šaljem… ';
    arr.innerHTML = '<svg class="an-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" pathLength="100"></circle><path class="an-ck" d="M8 12.5l2.8 2.8L16.5 9.5" pathLength="100"></path></svg>';
    function restore() {
      sending = false;
      btn.disabled = false; btn.classList.remove('ok'); btn.firstChild.textContent = label; arr.innerHTML = arrHtml;
    }
    function success(text) {
      btn.classList.add('ok'); btn.firstChild.textContent = 'Poslato ';
      setTimeout(function () { restore(); showDone('Hvala, ' + name + '. Upit je poslat.', text); }, 1100);
    }

    // Zamke za botove (skriveno polje ili prebrzo popunjavanje): tiho se pravi da je poslato, ništa ne ide na server.
    var trap = f.querySelector('input[name=_gotcha]');
    if ((trap && trap.value) || Date.now() - openedAt < MIN_FILL) { setTimeout(function () { success('Javićemo vam se na broj ' + phone + '.'); }, 700); return; }

    function fail(tooMany) {
      restore();
      err.textContent = tooMany
        ? 'Previše upita u kratkom roku. Pokušajte kasnije ili nas pozovite na ' + PHONE + '.'
        : 'Upit nije poslat. Proverite vezu i pokušajte ponovo, ili nas pozovite na ' + PHONE + '.';
    }

    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, email: mail, message: msg, upit: lines.join('\n'), _subject: subject }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) return fail(r.status === 429);
      markSent();
      success('Javićemo vam se na broj ' + phone + '. Ako je hitno, pozovite nas na ' + PHONE + '.');
    }).catch(function () { clearTimeout(timer); fail(); });
  });
})();
