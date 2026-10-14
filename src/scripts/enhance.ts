/*
 * Progressive enhancement, loaded as a deferred module by Base.astro. It adds no content and
 * changes no layout; with JavaScript off the page is complete and fully visible.
 *
 * - Press ripple on plain-HTML m3e-css buttons, chips, cards and navigation items
 *   (@kyralabs/m3e-elements/ripple.js: delegated listeners on document, ~1 KB).
 * - html.js turns on the scroll reveals in site.css; before this runs (or without JS) nothing
 *   is hidden.
 */
import '@kyralabs/m3e-elements/ripple.js';

document.documentElement.classList.add('js');
