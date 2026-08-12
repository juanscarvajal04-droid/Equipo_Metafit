// src/utils/analytics.js
// ══════════════════════════════════════════════════════════════════
// ANALÍTICA — Google Tag Manager (GTM) + Google Analytics 4 (GA4)
// ══════════════════════════════════════════════════════════════════
//
// ⚠️ ESTE PROYECTO USA GTM COMO BASE (snippet en index.html), por lo
//    tanto NO se necesita enviar pageviews manualmente con gtag():
//
//    • GTM captura automáticamente los cambios de ruta de la SPA con
//      el trigger "History Change" (la app usa HashRouter, cuyos
//      cambios de hash también disparan ese trigger en GTM).
//    • GA4 se configura DENTRO de GTM como un tag de tipo "Google
//      Tag" / "GA4 Configuration" apuntando al Measurement ID
//      (G-XXXXXXXX). No debe agregarse gtag.js directo en el <head>
//      porque generaría doble conteo de páginas vistas.
//
// Implicaciones para App.jsx:
//    • NO hace falta un useEffect que llame a pageview() en cada
//      cambio de useLocation. Ese patrón solo aplica cuando se usa
//      gtag.js directo sin GTM.
//
// ── Por si algún día se quiere GA4 directo (sin GTM) ──────────────
// 1. Quitar el snippet de GTM del <head> y del <body> (index.html).
// 2. Agregar en su lugar el snippet gtag.js con el Measurement ID:
//      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
//      <script>
//        window.dataLayer = window.dataLayer || [];
//        function gtag(){dataLayer.push(arguments);}
//        gtag('js', new Date());
//        gtag('config', 'G-XXXXXXXX');
//      </script>
// 3. Descomentar la función pageview() de abajo y llamarla desde
//    App.jsx en un useEffect con useLocation.
// ──────────────────────────────────────────────────────────────────

// ── Eventos personalizados (GA4 vía GTM dataLayer) ──────────────────────────
// Los tags GA4 de GTM deben crear triggers "Custom Event" con el nombre
// del evento (ej. metaFit_afiliado_creado) y enviarlos a G-81SWBDG2P6.

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch {
    /* analítica no debe romper la app */
  }
}

// function pageview(path) {
//   if (typeof window.gtag === 'function') {
//     window.gtag('event', 'page_view', { page_path: path });
//   }
// }

// export { pageview };