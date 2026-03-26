(function () {
  fetch('/banner/bannerConfig.json')
    .then(function (r) { return r.json(); })
    .then(function (banners) {
      var enabled = banners.filter(function (b) { return b.enabled; });
      if (!enabled.length) return;

      var banner = enabled[Math.floor(Math.random() * enabled.length)];
      var container = document.getElementById('sponsored-banner');
      if (!container) return;

      var section = document.createElement('div');
      section.className = 'sponsored-banner-section';

      var label = document.createElement('div');
      label.className = 'sponsored-banner-label';
      label.textContent = 'Espacio Patrocinado';

      var link = document.createElement('a');
      var url = new URL(banner.linkUrl);
      url.searchParams.set('utm_source', 'fancytext_com_es');
      link.href = url.toString();
      if (banner.openInNewTab) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      var imgDesktop = document.createElement('img');
      imgDesktop.className = 'banner-desktop';
      imgDesktop.src = banner.desktopImage;
      imgDesktop.alt = banner.altText;
      imgDesktop.width = 728;
      imgDesktop.height = 90;
      imgDesktop.loading = 'lazy';

      var imgMobile = document.createElement('img');
      imgMobile.className = 'banner-mobile';
      imgMobile.src = banner.mobileImage;
      imgMobile.alt = banner.altText;
      imgMobile.width = 320;
      imgMobile.height = 50;
      imgMobile.loading = 'lazy';

      link.appendChild(imgDesktop);
      link.appendChild(imgMobile);
      section.appendChild(label);
      section.appendChild(link);
      container.appendChild(section);
    })
    .catch(function () {});
})();
