"""
Genera las imágenes Open Graph (1200x630) de cada página en /og/<slug>.png.

Uso: python scripts/og-images.py
Requiere Pillow y las fuentes de Windows (Cambria Math, Segoe UI, Segoe UI Symbol/Historic).
Las imágenes de páginas QR usan scripts/og-qr-<slug>.json si existe
(matriz de módulos del QR con la URL de esa página).
"""

import json
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'og')
FONTS = 'C:/Windows/Fonts/'
W, H = 1200, 630

BG = (11, 18, 32)
FG = (229, 231, 235)
MUTED = (156, 163, 175)
ACCENT = (34, 211, 238)
BLUE = (59, 130, 246)

# slug, texto de muestra (con estilo), titular, subtítulo, opciones
PAGES = [
    ('index', '𝐍𝐞𝐠𝐫𝐢𝐭𝐚𝐬 𝑦 𝐶𝑢𝑟𝑠𝑖𝑣𝑎𝑠', 'Negritas y cursivas para redes', 'Instagram · WhatsApp · TikTok · Facebook', {}),
    ('letras-bonitas-whatsapp', '𝓛𝓮𝓽𝓻𝓪𝓼 𝓑𝓸𝓷𝓲𝓽𝓪𝓼', 'Letras bonitas para WhatsApp', 'Negritas, cursivas y más estilos para tus chats', {}),
    ('cursiva-instagram', '𝘊𝘶𝘳𝘴𝘪𝘷𝘢 𝘐𝘯𝘴𝘵𝘢𝘨𝘳𝘢𝘮', 'Cursiva para Instagram', 'Para tu bio, posts y comentarios', {}),
    ('letras-aesthetic', '𝒜𝑒𝓈𝓉𝒽𝑒𝓉𝒾𝒸 ✧', 'Letras aesthetic', 'Fuentes bonitas para copiar y pegar', {}),
    ('fuentes-tiktok', '𝗙𝘂𝗲𝗻𝘁𝗲𝘀 𝗧𝗶𝗸𝗧𝗼𝗸', 'Fuentes para TikTok', 'Letras para tu perfil y descripciones', {}),
    ('letras-goticas', '𝔏𝔢𝔱𝔯𝔞𝔰 𝔊𝔬𝔱𝔦𝔠𝔞𝔰', 'Letras góticas', 'Fuente gótica para copiar y pegar', {}),
    ('letras-vikingas', '𐌋𐌄𐌕ᚱ𐌀𐌔 ᚢ𐌏ᚱ𐌃𐌆𐌂𐌀𐌔', 'Letras vikingas y rúnicas', 'Texto nórdico para copiar y pegar', {}),
    ('texto-tachado', 'Texto tachado', 'Texto tachado', 'Tacha y subraya texto para tus redes', {'strike': True}),
    ('letras-circulo', 'Ⓛⓔⓣⓡⓐⓢ ⓔⓝ ⓒⓘⓡⓒⓤⓛⓞ', 'Letras en círculo', 'Para copiar y pegar en cualquier app', {}),
    ('letras-cuadrado', '🄻🄴🅃🅁🄰🅂 🄴🄽 🄲🅄🄰🄳🅁🄾', 'Letras en cuadrado', 'Para copiar y pegar en cualquier app', {}),
    ('contador-caracteres', '𝟐𝟖𝟎 · 𝟏𝟓𝟎 · 𝟐𝟐𝟎𝟎', 'Contador de caracteres', 'Comprueba los límites de cada red social', {}),
    ('espacio-invisible', '⟦            ⟧', 'Espacio invisible', 'Copia el carácter invisible al instante', {}),
    ('invertir-texto', 'oʇxǝʇ ɹᴉʇɹǝʌuI', 'Invertir texto', 'Texto al revés y boca abajo', {}),
    ('separadores-instagram', '✦ ━━━━━━━━ ✦', 'Separadores para Instagram', 'Líneas decorativas para tus posts', {}),
    ('simbolos-aesthetic', '⋆ ° ✩ ♡ ☾ ✧ ❀', 'Símbolos aesthetic', 'Cientos de símbolos para copiar y pegar', {}),
    ('generador-qr', None, 'Generador de códigos QR', 'Gratis, sin límites · PNG y SVG', {'qr': True, 'tags': 'URL · Texto · vCard'}),
    ('qr-wifi', None, 'Código QR para tu WiFi', 'Conéctate sin escribir la contraseña', {'qr': True, 'tags': 'PNG · SVG · Cartel para imprimir'}),
    ('qr-whatsapp', None, 'Link y QR de WhatsApp', 'Que te escriban con un toque', {'qr': True, 'tags': 'wa.me · Mensaje predefinido'}),
    ('default', '𝐅𝐚𝐧𝐜𝐲𝐓𝐞𝐱𝐭', 'Letras bonitas para copiar y pegar', 'Negritas, cursivas, símbolos y más', {}),
]


def font(name, size, index=0):
    return ImageFont.truetype(FONTS + name, size, index=index)


def fallback_fonts(size):
    return [
        font('cambria.ttc', size, index=1),  # Cambria Math: alfanuméricos matemáticos
        font('seguisym.ttf', size),          # círculos, cuadrados, símbolos
        font('seguihis.ttf', size),          # runas, itálica antigua
        font('segoeui.ttf', size),           # IPA (texto invertido)
        font('YuGothR.ttc', size),
    ]


def has_glyph(f, ch):
    missing = f.getmask('\U0010FFFF')
    mask = f.getmask(ch)
    return mask.size != missing.size or bytes(mask) != bytes(missing)


def segments(text, fonts):
    """Divide el texto en tramos que dibuja la primera fuente con el glifo."""
    out = []
    for ch in text:
        f = fonts[0] if ch.isspace() else next((f for f in fonts if has_glyph(f, ch)), fonts[0])
        if out and out[-1][1] is f:
            out[-1][0] += ch
        else:
            out.append([ch, f])
    return out


def text_width(segs):
    return sum(f.getlength(t) for t, f in segs)


def draw_fallback(draw, x, y, segs, fill):
    for t, f in segs:
        draw.text((x, y), t, font=f, fill=fill, anchor='ls')
        x += f.getlength(t)


def background():
    img = Image.new('RGB', (W, H), BG)
    glow = Image.new('RGB', (W, H), BG)
    g = ImageDraw.Draw(glow)
    g.ellipse((780, -260, 1380, 340), fill=(20, 70, 110))
    g.ellipse((-240, 380, 360, 980), fill=(30, 45, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img.paste(glow)
    return img


def wrap(text, f, max_width):
    lines, line = [], ''
    for word in text.split():
        candidate = f'{line} {word}'.strip()
        if line and f.getlength(candidate) > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    return lines + [line]


def draw_qr(img, x, y, size, slug):
    path = os.path.join(ROOT, 'scripts', f'og-qr-{slug}.json')
    if os.path.exists(path):
        matrix = json.load(open(path, encoding='utf-8'))
    else:  # patrón decorativo si no hay matriz real
        rnd = random.Random(7)
        matrix = [[rnd.random() < 0.5 for _ in range(25)] for _ in range(25)]
    n = len(matrix)
    quiet = 2
    cell = size / (n + quiet * 2)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((x, y, x + size, y + size), radius=18, fill=(255, 255, 255))
    for r, row in enumerate(matrix):
        for c, on in enumerate(row):
            if on:
                x0 = x + (c + quiet) * cell
                y0 = y + (r + quiet) * cell
                d.rectangle((x0, y0, x0 + cell + 0.5, y0 + cell + 0.5), fill=(17, 24, 39))


def render(slug, sample, title, subtitle, opts):
    img = background()
    d = ImageDraw.Draw(img)

    # Marca
    d.text((72, 92), '✦', font=font('seguisym.ttf', 40), fill=ACCENT, anchor='ls')
    d.text((118, 92), 'FancyText', font=font('segoeuib.ttf', 40), fill=FG, anchor='ls')
    d.text((W - 72, 92), 'fancytext.com.es', font=font('segoeui.ttf', 30), fill=MUTED, anchor='rs')

    if opts.get('qr'):
        qr_size = 330
        draw_qr(img, W - 72 - qr_size, 150, qr_size, slug)
        # Titular ajustado al ancho libre a la izquierda del QR
        lines = wrap(title, font('segoeuib.ttf', 64), W - 72 - qr_size - 72 - 40)
        for i, line in enumerate(lines):
            d.text((72, 250 + i * 74), line, font=font('segoeuib.ttf', 64), fill=FG, anchor='ls')
        base = 250 + len(lines) * 74
        d.text((72, base + 6), subtitle, font=font('segoeui.ttf', 32), fill=MUTED, anchor='ls')
        d.text((72, base + 76), opts.get('tags', ''), font=font('segoeuib.ttf', 34), fill=ACCENT, anchor='ls')
    else:
        # Muestra grande, ajustada al ancho disponible
        size = 132
        while size > 48:
            segs = segments(sample, fallback_fonts(size))
            if text_width(segs) <= W - 144:
                break
            size -= 4
        width = text_width(segs)
        x = (W - width) / 2
        baseline = 330
        draw_fallback(d, x, baseline, segs, ACCENT)
        if opts.get('strike'):
            y = baseline - size * 0.3
            d.line((x - 6, y, x + width + 6, y), fill=ACCENT, width=max(4, size // 18))

        d.text((W / 2, 455), title, font=font('segoeuib.ttf', 54), fill=FG, anchor='ms')
        d.text((W / 2, 510), subtitle, font=font('segoeui.ttf', 32), fill=MUTED, anchor='ms')

    # Pie
    d.line((72, H - 70, W - 72, H - 70), fill=(36, 48, 66), width=2)
    d.text((72, H - 30), 'Gratis · Sin registro · Copiar y pegar', font=font('segoeui.ttf', 26), fill=MUTED, anchor='ls')

    img = img.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    path = os.path.join(OUT, f'{slug}.png')
    img.save(path, optimize=True)
    return path


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for slug, sample, title, subtitle, opts in PAGES:
        p = render(slug, sample, title, subtitle, opts)
        print(f'{os.path.relpath(p, ROOT)}  {os.path.getsize(p) // 1024} KB')
