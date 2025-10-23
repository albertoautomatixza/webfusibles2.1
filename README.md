# Fusibles Protección — Sitio estático

Este repositorio contiene la versión estática y optimizada del sitio de Fusibles Protección. Todo el proyecto funciona únicamente con HTML, CSS y JavaScript puro, por lo que se puede abrir directamente en cualquier navegador sin depender de Node.js ni herramientas de compilación.

## Estructura del proyecto

```
/index.html
/assets/css/style.css
/assets/js/script.js
robots.txt
sitemap.xml
```

- **index.html**: Página principal lista para GitHub Pages.
- **assets/css/style.css**: Estilos globales minificados y con las fuentes cargadas desde Google Fonts.
- **assets/js/script.js**: Funcionalidades del sitio (menú responsive, scroll suave, nube de marcas, interacciones y helper `window.actualizarProductos`).
- **robots.txt / sitemap.xml**: Archivos de SEO listos para publicación.

> ⚠️ En este workspace las imágenes originales fueron reemplazadas por _placeholders_ SVG embebidos para evitar el bloqueo de binarios. Después de fusionar el PR puedes restaurar los assets reales desde el repositorio remoto.

## Edición de contenidos

1. Abre `index.html` y actualiza los textos o enlaces necesarios.
2. Para cambiar estilos utiliza `assets/css/style.css`. Recuerda mantener la minificación (puedes editar en formato legible y luego volver a comprimir).
3. Si agregas productos dinámicamente, usa `window.actualizarProductos` en la consola del navegador pasando un arreglo de objetos con las llaves `nombre`, `descripcion`, `imagen`, `imagenWebp` y `fichaTecnica`.
4. Cuando trabajes con imágenes reales, guárdalas en `assets/img/` y ajusta los `src` o `data-src` necesarios. Mientras tanto, los placeholders incluidos permiten mantener la vista previa sin dependencias binarias.

## Publicación en GitHub Pages

1. Haz push al branch principal (`main` o `gh-pages`).
2. En la configuración del repositorio habilita GitHub Pages apuntando a la rama y carpeta raíz (`/`).
3. La página quedará disponible en `https://albertoautomatixza.github.io/webfusibles2.1/`.

## Mantenimiento recomendado

- Ejecuta pruebas con Lighthouse para evaluar Core Web Vitals y accesibilidad.
- Mantén actualizada la información de contacto y agrega nuevos productos o marcas según sea necesario.
- Optimiza cualquier imagen nueva generando versiones WebP/JPG antes de restaurarlas en producción.

## Informe SEO y accesibilidad

- Metadatos completos: descripción, palabras clave, etiquetas Open Graph y Twitter Card.
- URLs amigables con `robots.txt` y `sitemap.xml` listos para buscadores.
- Imágenes con `alt` descriptivo, `loading="lazy"` y versiones WebP + fallback.
- Navegación accesible: elementos interactivos con etiquetas ARIA y focus gestionado.
- Recomendaciones: ejecutar Lighthouse periódicamente, revisar contrastes en nuevos contenidos y mantener los enlaces externos con atributos `rel="noopener noreferrer"`.

## Flujo de trabajo con Git LFS y vistas previas en CodeX

El repositorio continúa configurado con Git LFS para manejar imágenes en producción, pero la vista previa de CodeX sustituye temporalmente los binarios por SVG inline.

1. **Inicializa Git LFS** cada vez que abras un workspace nuevo:

   ```bash
   git lfs install
   ```

2. **Mantén el rastreo** de los formatos soportados (ya definido en `.gitattributes`):

   ```bash
   git lfs track "*.png" "*.jpg" "*.jpeg" "*.webp" "*.ico" "*.pdf" "*.svg"
   ```

3. **Durante el desarrollo en CodeX**, conserva los placeholders embebidos para evitar el error “Binary files are not supported”.

4. **Al preparar el lanzamiento definitivo**, restaura los binarios en `assets/img/`, actualiza los `src` y ejecuta:

   ```bash
   git add .gitattributes assets/img/* index.html assets/css/style.css assets/js/script.js
   git commit -m "Restore production assets"
   ```

5. **Crea el PR** normalmente. Una vez fusionado, sustituye los placeholders por las imágenes reales o por URLs hospedadas en GitHub conforme a tus necesidades.
