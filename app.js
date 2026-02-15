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
	]),

	// Fraktur / Old English - A-Z (65-90), a-z (97-122)
	fraktur: new Map([
		// A-Z
		[65, '𝔄'], [66, '𝔅'], [67, 'ℭ'], [68, '𝔇'], [69, '𝔈'], [70, '𝔉'], [71, '𝔊'], [72, 'ℌ'],
		[73, 'ℑ'], [74, '𝔍'], [75, '𝔎'], [76, '𝔏'], [77, '𝔐'], [78, '𝔑'], [79, '𝔒'], [80, '𝔓'],
		[81, '𝔔'], [82, 'ℜ'], [83, '𝔖'], [84, '𝔗'], [85, '𝔘'], [86, '𝔙'], [87, '𝔚'], [88, '𝔛'],
		[89, '𝔜'], [90, 'ℨ'],
		// a-z
		[97, '𝔞'], [98, '𝔟'], [99, '𝔠'], [100, '𝔡'], [101, '𝔢'], [102, '𝔣'], [103, '𝔤'], [104, '𝔥'],
		[105, '𝔦'], [106, '𝔧'], [107, '𝔨'], [108, '𝔩'], [109, '𝔪'], [110, '𝔫'], [111, '𝔬'], [112, '𝔭'],
		[113, '𝔮'], [114, '𝔯'], [115, '𝔰'], [116, '𝔱'], [117, '𝔲'], [118, '𝔳'], [119, '𝔴'], [120, '𝔵'],
		[121, '𝔶'], [122, '𝔷']
	]),

	// Small Caps - A-Z (65-90), a-z (97-122)
	smallcaps: new Map([
		// A-Z (mantener mayúsculas normales)
		[65, 'A'], [66, 'B'], [67, 'C'], [68, 'D'], [69, 'E'], [70, 'F'], [71, 'G'], [72, 'H'],
		[73, 'I'], [74, 'J'], [75, 'K'], [76, 'L'], [77, 'M'], [78, 'N'], [79, 'O'], [80, 'P'],
		[81, 'Q'], [82, 'R'], [83, 'S'], [84, 'T'], [85, 'U'], [86, 'V'], [87, 'W'], [88, 'X'],
		[89, 'Y'], [90, 'Z'],
		// a-z (small caps Unicode)
		[97, 'ᴀ'], [98, 'ʙ'], [99, 'ᴄ'], [100, 'ᴅ'], [101, 'ᴇ'], [102, 'ꜰ'], [103, 'ɢ'], [104, 'ʜ'],
		[105, 'ɪ'], [106, 'ᴊ'], [107, 'ᴋ'], [108, 'ʟ'], [109, 'ᴍ'], [110, 'ɴ'], [111, 'ᴏ'], [112, 'ᴘ'],
		[113, 'ǫ'], [114, 'ʀ'], [115, 'ꜱ'], [116, 'ᴛ'], [117, 'ᴜ'], [118, 'ᴠ'], [119, 'ᴡ'], [120, 'x'],
		[121, 'ʏ'], [122, 'ᴢ']
	]),

	// Superscript - A-Z (65-90), a-z (97-122), 0-9 (48-57) - cobertura parcial
	superscript: new Map([
		// A-Z (cobertura parcial en Unicode)
		[65, 'ᴬ'], [66, 'ᴮ'], [67, 'ᶜ'], [68, 'ᴰ'], [69, 'ᴱ'], [70, 'ᶠ'], [71, 'ᴳ'], [72, 'ᴴ'],
		[73, 'ᴵ'], [74, 'ᴶ'], [75, 'ᴷ'], [76, 'ᴸ'], [77, 'ᴹ'], [78, 'ᴺ'], [79, 'ᴼ'], [80, 'ᴾ'],
		[81, 'Q'], [82, 'ᴿ'], [83, 'ˢ'], [84, 'ᵀ'], [85, 'ᵁ'], [86, 'ⱽ'], [87, 'ᵂ'], [88, 'ˣ'],
		[89, 'ʸ'], [90, 'ᶻ'],
		// a-z
		[97, 'ᵃ'], [98, 'ᵇ'], [99, 'ᶜ'], [100, 'ᵈ'], [101, 'ᵉ'], [102, 'ᶠ'], [103, 'ᵍ'], [104, 'ʰ'],
		[105, 'ⁱ'], [106, 'ʲ'], [107, 'ᵏ'], [108, 'ˡ'], [109, 'ᵐ'], [110, 'ⁿ'], [111, 'ᵒ'], [112, 'ᵖ'],
		[113, 'q'], [114, 'ʳ'], [115, 'ˢ'], [116, 'ᵗ'], [117, 'ᵘ'], [118, 'ᵛ'], [119, 'ʷ'], [120, 'ˣ'],
		[121, 'ʸ'], [122, 'ᶻ'],
		// 0-9
		[48, '⁰'], [49, '¹'], [50, '²'], [51, '³'], [52, '⁴'], [53, '⁵'], [54, '⁶'], [55, '⁷'],
		[56, '⁸'], [57, '⁹']
	]),

	// Inverted / Upside Down - A-Z (65-90), a-z (97-122)
	inverted: new Map([
		// A-Z
		[65, '∀'], [66, 'ᙠ'], [67, 'Ɔ'], [68, 'ᗡ'], [69, 'Ǝ'], [70, 'Ⅎ'], [71, '⅁'], [72, 'H'],
		[73, 'I'], [74, 'ſ'], [75, 'ʞ'], [76, '˥'], [77, 'W'], [78, 'N'], [79, 'O'], [80, 'Ԁ'],
		[81, 'Ὸ'], [82, 'ᴚ'], [83, 'S'], [84, '⊥'], [85, '∩'], [86, 'Λ'], [87, 'M'], [88, 'X'],
		[89, '⅄'], [90, 'Z'],
		// a-z
		[97, 'ɐ'], [98, 'q'], [99, 'ɔ'], [100, 'p'], [101, 'ǝ'], [102, 'ɟ'], [103, 'ƃ'], [104, 'ɥ'],
		[105, 'ᴉ'], [106, 'ɾ'], [107, 'ʞ'], [108, 'l'], [109, 'ɯ'], [110, 'u'], [111, 'o'], [112, 'd'],
		[113, 'b'], [114, 'ɹ'], [115, 's'], [116, 'ʇ'], [117, 'n'], [118, 'ʌ'], [119, 'ʍ'], [120, 'x'],
		[121, 'ʎ'], [122, 'z']
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

// Función especial para estilos con caracteres combinantes (strikethrough, underline)
function convertWithCombining(input, combiningChar) {
	return [...input]
		.map((ch) => {
			// No tocar hashtags y menciones
			if (ch === '#' || ch === '@') return ch;
			// Espacios sin combinar
			if (ch === ' ' || ch === '\n' || ch === '\t') return ch;
			// Añadir carácter combinante después de cada carácter
			return ch + combiningChar;
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
		let converted;
		if (!style) {
			converted = toPlain(text);
		} else if (style === 'strikethrough') {
			converted = convertWithCombining(text, '\u0336');
		} else if (style === 'underline') {
			converted = convertWithCombining(text, '\u0332');
		} else {
			converted = convert(text, MAPS[style]);
		}
		textarea.value = converted;
		toast(`Estilo ${getStyleName(style)} aplicado a todo el texto`);
		return;
	}

	// Aplicar estilo solo al texto seleccionado
	saveState();
	const selectedText = text.substring(start, end);
	let convertedText;
	if (!style) {
		convertedText = toPlain(selectedText);
	} else if (style === 'strikethrough') {
		convertedText = convertWithCombining(selectedText, '\u0336');
	} else if (style === 'underline') {
		convertedText = convertWithCombining(selectedText, '\u0332');
	} else {
		convertedText = convert(selectedText, MAPS[style]);
	}

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
		squared: 'cuadrados',
		fraktur: 'gótico',
		strikethrough: 'tachado',
		underline: 'subrayado',
		smallcaps: 'versalitas',
		superscript: 'superíndice',
		inverted: 'invertido'
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
	// Event listeners para botones de estilo
	document.querySelectorAll('[data-style]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const style = btn.dataset.style === 'plain' ? null : btn.dataset.style;
			applyStyleToSelection(style);
		});
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

// Manejar actualizaciones del Service Worker
function handleServiceWorkerUpdates() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.addEventListener('message', (event) => {
			const { type, version, url } = event.data;

			if (type === 'SW_UPDATED') {
				console.log('[App] Service Worker actualizado a versión:', version);
				reloadApp();
			}

			if (type === 'CONTENT_UPDATED') {
				console.log('[App] Contenido actualizado:', url);
				reloadApp();
			}
		});

		// Comprobar actualizaciones al cargar
		navigator.serviceWorker.ready.then((registration) => {
			if (registration.waiting) {
				reloadApp();
			}
		});
	}
}

function reloadApp() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready.then((registration) => {
			if (registration.waiting) {
				// Activar el service worker que está esperando
				registration.waiting.postMessage({ type: 'SKIP_WAITING' });
			}
			// Recargar la página automáticamente para aplicar los cambios
			window.location.reload();
		});
	}
}

window.addEventListener('DOMContentLoaded', () => {
	bindUI();
	handleServiceWorkerUpdates();
});
