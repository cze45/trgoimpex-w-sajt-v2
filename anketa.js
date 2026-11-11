/* Anketa na strani Kontakt: koraci rade i bez skripte (radio dugmad + CSS).
   Ova skripta samo dodaje: fokus na pitanje novog koraka, Enter/Razmak na "Nazad" i slanje.
   shortcut: slanje je mailto: sa čitljivo složenom porukom; zameniti Formspree-om ili Cloudflare Workerom pre objave. */
(function () {
  var f = document.querySelector('form.an');
  if (!f) return;

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

  function row(dl, k, v) {
    var d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = k; dd.textContent = v; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
  }

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.reportValidity()) return;

    var rows = [];
    f.querySelectorAll('.an-s:not(.s6)').forEach(function (s) {
      var c = s.querySelector('input.a:checked');
      if (c) rows.push([s.querySelector('.an-q').textContent, c.value]);
    });
    var v = function (id) { return (document.getElementById(id).value || '').trim(); };
    var name = v('f-ime'), phone = v('f-tel'), mail = v('f-mail'), msg = v('f-poruka');

    var lines = rows.map(function (r) { return r[0] + ' ' + r[1]; });
    lines.push('', 'Ime i prezime: ' + name, 'Telefon: ' + phone);
    if (mail) lines.push('E-pošta: ' + mail);
    if (msg) lines.push('', 'Dodatni opis:', msg);

    var to = (f.getAttribute('action') || '').replace(/^mailto:/, '').split('?')[0];
    var subject = 'Upit sa sajta' + (rows[0] ? ': ' + rows[0][1] : '');

    var done = f.querySelector('.an-done');
    done.textContent = '';
    var h = document.createElement('h3'); h.textContent = 'Hvala, ' + name + '. Upit je pripremljen.';
    var p = document.createElement('p');
    p.textContent = 'Otvorili smo vaš program za e-poštu sa pripremljenom porukom. Pošaljite je da upit stigne do nas. Ako se ništa nije otvorilo, pozovite nas na +381 63 504 857.';
    var dl = document.createElement('dl'); dl.className = 'an-sum';
    rows.forEach(function (r) { row(dl, r[0], r[1]); });
    row(dl, 'Telefon', phone);
    done.appendChild(h); done.appendChild(p); done.appendChild(dl);

    f.setAttribute('data-sent', '');
    done.focus();
    if (to) location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  });
})();
