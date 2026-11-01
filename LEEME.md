# Web del bar · plantilla

```
index.html        la web completa (una sola página)
qr.html           solo la carta, para el QR de mesas y barra
imprimir-qr.html  genera los QR (carta y reseñas) para imprimir; no se enlaza desde la web
datos.json        carta, platos del día, eventos, horario y avisos  ← lo que se edita a menudo
css/estilos.css   colores y fuentes en las variables de :root
js/main.js        lee datos.json y pinta la página
img/              fotos (ahora son SVG de relleno)
```

## Cambiar los datos

- **Nombre, dirección, teléfono, redes**: busca y reemplaza los placeholders (`[NOMBRE DEL BAR]`, `600000000`, `34600000000`, etc.) en `index.html` y `qr.html`. La lista completa está en el comentario del principio de `index.html`.
- **Carta, platos del día, eventos, horario, aviso**: solo `datos.json`.
  - Precios como número con punto: `3.5` → se ve "3,50 €".
  - Fechas como `"2026-11-08"`. Los eventos pasados desaparecen solos; si no queda ninguno, la sección se oculta.
  - Para quitar el aviso o los platos del día: `"mostrar": false`.
  - `"destacado": true` en un plato le pone la estrella de "de la casa".
  - `"icono"` de cada categoría: `tapa`, `racion`, `bebida`, `postre`, `cafe` o `vino`.
  - `"cinta"`: las frases que se deslizan bajo la portada.
  - El cartel "Abierto ahora / Cerrado" se calcula solo con `"horario"` (formato `8:00 – 23:00`; vale también `8:00 – 16:00 y 20:00 – 1:00`). Si un día hay cierre especial, ponlo en el aviso.
  - Ojo con las comas y comillas: si el JSON está mal, la carta no carga. Compruébalo en jsonlint.com.
- **Fotos**: guárdalas en `img/` (JPG, ~800 px de ancho la galería, ~1600 px la portada) y cambia el `src` y el `alt` en `index.html`.

## Probar en local

`fetch()` no funciona abriendo el HTML con doble clic. Usa la extensión **Live Server** de VS Code o, en esta carpeta:

```
python -m http.server 8000
```

y abre http://localhost:8000

## Subirla gratis

**Netlify (lo más fácil):** entra en app.netlify.com/drop y arrastra la carpeta `web-bar`. Te da una URL con HTTPS al momento. Para actualizar, vuelve a arrastrarla.

**Cloudflare Pages / GitHub Pages:** sube la carpeta a un repositorio de GitHub y conéctalo; cada `git push` publica los cambios.

**Dominio:** cómpralo a nombre del bar y en el panel de Netlify/Cloudflare ve a *Domains → Add custom domain*; te dice qué DNS poner.
