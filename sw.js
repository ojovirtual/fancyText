const CACHE_NAME = 'fancy-v2';
const urlsToCache = ['/', '/index.html', '/share.html', '/styles.css', '/app.js', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
	e.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			await cache.addAll(urlsToCache);
			self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (e) => {
	e.waitUntil(
		(async () => {
			// Eliminar caches antiguos
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME && cacheName !== 'share-store') {
						console.log('Eliminando cache antiguo:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
			return self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Manejar Web Share Target
	if (url.pathname === '/share' && event.request.method === 'POST') {
		// 1) Redirige YA a la UI
		event.respondWith(Response.redirect('/share#via-share', 303));

		// 2) Guarda el payload de forma fiable, aunque la página aún no exista
		event.waitUntil(
			(async () => {
				const form = await event.request.formData();
				const payload = {
					title: form.get('title') || '',
					text: form.get('text') || '',
					url: form.get('url') || '',
				};
				const cache = await caches.open('share-store');
				await cache.put(
					new Request('/__share_payload__', { cache: 'reload' }),
					new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } })
				);
			})()
		);
		return;
	}

	// Para otros recursos, usa cache-first con fallback a network
	if (event.request.method === 'GET') {
		event.respondWith(
			(async () => {
				try {
					// Intenta servir desde cache
					const cache = await caches.open(CACHE_NAME);
					const cachedResponse = await cache.match(event.request);
					
					if (cachedResponse) {
						return cachedResponse;
					}
					
					// Si no está en cache, busca en red
					const networkResponse = await fetch(event.request);
					
					// Cachea la respuesta para futuras peticiones (solo para recursos propios)
					if (networkResponse.status === 200 && url.origin === self.location.origin) {
						const responseToCache = networkResponse.clone();
						await cache.put(event.request, responseToCache);
					}
					
					return networkResponse;
				} catch (error) {
					// Si falla todo, retorna desde cache si existe
					const cache = await caches.open(CACHE_NAME);
					return await cache.match(event.request) || new Response('Offline', { status: 503 });
				}
			})()
		);
	}
});
