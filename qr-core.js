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
