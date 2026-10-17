const CACHE_VERSION = '6.0.0';
const CACHE_NAME = 'fancy-' + CACHE_VERSION;
const SHARE_CACHE = 'share-store';
const urlsToCache = [
	'/',
	'/index.html',
	'/share.html',
	'/styles.css?v=6.0.0',
	'/app.js?v=6.0.0',
	'/tools.js?v=6.0.0',
	'/qr-core.js?v=6.0.0',
	'/manifest.webmanifest',
	'/sitemap.xml',
	'/robots.txt',
	'/data/aesthetic-symbols.json',
	// Landing pages
	'/letras-bonitas-whatsapp/',
	'/cursiva-instagram/',
	'/letras-aesthetic/',
	'/fuentes-tiktok/',
	'/letras-goticas/',
	'/letras-vikingas/',
	'/texto-tachado/',
	'/letras-circulo/',
	'/letras-cuadrado/',
	'/contador-caracteres/',
	'/espacio-invisible/',
	'/invertir-texto/',
	'/separadores-instagram/',
	'/simbolos-aesthetic/',
	'/generador-qr/',
	'/qr-wifi/',
	'/qr-whatsapp/'
];

// Si la red tarda más que esto y hay copia guardada, se muestra la copia (conexiones muy lentas)
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (e) => {
	console.log('[SW] Instalando service worker versión', CACHE_VERSION);
	e.waitUntil(
		(async () => {
			// Copia para usar la web sin conexión
			const cache = await caches.open(CACHE_NAME);
			await cache.addAll(urlsToCache);
			self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (e) => {
	console.log('[SW] Activando service worker versión', CACHE_VERSION);
	e.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME && name !== SHARE_CACHE)
					.map((name) => caches.delete(name))
			);
			// Descarga la página en paralelo al arranque del service worker
			if (self.registration.navigationPreload) {
				await self.registration.navigationPreload.enable();
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Web Share Target: guarda lo compartido y redirige a la página de compartir
	if (url.pathname === '/share' && request.method === 'POST') {
		event.respondWith(Response.redirect('/share#via-share', 303));
		event.waitUntil(
			(async () => {
				const form = await request.formData();
				const payload = {
					title: form.get('title') || '',
					text: form.get('text') || '',
					url: form.get('url') || '',
				};
				const cache = await caches.open(SHARE_CACHE);
				await cache.put(
					new Request('/__share_payload__', { cache: 'reload' }),
					new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } })
				);
			})()
		);
		return;
	}

	if (request.method !== 'GET' || url.origin !== self.location.origin) return;
	// Error conocido de Chrome con las devtools abiertas
	if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

	if (request.mode === 'navigate') {
		// Páginas: primero la red; la caché solo si no hay conexión
		event.respondWith(networkFirst(event, pageKey(url), NETWORK_TIMEOUT_MS));
	} else if (url.searchParams.has('v')) {
		// CSS/JS con ?v=: cada versión es una URL distinta y nunca cambia
		event.respondWith(cacheFirst(request));
	} else {
		// Resto (imágenes, JSON, manifest...): primero la red
		event.respondWith(networkFirst(event, request, 0));
	}
});

// Las páginas se guardan sin la query (/generador-qr/?url=... comparte copia con /generador-qr/)
function pageKey(url) {
	return new Request(url.origin + url.pathname);
}

async function networkFirst(event, cacheKey, timeoutMs) {
	const cache = await caches.open(CACHE_NAME);
	const preloaded = event.request.mode === 'navigate' ? event.preloadResponse : null;
	const network = Promise.resolve(preloaded)
		.then((response) => response || fetch(event.request))
		.then(async (response) => {
			if (response.ok && response.type === 'basic') {
				await cache.put(cacheKey, response.clone());
			}
			return response;
		});
	// Aunque se responda con la copia por lentitud, la red termina y actualiza la caché
	event.waitUntil(network.catch(() => {}));

	const cachedCopy = () => cache.match(cacheKey, { ignoreSearch: true });

	try {
		let response;
		const cached = timeoutMs ? await cachedCopy() : null;
		if (cached) {
			const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
			response = (await Promise.race([network, timeout])) || cached;
		} else {
			response = await network;
		}
		// Servidor caído (5xx): mejor la copia guardada que una página de error
		if (response.status >= 500) return (await cachedCopy()) || response;
		return response;
	} catch (error) {
		return (await cachedCopy()) || offlineResponse(event.request);
	}
}

async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	if (cached) return cached;
	try {
		const response = await fetch(request);
		if (response.ok && response.type === 'basic') {
			await cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		return offlineResponse(request);
	}
}

function offlineResponse(request) {
	if (request.mode !== 'navigate') {
		return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
	}
	const html = '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
		'<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión | FancyText</title>' +
		'<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#e5e7eb;display:flex;min-height:100vh;' +
		'margin:0;align-items:center;justify-content:center;text-align:center;padding:24px}a{color:#22d3ee}</style></head>' +
		'<body><div><h1>📡 Sin conexión</h1><p>Esta página no está guardada en tu dispositivo.</p>' +
		'<p><a href="/">Volver al inicio</a></p></div></body></html>';
	return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
