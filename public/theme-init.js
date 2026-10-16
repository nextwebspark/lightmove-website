// Runs before first paint (blocking, in <head>) so the page never flashes the wrong theme.
// Shares the "starlight-theme" key with the docs, so one choice applies across the whole site.
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem('starlight-theme');
  } catch (e) {}
  var theme =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
})();
