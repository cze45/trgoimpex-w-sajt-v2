/* Baner za kolačiće + učitavanje Google Analytics (GA4) tek posle pristanka.
   Izbor se čuva u localStorage pod ključem "cookie-consent": "accepted" ili "denied".
   Zameni GA_ID svojim Measurement ID-jem. */
(function () {
  var GA_ID = 'G-XXXXXXXXXX';
  var KEY = 'cookie-consent';

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadGA() {
    window['ga-disable-' + GA_ID] = false;
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  // Povlačenje pristanka: zaustavi merenje i obriši _ga kolačiće (na domenu i nadomenima).
  function stopGA() {
    window['ga-disable-' + GA_ID] = true;
    var host = location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < host.length - 1; i++) domains.push('; domain=.' + host.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  function init() {
    var box = document.getElementById('cc');
    var choice = read();
    if (choice === 'accepted') loadGA();

    if (box) {
      if (!choice) show();

      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cc]');
        if (!b) return;
        var v = b.getAttribute('data-cc');
        write(v);
        box.hidden = true;
        if (v === 'accepted') loadGA(); else stopGA();
        if (box._opener && box._opener.focus) box._opener.focus();
      });
    }

    // Dugme "Promeni izbor kolačića" (na stranici Politika privatnosti).
    document.addEventListener('click', function (e) {
      var o = e.target.closest('[data-cc-open]');
      if (!o || !box) return;
      box._opener = o;
      show();
    });

    function show() {
      box.hidden = false;
      var first = box.querySelector('[data-cc]');
      if (box._opener && first) first.focus();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
