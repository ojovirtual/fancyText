// qr-core.js - Lógica compartida de los generadores de códigos QR (requiere qrcode-generator)
// Cada página define su propio generateQRCode(userInitiated) y usa estas utilidades.

// Modelo del QR actual (qrcode-generator): getModuleCount() / isDark(fila, columna)
let qr = null;

// Texto en UTF-8 sin BOM: con BOM muchos lectores no reconocen una vCard o una WiFi con acentos
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

// ---------- Validación de URLs ----------
const OTHER_SCHEME_RE = /^[a-z][a-z0-9+.-]*:(?!\d)/i;
const DOMAIN_LABEL_RE = /^[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/;
const TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;
const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Devuelve { url } con la URL normalizada o { error } con el motivo
function validateUrl(raw) {
  const value = raw.trim();
  if (!value) return { error: 'Introduce una URL.' };
  if (/\s/.test(value)) return { error: 'La URL no puede contener espacios.' };

  let candidate = value;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^https?:/i.test(candidate)) {
      return { error: 'Revisa el inicio de la URL: debe empezar por https://' };
    }
    if (OTHER_SCHEME_RE.test(candidate)) {
      return { error: 'Solo se admiten enlaces web (http:// o https://). Para otro contenido elige "Texto libre".' };
    }
    // Sin protocolo (ej. "miweb.com"): asumimos https://
    candidate = 'https://' + candidate;
  }

  let url;
  try {
    url = new URL(candidate);
  } catch (e) {
    return { error: 'La URL no tiene un formato válido.' };
  }

  if (url.username || url.password) {
    return { error: 'La URL no debe incluir usuario ni contraseña.' };
  }

  const host = url.hostname;
  // IPv4 solo si se escribió tal cual (new URL convierte "123" en "0.0.0.123")
  if (IPV4_RE.test(host)) {
    return value.toLowerCase().includes(host) ? { url: url.href } : { error: 'La URL no tiene un formato válido.' };
  }

  const labels = host.split('.');
  if (labels.length < 2 || !labels[labels.length - 1]) {
    return { error: 'Falta la extensión del dominio (por ejemplo .com o .es).' };
  }
  if (!TLD_RE.test(labels[labels.length - 1])) {
    return { error: 'La extensión del dominio no es válida (por ejemplo .com o .es).' };
  }
  if (host.length > 253 || !labels.every(label => DOMAIN_LABEL_RE.test(label))) {
    return { error: 'El dominio contiene caracteres no válidos.' };
  }

  return { url: url.href };
}

// ---------- Mensajes y validación en vivo ----------
function setFeedback(inputId, message, state) {
  const input = document.getElementById(inputId);
  const feedback = document.getElementById(inputId + '-feedback');
  input.classList.toggle('is-invalid', state === 'error');
  input.classList.toggle('is-valid', state === 'success');
  input.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
  feedback.textContent = message || '';
  feedback.classList.toggle('is-error', state === 'error');
  feedback.classList.toggle('is-success', state === 'success');
}

function setMessage(message) {
  document.getElementById('qr-message').textContent = message || '';
}

// Campos que ya muestran errores: tras salir del campo o pulsar "Generar"
const touchedFields = new Set();

// Avisa en vivo solo cuando el campo ya se ha tocado: no molesta mientras se escribe
function bindLiveValidation(inputId, check) {
  const input = document.getElementById(inputId);
  input.addEventListener('blur', () => {
    if (input.value.trim()) touchedFields.add(inputId);
    check(touchedFields.has(inputId));
  });
  input.addEventListener('input', () => {
    setMessage('');
    check(touchedFields.has(inputId));
  });
}

// ---------- Generación ----------
function qrResolution() {
  return parseInt(document.getElementById('resolution').value);
}

function clearQR() {
  document.getElementById('qrcode').innerHTML = '';
  qr = null;
  hideCard();
}

// Pinta el QR en #qrcode; devuelve false si el contenido no cabe en un QR
function renderQR(text, tooLongMessage) {
  clearQR();
  const model = qrcode(0, 'M');  // versión automática, corrección media
  try {
    model.addData(text);
    model.make();
  } catch (e) {
    setMessage(tooLongMessage || 'El contenido es demasiado largo para generar un código QR legible. Prueba a acortarlo.');
    return false;
  }
  qr = model;

  const size = qrResolution();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Código QR generado');
  drawQR(canvas.getContext('2d'), 0, 0, size);
  document.getElementById('qrcode').appendChild(canvas);
  return true;
}

// ---------- Descarga ----------
// Margen blanco alrededor del QR (zona de silencio): los lectores lo necesitan para detectarlo
const QUIET_MODULES = 4;

// Dibuja los módulos del QR actual en un canvas, con su margen blanco
function drawQR(ctx, x, y, size) {
  const model = qr;
  const n = model.getModuleCount();
  const cell = size / (n + QUIET_MODULES * 2);
  const edge = (i) => Math.round((i + QUIET_MODULES) * cell);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (model.isDark(r, c)) {
        ctx.fillRect(x + edge(c), y + edge(r), edge(c + 1) - edge(c), edge(r + 1) - edge(r));
      }
    }
  }
}

function qrToSVG(size) {
  const model = qr;
  const n = model.getModuleCount();
  const total = n + QUIET_MODULES * 2;
  let path = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (model.isDark(r, c)) path += `M${c + QUIET_MODULES},${r + QUIET_MODULES}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#ffffff"/><path d="${path}" fill="#000000"/></svg>`;
}

function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadQR(format = 'png') {
  if (!qr) {
    setMessage('Primero genera el código QR.');
    return;
  }
  const name = document.getElementById('qrcode').dataset.filename || 'codigo-qr';
  const size = qrResolution();

  if (format === 'svg') {
    const url = URL.createObjectURL(new Blob([qrToSVG(size)], { type: 'image/svg+xml' }));
    triggerDownload(url, name + '.svg');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  drawQR(canvas.getContext('2d'), 0, 0, size);
  triggerDownload(canvas.toDataURL('image/png'), name + '.png');
}

// ---------- Utilidades de dibujo ----------
const CANVAS_FONT = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';

// Texto en (x, y) que se reduce hasta caber en maxWidth; si ni así cabe, se recorta con "…"
function fitText(ctx, text, x, y, maxWidth, size, weight, color, minSize = 28) {
  const setFont = (px) => { ctx.font = `${weight} ${px}px ${CANVAS_FONT}`; };
  let px = size;
  setFont(px);
  while (ctx.measureText(text).width > maxWidth && px > minSize) {
    px -= 2;
    setFont(px);
  }
  let shown = text;
  const chars = [...text];
  while (ctx.measureText(shown).width > maxWidth && chars.length > 1) {
    chars.pop();
    shown = chars.join('').trimEnd() + '…';
  }
  ctx.fillStyle = color;
  ctx.fillText(shown, x, y);
}

function fillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// ---------- Imagen vertical 3:4 para enseñar o compartir desde el móvil ----------
const CARD_W = 1080;
const CARD_H = 1440;
const CARD_THEMES = {
  wifi: ['#2563eb', '#7c3aed'],
  vcard: ['#0ea5e9', '#4f46e5'],
  whatsapp: ['#25d366', '#128c7e']
};

// JPEG: con el fondo degradado pesa ~100 KB frente a ~670 KB en PNG, y el QR se sigue leyendo bien
const CARD_TYPE = 'image/jpeg';
const CARD_QUALITY = 0.92;

// Imagen actual: { canvas, file, ready, filename, title }
let currentCard = null;

// options: { theme, badge, title, subtitle, cta, filename }
function drawCard(options) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  const cx = CARD_W / 2;

  // Fondo degradado con dos círculos decorativos
  const [from, to] = CARD_THEMES[options.theme] || CARD_THEMES.vcard;
  const gradient = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(CARD_W - 60, 80, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(40, CARD_H - 120, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Etiqueta del tipo (WiFi, Contacto, WhatsApp)
  ctx.font = `bold 40px ${CANVAS_FONT}`;
  const badgeWidth = ctx.measureText(options.badge).width + 72;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  fillRoundRect(ctx, cx - badgeWidth / 2, 80, badgeWidth, 76, 38);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(options.badge, cx, 133);

  // Nombre de la red o de la persona, y detalle
  fitText(ctx, options.title, cx, 272, CARD_W - 140, 84, 'bold', '#ffffff', 40);
  if (options.subtitle) {
    fitText(ctx, options.subtitle, cx, 342, CARD_W - 140, 42, '500', 'rgba(255, 255, 255, 0.92)', 26);
  }

  // Tarjeta blanca con sombra, el QR y la llamada a la acción
  const boxX = 110;
  const boxY = 400;
  const boxW = CARD_W - 220;
  const boxH = 900;
  const qrSize = 720;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  fillRoundRect(ctx, boxX, boxY + 14, boxW, boxH, 48);
  ctx.fillStyle = '#ffffff';
  fillRoundRect(ctx, boxX, boxY, boxW, boxH, 48);
  drawQR(ctx, cx - qrSize / 2, boxY + 40, qrSize);
  fitText(ctx, options.cta, cx, boxY + 40 + qrSize + 92, boxW - 80, 46, 'bold', '#111827', 28);

  fitText(ctx, 'Crea el tuyo gratis en fancytext.com.es', cx, CARD_H - 52, CARD_W - 140, 30, '500', 'rgba(255, 255, 255, 0.88)', 22);
  return canvas;
}

function canShareFiles() {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'qr.jpg', { type: CARD_TYPE })] }));
  } catch (e) {
    return false;
  }
}

// Pinta la imagen 3:4 del QR actual en la vista previa (#qr-card)
function showCard(options) {
  const section = document.getElementById('qr-card');
  if (!section || !qr) return;
  const canvas = drawCard(options);
  const card = { canvas, file: null, filename: options.filename, title: options.title };
  currentCard = card;

  const preview = document.getElementById('qr-card-preview');
  // Se prepara ya el archivo: compartir tiene que ocurrir poco después del clic
  card.ready = new Promise((resolve) => canvas.toBlob(resolve, CARD_TYPE, CARD_QUALITY)).then((blob) => {
    card.file = new File([blob], options.filename, { type: CARD_TYPE });
    if (currentCard === card) {
      if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url);
      preview.dataset.url = URL.createObjectURL(blob);
      preview.src = preview.dataset.url;
    }
    return card.file;
  });

  section.hidden = false;
  document.getElementById('qr-card-share').hidden = !canShareFiles();
}

function hideCard() {
  const section = document.getElementById('qr-card');
  if (section) section.hidden = true;
  currentCard = null;
}

function downloadCard() {
  if (!currentCard) return;
  triggerDownload(currentCard.canvas.toDataURL(CARD_TYPE, CARD_QUALITY), currentCard.filename);
}

async function shareCard() {
  if (!currentCard) return;
  try {
    const file = currentCard.file || await currentCard.ready;
    await navigator.share({ files: [file], title: currentCard.title });
  } catch (e) {
    // Cancelar el diálogo no es un error; si no se puede compartir, se descarga
    if (e.name !== 'AbortError') downloadCard();
  }
}
