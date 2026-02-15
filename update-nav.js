/**
 * Script para actualizar la navegación en todos los archivos HTML
 * Ejecutar con: node update-nav.js
 */

const fs = require('fs');
const path = require('path');

// Leer el componente de navegación
const navComponent = fs.readFileSync('./nav-component.html', 'utf8');

// Extraer solo la parte del nav (sin el script de Alpine.js)
const navHTML = navComponent.split('<!-- Navegación mejorada con Alpine.js -->')[1].trim();
const alpineScript = '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>';

// Archivos a actualizar
const htmlFiles = [
  './letras-bonitas-whatsapp/index.html',
  './cursiva-instagram/index.html',
  './letras-aesthetic/index.html',
  './fuentes-tiktok/index.html',
  './separadores-instagram/index.html',
  './simbolos-aesthetic/index.html',
  './letras-goticas/index.html',
  './texto-tachado/index.html',
  './letras-circulo/index.html',
  './contador-caracteres/index.html',
  './letras-cuadrado/index.html',
  './espacio-invisible/index.html',
  './invertir-texto/index.html',
  './generador-qr/index.html'
];

// Función para actualizar un archivo
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Añadir Alpine.js si no existe
    if (!content.includes('alpinejs')) {
      content = content.replace(
        '</head>',
        `\n  <!-- Alpine.js -->\n  ${alpineScript}\n</head>`
      );
    }

    // 2. Reemplazar la navegación antigua con la nueva
    const navRegex = /<nav class="main-nav">[\s\S]*?<\/nav>/;
    if (navRegex.test(content)) {
      content = content.replace(navRegex, navHTML);

      // Guardar el archivo actualizado
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Actualizado: ${filePath}`);
    } else {
      console.log(`⚠️  No se encontró nav en: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
  }
}

// Actualizar todos los archivos
console.log('🚀 Iniciando actualización de navegación...\n');
htmlFiles.forEach(updateFile);
console.log('\n✨ Actualización completada!');
