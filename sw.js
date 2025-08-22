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

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

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
	}
});
