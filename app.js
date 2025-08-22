const textIn = () => document.getElementById('in');
const textOut = () => document.getElementById('out');

// --- Estilos Unicode básicos ---
const MAPS = {
	bold: mapFromStrings(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙' + '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳' + '𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'
	),
	italic: mapFromStrings(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		'𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁' + '𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛'
	),
	mono: mapFromStrings(
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ' +
			'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ' +
			'０１２３４５６７８９'
	),
};

function mapFromStrings(src, dst) {
	const m = new Map();
	for (let i = 0; i < src.length; i++) m.set(src[i], dst[i]);
	return m;
}

function convert(input, m) {
	return [...input]
		.map((ch) => {
			// No tocar hashtags y menciones
			if (ch === '#' || ch === '@') return ch;
			const mapped = m.get(ch) || m.get(ch.toUpperCase()) || m.get(ch.toLowerCase());
			return mapped || ch;
		})
		.join('');
}

function toPlain(input) {
	// Reemplazo inverso simple (parcial)
	const inverse = new Map();
	Object.values(MAPS).forEach((map) => {
		for (const [k, v] of map) inverse.set(v, k);
	});
	return [...input].map((ch) => inverse.get(ch) || ch).join('');
}

function applyStyle(style) {
	const src = textIn().value;
	const out = style ? convert(src, MAPS[style]) : toPlain(src);
	textOut().value = out;
}

function bindUI() {
	document.querySelectorAll('[data-style]').forEach((btn) => {
		btn.addEventListener('click', () => applyStyle(btn.dataset.style));
	});
	document.getElementById('clear')?.addEventListener('click', () => {
		textOut().value = toPlain(textIn().value);
	});
	document.getElementById('copy')?.addEventListener('click', async () => {
		await navigator.clipboard.writeText(textOut().value || '');
		toast('¡Copiado al portapapeles!');
	});
	document.getElementById('reshare')?.addEventListener('click', async () => {
		const text = textOut().value || textIn().value || '';
		if (navigator.share) {
			await navigator.share({ text });
		} else {
			await navigator.clipboard.writeText(text);
			toast('Compartir no disponible. Texto copiado.');
		}
	});
	// Autoaplicar cuando llegue contenido desde /share
	window.addEventListener('fancy:input-ready', () => {
		applyStyle('bold');
	});
}

function toast(msg) {
	const el = document.createElement('div');
	el.className = 'toast';
	el.textContent = msg;
	document.body.appendChild(el);
	setTimeout(() => el.classList.add('show'));
	setTimeout(() => el.classList.remove('show'), 2000);
	setTimeout(() => el.remove(), 2600);
}

window.addEventListener('DOMContentLoaded', bindUI);
