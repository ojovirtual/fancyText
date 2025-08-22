self.addEventListener('install', (e) => {
	e.waitUntil(
		(async () => {
			const cache = await caches.open('fancy-v1');
			await cache.addAll(['/', '/index.html', '/share.html', '/styles.css', '/app.js', '/manifest.webmanifest']);
			self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (e) => {
	e.waitUntil(self.clients.claim());
});

// Intercepta el POST del Web Share Target
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (url.pathname === '/share' && event.request.method === 'POST') {
		event.respondWith(
			(async () => {
				const form = await event.request.formData();
				const payload = {
					title: form.get('title') || '',
					text: form.get('text') || '',
					url: form.get('url') || '',
				};
				// Envía a todas las pestañas clientes
				const bc = new BroadcastChannel('share');
				bc.postMessage(payload);
				// Redirige a la UI de procesamiento
				return Response.redirect('/share', 303);
			})()
		);
		return;
	}
});
