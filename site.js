// Copy email button on the home page.
(function () {
  var btn = document.getElementById('copy');
  var addr = document.getElementById('addr');
  var tag = document.getElementById('tag');
  if (!btn || !addr || !tag) return;
  btn.addEventListener('click', function () {
    if (!addr.hidden) { addr.hidden = true; tag.hidden = true; return; }
    addr.hidden = false; tag.hidden = false;
    function done() { tag.textContent = 'copied'; setTimeout(function () { tag.textContent = 'copy'; }, 1600); }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(addr);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      tag.textContent = 'selected';
      setTimeout(function () { tag.textContent = 'copy'; }, 1600);
    }
    try {
      navigator.clipboard.writeText(addr.textContent).then(done, fallback);
    } catch (err) { fallback(); }
  });
})();
