# Trgoimpex W – sajt (nova verzija)

Statičan sajt porodične građevinske firme Trgoimpex W iz Novog Sada. Bez build koraka i bez biblioteka: svaka stranica je jedan HTML fajl sa CSS-om u `<style>`.

## Stranice

- `index.html` – početna
- `projekti.html`, `o-nama.html`, `kontakt.html`
- `privatnost.html` – politika privatnosti, `404.html` – stranica za nepostojeće adrese (GitHub Pages je koristi automatski)
- `cookie-consent.js` – baner za kolačiće; Google Analytics (GA4) se učitava tek posle pristanka
- `anketa.js` – anketa u koracima na strani Kontakt (koraci rade i bez skripte; skripta dodaje fokus, tastaturu i slanje)
- `ogradjivanje.html`, `asfaltiranje.html`, `iskopi.html`, `visokogradnja.html` – po jedna strana za svaku delatnost
- `images/` – fotografije (webp), `video/` – kratki snimci radova (do 7 sekundi)

## Pokretanje

Otvori `index.html` u pregledaču ili pokreni `npx serve .`.

## Staro stanje

Prva verzija sajta (pre novih slika, snimaka i strana delatnosti) je u privatnom repou `cze45/trgoimpex-w-sajt`.

## Otvoreno pre objave na pravom domenu

- Anketa na strani Kontakt šalje preko `mailto:` (`anketa.js`); treba je povezati sa Formspree ili Cloudflare Workerom.
- U `cookie-consent.js` zameniti `GA_ID` (`G-XXXXXXXXXX`) pravim Measurement ID-jem.
- Linkove ka Instagramu i Facebooku dodati kad klijent pošalje naloge (trenutno ih nema na sajtu).
- Tekstove opisa delatnosti, brojke i podatke u politici privatnosti proveriti sa klijentom.
