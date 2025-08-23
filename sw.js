const CACHE_NAME = 'fancy-v3';
const CACHE_VERSION = '3.0.0';
const urlsToCache = ['/', '/index.html', '/share.html', '/styles.css', '/app.js', '/manifest.webmanifest'];

// Variable para controlar si hay actualizaciones disponibles
let updateAvailable = false;

self.addEventListener('install', (e) => {
	console.log('[SW] Instalando service worker versión', CACHE_VERSION);
	e.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			await cache.addAll(urlsToCache);
			// Forzar la activación inmediata del nuevo SW
			self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (e) => {
	console.log('[SW] Activando service worker versión', CACHE_VERSION);
	e.waitUntil(
		(async () => {
			// Eliminar caches antiguos
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME && cacheName !== 'share-store') {
						console.log('[SW] Eliminando cache antiguo:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
			
			// Tomar control de todas las páginas
			await self.clients.claim();
			
			// Notificar a los clientes que hay una nueva versión
			const clients = await self.clients.matchAll();
			clients.forEach(client => {
				client.postMessage({
					type: 'SW_UPDATED',
					version: CACHE_VERSION
				});
			});
		})()
	);
});

// Estrategia: Cache First con revalidación en segundo plano
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Manejar Web Share Target
	if (url.pathname === '/share' && event.request.method === 'POST') {
		// 1) Redirige YA a la UI
		event.respondWith(Response.redirect('/share#via-share', 303));

		// 2) Guarda el payload de forma fiable
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

	// Para recursos estáticos, usa cache-first con revalidación
	if (event.request.method === 'GET' && url.origin === self.location.origin) {
		event.respondWith(cacheFirstWithRevalidation(event.request));
	}
});

// Implementación de Cache First con revalidación en segundo plano
async function cacheFirstWithRevalidation(request) {
	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(request);
	
	// Si está en caché, lo devolvemos inmediatamente
	if (cachedResponse) {
		// Revalidación en segundo plano
		revalidateInBackground(request, cache);
		return cachedResponse;
	}
	
	// Si no está en caché, lo obtenemos de la red
	try {
		const networkResponse = await fetch(request);
		
		// Cachear la respuesta si es exitosa
		if (networkResponse.status === 200) {
			const responseToCache = networkResponse.clone();
			await cache.put(request, responseToCache);
		}
		
		return networkResponse;
	} catch (error) {
		console.log('[SW] Error de red:', error);
		// Fallback offline
		return new Response('App no disponible offline', { 
			status: 503,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
}

// Revalidación en segundo plano
async function revalidateInBackground(request, cache) {
	try {
		const networkResponse = await fetch(request);
		
		if (networkResponse.status === 200) {
			const cachedResponse = await cache.match(request);
			const networkClone = networkResponse.clone();
			
			// Comparar headers para detectar cambios
			let hasChanged = false;
			
			if (cachedResponse) {
				const cachedETag = cachedResponse.headers.get('etag');
				const networkETag = networkResponse.headers.get('etag');
				const cachedLastModified = cachedResponse.headers.get('last-modified');
				const networkLastModified = networkResponse.headers.get('last-modified');
				
				// Detectar cambios por ETag o Last-Modified
				if ((cachedETag && networkETag && cachedETag !== networkETag) ||
				    (cachedLastModified && networkLastModified && cachedLastModified !== networkLastModified)) {
					hasChanged = true;
				}
				
				// Si no hay headers, comparar el contenido (para archivos estáticos)
				if (!cachedETag && !cachedLastModified && !networkETag && !networkLastModified) {
					const cachedText = await cachedResponse.text();
					const networkText = await networkClone.text();
					hasChanged = cachedText !== networkText;
				}
			} else {
				hasChanged = true; // No había versión en caché
			}
			
			// Si hay cambios, actualizar caché y notificar
			if (hasChanged) {
				console.log('[SW] Actualización detectada para:', request.url);
				await cache.put(request, networkResponse.clone());
				
				// Notificar a los clientes sobre la actualización
				const clients = await self.clients.matchAll();
				clients.forEach(client => {
					client.postMessage({
						type: 'CONTENT_UPDATED',
						url: request.url,
						version: CACHE_VERSION
					});
				});
				
				updateAvailable = true;
			}
		}
	} catch (error) {
		console.log('[SW] Error en revalidación:', error);
	}
}

// Manejar mensajes desde el cliente
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CHECK_UPDATE') {
		event.ports[0].postMessage({
			updateAvailable,
			version: CACHE_VERSION
		});
	}
	
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
	
	if (event.data && event.data.type === 'RELOAD_PAGE') {
		// Forzar recarga de la página
		event.ports[0].postMessage({ reloadRequested: true });
	}
});