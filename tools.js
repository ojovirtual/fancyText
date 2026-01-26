// tools.js - Lógica para herramientas satélite

// ============================================
// 1. CONTADOR DE CARACTERES
// ============================================
export function initCharCounter() {
	const input = document.getElementById('counter-input');
	if (!input) return;

	input.addEventListener('input', () => {
		const text = input.value;

		// Stats básicas
		const chars = text.length;
		const charsNoSpace = text.replace(/\s/g, '').length;
		const words = text.trim() ? text.trim().split(/\s+/).length : 0;
		const paragraphs = text.trim() ? text.split(/\n\n+/).filter(p => p.trim()).length : 0;

		document.getElementById('char-count').textContent = chars;
		document.getElementById('char-no-space-count').textContent = charsNoSpace;
		document.getElementById('word-count').textContent = words;
		document.getElementById('paragraph-count').textContent = paragraphs;

		// Límites de redes sociales
		updateLimit('twitter', chars, 280);
		updateLimit('instagram', chars, 150);
		updateLimit('tiktok', chars, 80);
	});

	// Trigger inicial
	input.dispatchEvent(new Event('input'));
}

function updateLimit(platform, count, max) {
	const countEl = document.getElementById(`${platform}-count`);
	const progressEl = document.getElementById(`${platform}-progress`);

	if (!countEl || !progressEl) return;

	countEl.textContent = `${count} / ${max}`;
	const percentage = Math.min((count / max) * 100, 100);
	progressEl.style.width = `${percentage}%`;

	// Color coding
	if (count > max) {
		progressEl.style.background = '#dc2626';
	} else if (percentage > 80) {
		progressEl.style.background = '#f59e0b';
	} else {
		progressEl.style.background = 'var(--accent)';
	}
}

// ============================================
// 2. GENERADOR DE ESPACIOS INVISIBLES
// ============================================
export function initInvisibleSpaces() {
	document.querySelectorAll('.copy-char-btn').forEach(btn => {
		btn.addEventListener('click', async () => {
			const char = btn.dataset.char;

			try {
				await navigator.clipboard.writeText(char);
				const originalText = btn.textContent;
				btn.textContent = '¡Copiado!';
				btn.style.background = '#10b981';
				setTimeout(() => {
					btn.textContent = originalText;
					btn.style.background = '';
				}, 1500);
			} catch (err) {
				btn.textContent = 'Error';
				setTimeout(() => btn.textContent = 'Copiar', 1500);
			}
		});
	});
}

// ============================================
// 3. INVERTIR TEXTO
// ============================================
const FLIP_MAP = {
	'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ',
	'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l',
	'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ',
	's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x',
	'y': 'ʎ', 'z': 'z',
	'A': '∀', 'B': 'ᙠ', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'Ⅎ',
	'G': '⅁', 'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥',
	'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ', 'Q': 'Ὸ', 'R': 'ᴚ',
	'S': 'S', 'T': '⊥', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X',
	'Y': '⅄', 'Z': 'Z',
	'0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ',
	'6': '9', '7': 'ㄥ', '8': '8', '9': '6',
	'.': '˙', ',': '\'', '!': '¡', '?': '¿', '\'': ',',
	'(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{'
};

export function initTextInverter() {
	let mode = 'reverse';
	const input = document.getElementById('input-text');
	const output = document.getElementById('output-text');

	if (!input || !output) return;

	// Mode selector
	document.querySelectorAll('.mode-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			document.querySelector('.mode-btn.active')?.classList.remove('active');
			btn.classList.add('active');
			mode = btn.dataset.mode;
			updateOutput();
		});
	});

	input.addEventListener('input', updateOutput);

	function updateOutput() {
		const text = input.value;
		if (mode === 'reverse') {
			output.value = [...text].reverse().join('');
		} else {
			// Flip mode: invertir caracteres Y orden
			output.value = [...text].reverse().map(ch => FLIP_MAP[ch] || ch).join('');
		}
	}

	// Copy button
	const copyBtn = document.getElementById('copy-inverted');
	if (copyBtn) {
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(output.value);
				const originalText = copyBtn.textContent;
				copyBtn.textContent = '¡Copiado!';
				setTimeout(() => copyBtn.textContent = originalText, 1500);
			} catch (err) {
				copyBtn.textContent = 'Error';
				setTimeout(() => copyBtn.textContent = 'Copiar resultado', 1500);
			}
		});
	}
}

// ============================================
// 4. SEPARADORES PARA INSTAGRAM
// ============================================
export function initSeparators() {
	let currentCategory = 'all';

	// Category filter
	document.querySelectorAll('.category-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			document.querySelector('.category-btn.active')?.classList.remove('active');
			btn.classList.add('active');
			currentCategory = btn.dataset.category;
			filterSeparators();
		});
	});

	function filterSeparators() {
		document.querySelectorAll('.separator-card').forEach(card => {
			if (currentCategory === 'all' || card.dataset.category === currentCategory) {
				card.style.display = 'block';
			} else {
				card.style.display = 'none';
			}
		});
	}

	// Copy separators
	document.querySelectorAll('.copy-separator').forEach(btn => {
		btn.addEventListener('click', async () => {
			const separator = btn.previousElementSibling.textContent;
			try {
				await navigator.clipboard.writeText(separator);
				const originalText = btn.textContent;
				btn.textContent = '¡Copiado!';
				btn.style.background = '#10b981';
				setTimeout(() => {
					btn.textContent = originalText;
					btn.style.background = '';
				}, 1500);
			} catch (err) {
				btn.textContent = 'Error';
				setTimeout(() => btn.textContent = 'Copiar', 1500);
			}
		});
	});
}

// ============================================
// AUTO-INIT basado en la página actual
// ============================================
window.addEventListener('DOMContentLoaded', () => {
	const path = window.location.pathname;

	if (path.includes('contador-caracteres')) {
		initCharCounter();
	} else if (path.includes('espacio-invisible')) {
		initInvisibleSpaces();
	} else if (path.includes('invertir-texto')) {
		initTextInverter();
	} else if (path.includes('separadores-instagram')) {
		initSeparators();
	}
});
