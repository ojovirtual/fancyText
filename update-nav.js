/**
 * Sincroniza las partes comunes de todas las páginas HTML:
 *  - Navegación y pie de página desde nav-component.html
 *  - Banner patrocinado bajo la navegación
 *  - Versión fija de Alpine.js
 *  - Versión (?v=) de styles.css, app.js, tools.js y sponsored-banner.js,
 *    tomada de CACHE_VERSION en sw.js, para que los navegadores descarguen los cambios
 *
 * Ejecutar con: node update-nav.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ALPINE_VERSION = '3.17.4';
const VERSIONED_ASSETS = ['styles.css', 'app.js', 'tools.js', 'sponsored-banner.js'];

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Componentes compartidos
const component = read('nav-component.html');
const navHTML = component.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)[0];
const footerHTML = component.match(/<footer>[\s\S]*?<\/footer>/)[0];

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

const bannerHTML = (eol) => [
  '',
  '  <!-- Patrocinado -->',
  '  <div id="sponsored-banner"></div>',
  '  <script src="/sponsored-banner.js"></script>'
].join(eol);

function versionAssets(content) {
  for (const asset of VERSIONED_ASSETS) {
    const re = new RegExp(`(["'])/${asset.replace('.', '\\.')}(\\?v=[^"']*)?\\1`, 'g');
    content = content.replace(re, `$1/${asset}?v=${version}$1`);
  }
  return content;
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

console.log(`🚀 Sincronizando ${pages.length} páginas (recursos v${version})...\n`);
pages.forEach(updateFile);
updateAssetsOnly('share.html');

// El service worker precachea las mismas URLs versionadas
const swUpdated = versionAssets(sw);
if (swUpdated !== sw) {
  fs.writeFileSync(swPath, swUpdated, 'utf8');
  console.log('✅ Actualizado: sw.js');
}

console.log('\n✨ Sincronización completada');
