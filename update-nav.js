/**
 * Sincroniza las partes comunes de todas las páginas HTML:
 *  - Navegación y pie de página desde nav-component.html
 *  - Banner patrocinado bajo la navegación
 *  - Versión fija de Alpine.js
 *  - Versión (?v=) de styles.css, app.js, tools.js y sponsored-banner.js,
 *    tomada de CACHE_VERSION en sw.js, para que los navegadores descarguen los cambios
 *  - Metadatos para redes sociales (Open Graph + Twitter) con la imagen de /og/<página>.png
 *  - Datos estructurados (WebApplication + BreadcrumbList) en las páginas que no tienen
 *  - sitemap.xml (lastmod según git) y la lista de páginas que precachea sw.js
 *
 * Ejecutar con: node update-nav.js
 * Imágenes OG: python scripts/og-images.py
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const SITE = 'https://fancytext.com.es';
const ALPINE_VERSION = '3.17.4';
const VERSIONED_ASSETS = ['styles.css', 'app.js', 'tools.js', 'sponsored-banner.js'];

// Textos para compartir distintos del <title> (por defecto se usan el título y la meta description)
const SOCIAL_OVERRIDES = {
  'index.html': {
    title: '✨ Negritas y Cursivas para Instagram, Facebook y WhatsApp',
    description: 'Genera texto en 𝐍𝐞𝐠𝐫𝐢𝐭𝐚, 𝐶𝑢𝑟𝑠𝑖𝑣𝑎 y más estilos para copiar y pegar en tus redes sociales. Gratis y fácil de usar.'
  },
  'generador-qr/index.html': {
    title: '✨ Generador de Códigos QR Gratis - PNG y SVG',
    description: 'Crea códigos QR para enlaces, texto y tarjetas de contacto. Descarga en PNG o SVG sin límites ni registro.'
  }
};

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Componentes compartidos
const component = read('nav-component.html');
const navHTML = component.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0];
const footerHTML = component.match(/<footer>[\s\S]*?<\/footer>/)[0];

// Páginas del menú en orden, con su nombre y sección (Generadores / Herramientas)
const [generatorsNav, toolsNav] = navHTML.split('<!-- Herramientas Dropdown -->');
const navLinks = (html, section) => [...html.matchAll(/<a href="(\/[^"]+\/)">[\s\S]*?<\/svg>\s*([^<]+?)\s*<\/a>/g)]
  .map((m) => ({ href: m[1], name: m[2], section }));
const NAV_PAGES = [...navLinks(generatorsNav, 'generadores'), ...navLinks(toolsNav, 'herramientas')];

// Versión de los recursos = versión del service worker
const swPath = path.join(ROOT, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
const version = sw.match(/const CACHE_VERSION = '([^']+)'/)[1];

// Páginas: index.html, 404.html y todas las carpetas con index.html
const pages = ['index.html', '404.html'].concat(
  fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && fs.existsSync(path.join(ROOT, d.name, 'index.html')))
    .map((d) => `${d.name}/index.html`)
);
const pageHref = (file) => (file === 'index.html' ? '/' : `/${path.dirname(file)}/`);
const indexable = pages.filter((file) => file !== '404.html');

const bannerHTML = (eol) => [
  '',
  '  <!-- Patrocinado -->',
  '  <div id="sponsored-banner"></div>',
  '  <script src="/sponsored-banner.js"></script>'
].join(eol);

const escapeAttr = (s) => s.replace(/&(?![a-z0-9#]+;)/gi, '&amp;').replace(/"/g, '&quot;');
const decodeAttr = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
// Quita un bloque generado (entre marcadores) junto con su sangría y salto de línea
function removeBlock(content, start, end) {
  const from = content.indexOf(start);
  if (from === -1) return content;
  const lineStart = content.lastIndexOf('\n', from) + 1;
  let to = content.indexOf(end, from) + end.length;
  if (content[to] === '\r') to++;
  if (content[to] === '\n') to++;
  return content.slice(0, lineStart) + content.slice(to);
}

function versionAssets(content) {
  for (const asset of VERSIONED_ASSETS) {
    const re = new RegExp(`(["'])/${asset.replace('.', '\\.')}(\\?v=[^"']*)?\\1`, 'g');
    content = content.replace(re, `$1/${asset}?v=${version}$1`);
  }
  return content;
}

function pageInfo(content, file) {
  const title = content.match(/<title>([^<]*)<\/title>/)[1].trim();
  const description = (content.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canonical = (content.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || SITE + pageHref(file);
  const override = SOCIAL_OVERRIDES[file] || {};
  return {
    canonical,
    description,
    socialTitle: override.title ? escapeAttr(override.title) : title.replace(/\s*\|\s*FancyText\s*$/, ''),
    socialDescription: override.description ? escapeAttr(override.description) : description
  };
}

// Bloque Open Graph + Twitter, regenerado entero en cada ejecución
const SOCIAL_START = '<!-- Redes sociales (generado por update-nav.js) -->';
const SOCIAL_END = '<!-- /Redes sociales -->';

function socialBlock(info, file, eol) {
  const slug = file === 'index.html' ? 'index' : path.dirname(file);
  const image = `${SITE}/og/${fs.existsSync(path.join(ROOT, 'og', `${slug}.png`)) ? slug : 'default'}.png`;
  return [
    SOCIAL_START,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="FancyText">',
    '<meta property="og:locale" content="es_ES">',
    `<meta property="og:url" content="${info.canonical}">`,
    `<meta property="og:title" content="${info.socialTitle}">`,
    `<meta property="og:description" content="${info.socialDescription}">`,
    `<meta property="og:image" content="${image}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${info.socialTitle}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    SOCIAL_END
  ].map((line) => '  ' + line).join(eol);
}

function syncSocial(content, file, eol) {
  const info = pageInfo(content, file);
  // Quitar bloque generado anterior, etiquetas og:/twitter: sueltas y sus comentarios
  content = removeBlock(content, SOCIAL_START, SOCIAL_END);
  content = content.replace(/^[ \t]*<meta\s+(?:property|name)="(?:og|twitter):[^"]*"[^>]*>[ \t]*\r?\n/gm, '');
  content = content.replace(/^[ \t]*<!-- (?:Open Graph \/ Facebook|Twitter) -->[ \t]*\r?\n/gm, '');
  return content.replace(/(<link rel="canonical"[^>]*>)[ \t]*\r?\n/, (m, link) => link + eol + socialBlock(info, file, eol) + eol);
}

// Datos estructurados solo para páginas que no tienen ninguno propio
const LD_START = '<!-- Datos estructurados (generado por update-nav.js) -->';
const LD_END = '<!-- /Datos estructurados -->';

function syncStructuredData(content, file, eol) {
  content = removeBlock(content, LD_START, LD_END);
  if (content.includes('application/ld+json') || file === '404.html') return content;

  const info = pageInfo(content, file);
  const navPage = NAV_PAGES.find((p) => p.href === pageHref(file));
  const app = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: decodeAttr(info.socialTitle),
    description: decodeAttr(info.description),
    url: info.canonical,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    inLanguage: 'es',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
  };
  const blocks = [app];
  if (navPage) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: navPage.name, item: info.canonical }
      ]
    });
  }
  const scripts = blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`);
  const block = [LD_START, ...scripts, LD_END].map((line) => '  ' + line).join(eol);
  return content.replace(/<\/head>/, () => block + eol + '</head>');
}

function updateFile(file) {
  const filePath = path.join(ROOT, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const withEol = (html) => html.replace(/\r?\n/g, eol);

  if (!/<nav class="main-nav"[\s\S]*?<\/nav>/.test(content)) {
    console.log(`⚠️  No se encontró nav en: ${file}`);
    return;
  }
  // Marca la página actual en el menú
  const dir = path.dirname(file);
  const pageNav = dir === '.'
    ? navHTML
    : navHTML.replace(`<a href="/${dir}/">`, `<a href="/${dir}/" aria-current="page">`);
  content = content.replace(/<nav class="main-nav"[\s\S]*?<\/nav>/, () => withEol(pageNav));

  if (/<footer>[\s\S]*?<\/footer>/.test(content)) {
    content = content.replace(/<footer>[\s\S]*?<\/footer>/, () => withEol(footerHTML));
  } else {
    console.log(`⚠️  No se encontró footer en: ${file}`);
  }

  if (!content.includes('id="sponsored-banner"')) {
    content = content.replace(/<\/nav>/, () => '</nav>' + eol + bannerHTML(eol));
  }

  content = content.replace(/alpinejs@[^/]+\/dist/g, `alpinejs@${ALPINE_VERSION}/dist`);
  content = versionAssets(content);

  if (file !== '404.html') {
    content = syncSocial(content, file, eol);
    content = syncStructuredData(content, file, eol);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado: ${file}`);
  } else {
    console.log(`·  Sin cambios: ${file}`);
  }
}

// share.html no tiene navegación, pero sí recursos versionados
function updateAssetsOnly(file) {
  const filePath = path.join(ROOT, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = versionAssets(content);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Actualizado (recursos): ${file}`);
  }
}

// Orden: inicio, páginas del menú y después el resto
function orderedPages() {
  const byHref = new Map(indexable.map((file) => [pageHref(file), file]));
  const ordered = ['/', ...NAV_PAGES.map((p) => p.href)].filter((href) => byHref.has(href));
  const rest = [...byHref.keys()].filter((href) => !ordered.includes(href)).sort();
  return [...ordered, ...rest].map((href) => ({ href, file: byHref.get(href) }));
}

// Fecha del último commit del archivo, u hoy si tiene cambios sin commitear
function lastModified(file) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const dirty = execSync(`git status --porcelain -- "${file}"`, { cwd: ROOT }).toString().trim();
    if (dirty) return today;
    return execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: ROOT }).toString().trim() || today;
  } catch (e) {
    return today;
  }
}

function writeSitemap() {
  const urls = orderedPages().map(({ href, file }) => {
    const navPage = NAV_PAGES.find((p) => p.href === href);
    const priority = href === '/' ? '1.0' : navPage && navPage.section === 'generadores' ? '0.8' : '0.7';
    return [
      '  <url>',
      `    <loc>${SITE}${href}</loc>`,
      `    <lastmod>${lastModified(file)}</lastmod>`,
      `    <changefreq>${href === '/' ? 'weekly' : 'monthly'}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    ].join('\n');
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    ''
  ].join('\n');
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (fs.readFileSync(sitemapPath, 'utf8').replace(/\r\n/g, '\n') !== xml) {
    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log('✅ Actualizado: sitemap.xml');
  }
}

console.log(`🚀 Sincronizando ${pages.length} páginas (recursos v${version})...\n`);
pages.forEach(updateFile);
updateAssetsOnly('share.html');

// El service worker precachea las mismas URLs versionadas y todas las páginas
const eol = sw.includes('\r\n') ? '\r\n' : '\n';
let swUpdated = versionAssets(sw);
const landing = orderedPages().filter((p) => p.href !== '/').map((p) => `\t'${p.href}'`).join(',' + eol);
swUpdated = swUpdated.replace(/(\/\/ Landing pages\r?\n)[\s\S]*?(\r?\n\];)/, (m, start, end) => start + landing + end);
if (swUpdated !== sw) {
  fs.writeFileSync(swPath, swUpdated, 'utf8');
  console.log('✅ Actualizado: sw.js');
}

writeSitemap();

console.log('\n✨ Sincronización completada');
