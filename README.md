# FancyText PWA – Share Target Boilerplate

Este proyecto es una **Progressive Web App (PWA)** que convierte texto en diferentes estilos tipográficos Unicode (negritas, cursivas, monoespaciado, etc.) y permite integrarse con el menú **Compartir** de Android gracias a la API de **Web Share Target**.

---

## ✨ Funcionalidades
- Conversión de texto en tiempo real a distintos estilos Unicode.
- Botones para copiar el texto convertido al portapapeles.
- Botón para volver a compartir (`navigator.share`).
- Compatibilidad **offline** mediante Service Worker.
- Integración con el menú **Compartir** en Android:
  - Compartir texto desde cualquier app → elegir *FancyText* → procesar en `/share`.
- Instalación como PWA (icono en pantalla de inicio, modo standalone).

---

## 📂 Estructura del proyecto
```
/
├─ index.html        # Página principal (conversor manual)
├─ share.html        # Página que recibe texto compartido
├─ app.js            # Lógica de conversión y eventos UI
├─ styles.css        # Estilos básicos
├─ sw.js             # Service Worker con cache y captura de POST
└─ manifest.webmanifest  # Manifest con configuración PWA + share_target
```

---

## 🚀 Instalación y uso

### 1. Clonar y servir en local
```bash
git clone https://github.com/tuusuario/fancytext-pwa.git
cd fancytext-pwa
npx serve .   # o cualquier servidor estático con soporte HTTPS
```

### 2. Abrir en navegador
- Visita `https://localhost:3000` (o la URL de despliegue).
- Chrome mostrará el banner para **Instalar app**.

### 3. Uso desde menú *Compartir*
1. Abre cualquier app (Facebook, WhatsApp, Notas...).
2. Selecciona texto → **Compartir**.
3. Elige *FancyText* en la lista.
4. Se abrirá la PWA en `/share` con el texto listo para convertir.

### 4. Conversión manual
- Abre la app directamente desde el icono.
- Escribe/pega texto en el área de entrada.
- Selecciona estilo → Copiar → Pegar donde quieras.

---

## ⚙️ Tecnologías usadas
- **HTML5, CSS3, JavaScript (ESM)**
- **PWA APIs**: Manifest, Service Worker, Cache API, Clipboard API, Web Share/Share Target
- **BroadcastChannel API**: comunicación entre SW y páginas

---

## 📱 Compatibilidad
- **Android (Chrome, Edge)**: menú Compartir + instalación como app.
- **iOS (Safari)**: conversión funciona, pero *Share Target* no está soportado. Como alternativa: usar **Atajos (Shortcuts)** o una extensión nativa.

---

## ⚠️ Consideraciones
- No convierte `#hashtags` ni `@menciones` para evitar roturas en redes sociales.
- Algunos caracteres Unicode no son visibles en todos los dispositivos.
- Los lectores de pantalla pueden leer de forma extraña ciertos símbolos → incluir siempre alternativa en texto plano.

---

## 🛠️ Roadmap
- [ ] Más estilos (fraktur, script, subíndices, superíndices).
- [ ] Detección automática de compatibilidad de glifos.
- [ ] Soporte de **Share Target Level 2** (archivos).
- [ ] Versión como teclado alternativo en Android/iOS.

---

## 📜 Licencia
Este boilerplate se publica bajo licencia **MIT**. Úsalo libremente en tus proyectos.

_Hecho por GPT-5_