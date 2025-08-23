const editor = () => document.getElementById('editor');

// Sistema de historial para deshacer
let history = [];
let historyIndex = -1;

// --- Mapeos Unicode por código de carácter ---
const MAPS = {
	// Mathematical Bold - A-Z (65-90), a-z (97-122), 0-9 (48-57)
	bold: new Map([
		// A-Z
		[65, '𝐀'], [66, '𝐁'], [67, '𝐂'], [68, '𝐃'], [69, '𝐄'], [70, '𝐅'], [71, '𝐆'], [72, '𝐇'], 
		[73, '𝐈'], [74, '𝐉'], [75, '𝐊'], [76, '𝐋'], [77, '𝐌'], [78, '𝐍'], [79, '𝐎'], [80, '𝐏'], 
		[81, '𝐐'], [82, '𝐑'], [83, '𝐒'], [84, '𝐓'], [85, '𝐔'], [86, '𝐕'], [87, '𝐖'], [88, '𝐗'], 
		[89, '𝐘'], [90, '𝐙'],
		// a-z
		[97, '𝐚'], [98, '𝐛'], [99, '𝐜'], [100, '𝐝'], [101, '𝐞'], [102, '𝐟'], [103, '𝐠'], [104, '𝐡'], 
		[105, '𝐢'], [106, '𝐣'], [107, '𝐤'], [108, '𝐥'], [109, '𝐦'], [110, '𝐧'], [111, '𝐨'], [112, '𝐩'], 
		[113, '𝐪'], [114, '𝐫'], [115, '𝐬'], [116, '𝐭'], [117, '𝐮'], [118, '𝐯'], [119, '𝐰'], [120, '𝐱'], 
		[121, '𝐲'], [122, '𝐳'],
		// 0-9
		[48, '𝟎'], [49, '𝟏'], [50, '𝟐'], [51, '𝟑'], [52, '𝟒'], [53, '𝟓'], [54, '𝟔'], [55, '𝟕'], 
		[56, '𝟖'], [57, '𝟗']
	]),

	// Mathematical Italic - A-Z (65-90), a-z (97-122)
	italic: new Map([
		// A-Z
		[65, '𝐴'], [66, '𝐵'], [67, '𝐶'], [68, '𝐷'], [69, '𝐸'], [70, '𝐹'], [71, '𝐺'], [72, '𝐻'], 
		[73, '𝐼'], [74, '𝐽'], [75, '𝐾'], [76, '𝐿'], [77, '𝑀'], [78, '𝑁'], [79, '𝑂'], [80, '𝑃'], 
		[81, '𝑄'], [82, '𝑅'], [83, '𝑆'], [84, '𝑇'], [85, '𝑈'], [86, '𝑉'], [87, '𝑊'], [88, '𝑋'], 
		[89, '𝑌'], [90, '𝑍'],
		// a-z
		[97, '𝑎'], [98, '𝑏'], [99, '𝑐'], [100, '𝑑'], [101, '𝑒'], [102, '𝑓'], [103, '𝑔'], [104, 'ℎ'], 
		[105, '𝑖'], [106, '𝑗'], [107, '𝑘'], [108, '𝑙'], [109, '𝑚'], [110, '𝑛'], [111, '𝑜'], [112, '𝑝'], 
		[113, '𝑞'], [114, '𝑟'], [115, '𝑠'], [116, '𝑡'], [117, '𝑢'], [118, '𝑣'], [119, '𝑤'], [120, '𝑥'], 
		[121, '𝑦'], [122, '𝑧']
	]),

	// Monospace (Fullwidth) - A-Z (65-90), a-z (97-122), 0-9 (48-57)
	mono: new Map([
		// A-Z
		[65, 'Ａ'], [66, 'Ｂ'], [67, 'Ｃ'], [68, 'Ｄ'], [69, 'Ｅ'], [70, 'Ｆ'], [71, 'Ｇ'], [72, 'Ｈ'], 
		[73, 'Ｉ'], [74, 'Ｊ'], [75, 'Ｋ'], [76, 'Ｌ'], [77, 'Ｍ'], [78, 'Ｎ'], [79, 'Ｏ'], [80, 'Ｐ'], 
		[81, 'Ｑ'], [82, 'Ｒ'], [83, 'Ｓ'], [84, 'Ｔ'], [85, 'Ｕ'], [86, 'Ｖ'], [87, 'Ｗ'], [88, 'Ｘ'], 
		[89, 'Ｙ'], [90, 'Ｚ'],
		// a-z
		[97, 'ａ'], [98, 'ｂ'], [99, 'ｃ'], [100, 'ｄ'], [101, 'ｅ'], [102, 'ｆ'], [103, 'ｇ'], [104, 'ｈ'], 
		[105, 'ｉ'], [106, 'ｊ'], [107, 'ｋ'], [108, 'ｌ'], [109, 'ｍ'], [110, 'ｎ'], [111, 'ｏ'], [112, 'ｐ'], 
		[113, 'ｑ'], [114, 'ｒ'], [115, 'ｓ'], [116, 'ｔ'], [117, 'ｕ'], [118, 'ｖ'], [119, 'ｗ'], [120, 'ｘ'], 
		[121, 'ｙ'], [122, 'ｚ'],
		// 0-9
		[48, '０'], [49, '１'], [50, '２'], [51, '３'], [52, '４'], [53, '５'], [54, '６'], [55, '７'], 
		[56, '８'], [57, '９']
	]),

	// Bold Italic - A-Z (65-90), a-z (97-122)
	bolditalic: new Map([
		// A-Z
		[65, '𝑨'], [66, '𝑩'], [67, '𝑪'], [68, '𝑫'], [69, '𝑬'], [70, '𝑭'], [71, '𝑮'], [72, '𝑯'], 
		[73, '𝑰'], [74, '𝑱'], [75, '𝑲'], [76, '𝑳'], [77, '𝑴'], [78, '𝑵'], [79, '𝑶'], [80, '𝑷'], 
		[81, '𝑸'], [82, '𝑹'], [83, '𝑺'], [84, '𝑻'], [85, '𝑼'], [86, '𝑽'], [87, '𝑾'], [88, '𝑿'], 
		[89, '𝒀'], [90, '𝒁'],
		// a-z
		[97, '𝒂'], [98, '𝒃'], [99, '𝒄'], [100, '𝒅'], [101, '𝒆'], [102, '𝒇'], [103, '𝒈'], [104, '𝒉'], 
		[105, '𝒊'], [106, '𝒋'], [107, '𝒌'], [108, '𝒍'], [109, '𝒎'], [110, '𝒏'], [111, '𝒐'], [112, '𝒑'], 
		[113, '𝒒'], [114, '𝒓'], [115, '𝒔'], [116, '𝒕'], [117, '𝒖'], [118, '𝒗'], [119, '𝒘'], [120, '𝒙'], 
		[121, '𝒚'], [122, '𝒛']
	]),

	// Script - A-Z (65-90), a-z (97-122)
	script: new Map([
		// A-Z
		[65, '𝒜'], [66, 'ℬ'], [67, '𝒞'], [68, '𝒟'], [69, 'ℰ'], [70, 'ℱ'], [71, '𝒢'], [72, 'ℋ'], 
		[73, 'ℐ'], [74, '𝒥'], [75, '𝒦'], [76, 'ℒ'], [77, 'ℳ'], [78, '𝒩'], [79, '𝒪'], [80, '𝒫'], 
		[81, '𝒬'], [82, 'ℛ'], [83, '𝒮'], [84, '𝒯'], [85, '𝒰'], [86, '𝒱'], [87, '𝒲'], [88, '𝒳'], 
		[89, '𝒴'], [90, '𝒵'],
		// a-z
		[97, '𝒶'], [98, '𝒷'], [99, '𝒸'], [100, '𝒹'], [101, 'ℯ'], [102, '𝒻'], [103, 'ℊ'], [104, 'ℎ'], 
		[105, '𝒾'], [106, '𝒿'], [107, '𝓀'], [108, '𝓁'], [109, '𝓂'], [110, '𝓃'], [111, 'ℴ'], [112, '𝓅'], 
		[113, '𝓆'], [114, '𝓇'], [115, '𝓈'], [116, '𝓉'], [117, '𝓊'], [118, '𝓋'], [119, '𝓌'], [120, '𝓍'], 
		[121, '𝓎'], [122, '𝓏']
	]),

	// Bold Script - A-Z (65-90), a-z (97-122)
	boldscript: new Map([
		// A-Z
		[65, '𝓐'], [66, '𝓑'], [67, '𝓒'], [68, '𝓓'], [69, '𝓔'], [70, '𝓕'], [71, '𝓖'], [72, '𝓗'], 
		[73, '𝓘'], [74, '𝓙'], [75, '𝓚'], [76, '𝓛'], [77, '𝓜'], [78, '𝓝'], [79, '𝓞'], [80, '𝓟'], 
		[81, '𝓠'], [82, '𝓡'], [83, '𝓢'], [84, '𝓣'], [85, '𝓤'], [86, '𝓥'], [87, '𝓦'], [88, '𝓧'], 
		[89, '𝓨'], [90, '𝓩'],
		// a-z
		[97, '𝓪'], [98, '𝓫'], [99, '𝓬'], [100, '𝓭'], [101, '𝓮'], [102, '𝓯'], [103, '𝓰'], [104, '𝓱'], 
		[105, '𝓲'], [106, '𝓳'], [107, '𝓴'], [108, '𝓵'], [109, '𝓶'], [110, '𝓷'], [111, '𝓸'], [112, '𝓹'], 
		[113, '𝓺'], [114, '𝓻'], [115, '𝓼'], [116, '𝓽'], [117, '𝓾'], [118, '𝓿'], [119, '𝔀'], [120, '𝔁'], 
		[121, '𝔂'], [122, '𝔃']
	]),

	// Double-struck - A-Z (65-90), a-z (97-122), 0-9 (48-57)
	doublestruck: new Map([
		// A-Z
		[65, '𝔸'], [66, '𝔹'], [67, 'ℂ'], [68, '𝔻'], [69, '𝔼'], [70, '𝔽'], [71, '𝔾'], [72, 'ℍ'], 
		[73, '𝕀'], [74, '𝕁'], [75, '𝕂'], [76, '𝕃'], [77, '𝕄'], [78, 'ℕ'], [79, '𝕆'], [80, 'ℙ'], 
		[81, 'ℚ'], [82, 'ℝ'], [83, '𝕊'], [84, '𝕋'], [85, '𝕌'], [86, '𝕍'], [87, '𝕎'], [88, '𝕏'], 
		[89, '𝕐'], [90, 'ℤ'],
		// a-z
		[97, '𝕒'], [98, '𝕓'], [99, '𝕔'], [100, '𝕕'], [101, '𝕖'], [102, '𝕗'], [103, '𝕘'], [104, '𝕙'], 
		[105, '𝕚'], [106, '𝕛'], [107, '𝕜'], [108, '𝕝'], [109, '𝕞'], [110, '𝕟'], [111, '𝕠'], [112, '𝕡'], 
		[113, '𝕢'], [114, '𝕣'], [115, '𝕤'], [116, '𝕥'], [117, '𝕦'], [118, '𝕧'], [119, '𝕨'], [120, '𝕩'], 
		[121, '𝕪'], [122, '𝕫'],
		// 0-9
		[48, '𝟘'], [49, '𝟙'], [50, '𝟚'], [51, '𝟛'], [52, '𝟜'], [53, '𝟝'], [54, '𝟞'], [55, '𝟟'], 
		[56, '𝟠'], [57, '𝟡']
	]),

	// Sans-serif - A-Z (65-90), a-z (97-122), 0-9 (48-57)
	sans: new Map([
		// A-Z
		[65, '𝖠'], [66, '𝖡'], [67, '𝖢'], [68, '𝖣'], [69, '𝖤'], [70, '𝖥'], [71, '𝖦'], [72, '𝖧'], 
		[73, '𝖨'], [74, '𝖩'], [75, '𝖪'], [76, '𝖫'], [77, '𝖬'], [78, '𝖭'], [79, '𝖮'], [80, '𝖯'], 
		[81, '𝖰'], [82, '𝖱'], [83, '𝖲'], [84, '𝖳'], [85, '𝖴'], [86, '𝖵'], [87, '𝖶'], [88, '𝖷'], 
		[89, '𝖸'], [90, '𝖹'],
		// a-z
		[97, '𝖺'], [98, '𝖻'], [99, '𝖼'], [100, '𝖽'], [101, '𝖾'], [102, '𝖿'], [103, '𝗀'], [104, '𝗁'], 
		[105, '𝗂'], [106, '𝗃'], [107, '𝗄'], [108, '𝗅'], [109, '𝗆'], [110, '𝗇'], [111, '𝗈'], [112, '𝗉'], 
		[113, '𝗊'], [114, '𝗋'], [115, '𝗌'], [116, '𝗍'], [117, '𝗎'], [118, '𝗏'], [119, '𝗐'], [120, '𝗑'], 
		[121, '𝗒'], [122, '𝗓'],
		// 0-9
		[48, '𝟢'], [49, '𝟣'], [50, '𝟤'], [51, '𝟥'], [52, '𝟦'], [53, '𝟧'], [54, '𝟨'], [55, '𝟩'], 
		[56, '𝟪'], [57, '𝟫']
	]),

	// Sans Bold - A-Z (65-90), a-z (97-122), 0-9 (48-57)
	sansbold: new Map([
		// A-Z
		[65, '𝗔'], [66, '𝗕'], [67, '𝗖'], [68, '𝗗'], [69, '𝗘'], [70, '𝗙'], [71, '𝗚'], [72, '𝗛'], 
		[73, '𝗜'], [74, '𝗝'], [75, '𝗞'], [76, '𝗟'], [77, '𝗠'], [78, '𝗡'], [79, '𝗢'], [80, '𝗣'], 
		[81, '𝗤'], [82, '𝗥'], [83, '𝗦'], [84, '𝗧'], [85, '𝗨'], [86, '𝗩'], [87, '𝗪'], [88, '𝗫'], 
		[89, '𝗬'], [90, '𝗭'],
		// a-z
		[97, '𝗮'], [98, '𝗯'], [99, '𝗰'], [100, '𝗱'], [101, '𝗲'], [102, '𝗳'], [103, '𝗴'], [104, '𝗵'], 
		[105, '𝗶'], [106, '𝗷'], [107, '𝗸'], [108, '𝗹'], [109, '𝗺'], [110, '𝗻'], [111, '𝗼'], [112, '𝗽'], 
		[113, '𝗾'], [114, '𝗿'], [115, '𝘀'], [116, '𝘁'], [117, '𝘂'], [118, '𝘃'], [119, '𝘄'], [120, '𝘅'], 
		[121, '𝘆'], [122, '𝘇'],
		// 0-9
		[48, '𝟬'], [49, '𝟭'], [50, '𝟮'], [51, '𝟯'], [52, '𝟰'], [53, '𝟱'], [54, '𝟲'], [55, '𝟳'], 
		[56, '𝟴'], [57, '𝟵']
	]),

	// Sans Italic - A-Z (65-90), a-z (97-122)
	sansitalic: new Map([
		// A-Z
		[65, '𝘈'], [66, '𝘉'], [67, '𝘊'], [68, '𝘋'], [69, '𝘌'], [70, '𝘍'], [71, '𝘎'], [72, '𝘏'], 
		[73, '𝘐'], [74, '𝘑'], [75, '𝘒'], [76, '𝘓'], [77, '𝘔'], [78, '𝘕'], [79, '𝘖'], [80, '𝘗'], 
		[81, '𝘘'], [82, '𝘙'], [83, '𝘚'], [84, '𝘛'], [85, '𝘜'], [86, '𝘝'], [87, '𝘞'], [88, '𝘟'], 
		[89, '𝘠'], [90, '𝘡'],
		// a-z
		[97, '𝘢'], [98, '𝘣'], [99, '𝘤'], [100, '𝘥'], [101, '𝘦'], [102, '𝘧'], [103, '𝘨'], [104, '𝘩'], 
		[105, '𝘪'], [106, '𝘫'], [107, '𝘬'], [108, '𝘭'], [109, '𝘮'], [110, '𝘯'], [111, '𝘰'], [112, '𝘱'], 
		[113, '𝘲'], [114, '𝘳'], [115, '𝘴'], [116, '𝘵'], [117, '𝘶'], [118, '𝘷'], [119, '𝘸'], [120, '𝘹'], 
		[121, '𝘺'], [122, '𝘻']
	]),

	// Circled - A-Z (65-90), a-z (97-122), 0-9 (48-57)
	circled: new Map([
		// A-Z
		[65, 'Ⓐ'], [66, 'Ⓑ'], [67, 'Ⓒ'], [68, 'Ⓓ'], [69, 'Ⓔ'], [70, 'Ⓕ'], [71, 'Ⓖ'], [72, 'Ⓗ'], 
		[73, 'Ⓘ'], [74, 'Ⓙ'], [75, 'Ⓚ'], [76, 'Ⓛ'], [77, 'Ⓜ'], [78, 'Ⓝ'], [79, 'Ⓞ'], [80, 'Ⓟ'], 
		[81, 'Ⓠ'], [82, 'Ⓡ'], [83, 'Ⓢ'], [84, 'Ⓣ'], [85, 'Ⓤ'], [86, 'Ⓥ'], [87, 'Ⓦ'], [88, 'Ⓧ'], 
		[89, 'Ⓨ'], [90, 'Ⓩ'],
		// a-z
		[97, 'ⓐ'], [98, 'ⓑ'], [99, 'ⓒ'], [100, 'ⓓ'], [101, 'ⓔ'], [102, 'ⓕ'], [103, 'ⓖ'], [104, 'ⓗ'], 
		[105, 'ⓘ'], [106, 'ⓙ'], [107, 'ⓚ'], [108, 'ⓛ'], [109, 'ⓜ'], [110, 'ⓝ'], [111, 'ⓞ'], [112, 'ⓟ'], 
		[113, 'ⓠ'], [114, 'ⓡ'], [115, 'ⓢ'], [116, 'ⓣ'], [117, 'ⓤ'], [118, 'ⓥ'], [119, 'ⓦ'], [120, 'ⓧ'], 
		[121, 'ⓨ'], [122, 'ⓩ'],
		// 0-9 (special circled numbers)
		[48, '⓪'], [49, '①'], [50, '②'], [51, '③'], [52, '④'], [53, '⑤'], [54, '⑥'], [55, '⑦'], 
		[56, '⑧'], [57, '⑨']
	]),

	// Squared - A-Z (65-90), a-z (97-122)
	squared: new Map([
		// A-Z
		[65, '🄰'], [66, '🄱'], [67, '🄲'], [68, '🄳'], [69, '🄴'], [70, '🄵'], [71, '🄶'], [72, '🄷'], 
		[73, '🄸'], [74, '🄹'], [75, '🄺'], [76, '🄻'], [77, '🄼'], [78, '🄽'], [79, '🄾'], [80, '🄿'], 
		[81, '🅀'], [82, '🅁'], [83, '🅂'], [84, '🅃'], [85, '🅄'], [86, '🅅'], [87, '🅆'], [88, '🅇'], 
		[89, '🅈'], [90, '🅉'],
		// a-z
		[97, '🅰'], [98, '🅱'], [99, '🅲'], [100, '🅳'], [101, '🅴'], [102, '🅵'], [103, '🅶'], [104, '🅷'], 
		[105, '🅸'], [106, '🅹'], [107, '🅺'], [108, '🅻'], [109, '🅼'], [110, '🅽'], [111, '🅾'], [112, '🅿'], 
		[113, '🆀'], [114, '🆁'], [115, '🆂'], [116, '🆃'], [117, '🆄'], [118, '🆅'], [119, '🆆'], [120, '🆇'], 
		[121, '🆈'], [122, '🆉']
	])
};

function convert(input, map) {
	return [...input]
		.map((ch) => {
			// No tocar hashtags y menciones
			if (ch === '#' || ch === '@') return ch;
			
			// Buscar por código de carácter
			const charCode = ch.charCodeAt(0);
			const mapped = map.get(charCode);
			if (mapped) return mapped;
			
			// Caracteres especiales españoles - mantener sin cambio
			if ('ñÑáéíóúüÁÉÍÓÚÜ¿¡'.includes(ch)) return ch;
			
			return ch;
		})
		.join('');
}

function toPlain(input) {
	// Reemplazo inverso simple (parcial)
	const inverse = new Map();
	Object.values(MAPS).forEach((map) => {
		for (const [charCode, styledChar] of map) {
			inverse.set(styledChar, String.fromCharCode(charCode));
		}
	});
	return [...input].map((ch) => inverse.get(ch) || ch).join('');
}

// Guardar estado en el historial
function saveState() {
	const currentValue = editor().value;
	
	// Solo guardamos si es diferente al último estado
	if (history.length === 0 || history[historyIndex] !== currentValue) {
		// Si no estamos al final del historial, eliminamos los estados posteriores
		if (historyIndex < history.length - 1) {
			history = history.slice(0, historyIndex + 1);
		}
		
		history.push(currentValue);
		historyIndex = history.length - 1;
		
		// Limitamos el historial a 50 estados
		if (history.length > 50) {
			history.shift();
			historyIndex--;
		}
	}
}

// Aplicar estilo al texto seleccionado
function applyStyleToSelection(style) {
	const textarea = editor();
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	
	// Si no hay selección, aplicar a todo el texto
	if (start === end) {
		saveState();
		const converted = style ? convert(text, MAPS[style]) : toPlain(text);
		textarea.value = converted;
		toast(`Estilo ${getStyleName(style)} aplicado a todo el texto`);
		return;
	}
	
	// Aplicar estilo solo al texto seleccionado
	saveState();
	const selectedText = text.substring(start, end);
	const convertedText = style ? convert(selectedText, MAPS[style]) : toPlain(selectedText);
	
	const newText = text.substring(0, start) + convertedText + text.substring(end);
	textarea.value = newText;
	
	// Mantener la selección en el texto convertido
	const newEnd = start + convertedText.length;
	textarea.setSelectionRange(start, newEnd);
	textarea.focus();
	
	toast(`Estilo ${getStyleName(style)} aplicado a la selección`);
}

// Obtener nombre del estilo para mostrar
function getStyleName(style) {
	const names = {
		bold: 'negrita',
		italic: 'cursiva',
		bolditalic: 'negrita cursiva',
		script: 'script',
		boldscript: 'bold script',
		doublestruck: 'double struck',
		mono: 'monospace',
		sans: 'sans-serif',
		sansbold: 'sans negrita',
		sansitalic: 'sans cursiva',
		circled: 'círculos',
		squared: 'cuadrados'
	};
	return names[style] || 'texto plano';
}

// Función para deshacer
function undo() {
	if (historyIndex > 0) {
		historyIndex--;
		editor().value = history[historyIndex];
		toast('Deshecho aplicado');
	} else {
		toast('No hay más acciones para deshacer');
	}
}

// Función para copiar
async function copyText() {
	const text = editor().value;
	if (!text.trim()) {
		toast('No hay texto para copiar');
		return;
	}
	
	try {
		await navigator.clipboard.writeText(text);
		toast('¡Texto copiado al portapapeles!');
	} catch (err) {
		toast('Error al copiar texto');
	}
}

// Función para compartir
async function shareText() {
	const text = editor().value;
	if (!text.trim()) {
		toast('No hay texto para compartir');
		return;
	}
	
	try {
		if (navigator.share) {
			await navigator.share({ 
				text,
				title: 'Texto con estilo de FancyText'
			});
		} else {
			await navigator.clipboard.writeText(text);
			toast('Compartir no disponible. Texto copiado al portapapeles.');
		}
	} catch (err) {
		if (err.name !== 'AbortError') {
			await navigator.clipboard.writeText(text);
			toast('Error al compartir. Texto copiado al portapapeles.');
		}
	}
}

function bindUI() {
	// Event listener para cambios en el select - aplicar automáticamente
	document.getElementById('style-select')?.addEventListener('change', (e) => {
		const selectedStyle = e.target.value;
		
		if (!selectedStyle) {
			return; // No hacer nada si se selecciona la opción por defecto
		}
		
		const style = selectedStyle === 'plain' ? null : selectedStyle;
		applyStyleToSelection(style);
		
		// Resetear el select después de aplicar
		e.target.value = '';
	});
	
	// Botones de acción
	document.getElementById('undo')?.addEventListener('click', undo);
	document.getElementById('copy')?.addEventListener('click', copyText);
	document.getElementById('share')?.addEventListener('click', shareText);
	
	// Guardar estado inicial cuando el usuario empieza a escribir
	const textarea = editor();
	let isFirstInput = true;
	
	textarea.addEventListener('input', () => {
		if (isFirstInput) {
			// Guardamos el estado inicial vacío
			if (history.length === 0) {
				history.push('');
				historyIndex = 0;
			}
			isFirstInput = false;
		}
	});
	
	// Atajos de teclado
	textarea.addEventListener('keydown', (e) => {
		// Ctrl+Z para deshacer
		if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			undo();
		}
		// Ctrl+C para copiar (solo si hay selección)
		else if (e.ctrlKey && e.key === 'c' && textarea.selectionStart !== textarea.selectionEnd) {
			// Dejar que el navegador maneje la copia de la selección
			return;
		}
		// Ctrl+A para seleccionar todo
		else if (e.ctrlKey && e.key === 'a') {
			// Dejar que el navegador maneje la selección
			return;
		}
	});
	
	// Autoaplicar cuando llegue contenido desde /share
	window.addEventListener('fancy:input-ready', () => {
		saveState();
		applyStyleToSelection('bold');
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