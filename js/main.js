/* ============================================================
   main.js · Carga datos.json y rellena la página.
   Lo usan index.html y qr.html: cada función solo actúa si
   encuentra en la página el elemento que necesita.
   ============================================================ */
'use strict';

const RUTA_DATOS = 'datos.json';
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Iconos dibujados para las categorías de la carta (campo "icono" en datos.json)
const ICONOS = {
  tapa:   '<ellipse cx="16" cy="23" rx="12" ry="4"/><path d="M9 21c0-5 14-5 14 0"/><path d="M16 5v13"/><circle cx="16" cy="5" r="1.5"/>',
  racion: '<circle cx="13" cy="18" r="9"/><circle cx="13" cy="18" r="5"/><path d="M22 18h7"/>',
  bebida: '<path d="M9 10h12l-1.6 17h-8.8z"/><path d="M9.4 14h11.2"/><path d="M9.5 10c-.8-3 2.6-4.6 4.4-2.8 1.3-1.8 4.6-1.4 5 .4 1.8-.4 2.6 1.4 1.6 2.4"/>',
  postre: '<path d="M8 24h16l-3-11H11z"/><path d="M11 13c1-3 9-3 10 0"/><path d="M5 27h22"/><path d="M16 9v-3"/>',
  cafe:   '<path d="M6 13h16v6a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z"/><path d="M22 15h2a3 3 0 0 1 0 6h-2.5"/><path d="M11 9c0-2 2-2 2-4M15 9c0-2 2-2 2-4"/>',
  vino:   '<path d="M10 4h12c0 7-2 11-6 11s-6-4-6-11z"/><path d="M16 15v11M11 27h10"/><path d="M10.5 9h11"/>'
};

document.documentElement.classList.add('js');

/* ---------- Utilidades ---------- */

// Crea un elemento con clase y texto (textContent: nunca inyecta HTML)
function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined && texto !== null) el.textContent = texto;
  return el;
}

// Los SVG salen de ICONOS (texto fijo de este fichero), no de datos.json
function crearIcono(nombre) {
  const span = crear('span', 'carta__icono-svg');
  span.innerHTML = `<svg class="icono-trazo" viewBox="0 0 32 32" aria-hidden="true">${ICONOS[nombre] || ICONOS.tapa}</svg>`;
  return span.firstChild;
}

// 3.5 → "3,50 €". Si en datos.json pones un texto ("S/M"), se muestra tal cual.
function formatearPrecio(precio) {
  if (typeof precio === 'number') return precio.toFixed(2).replace('.', ',') + ' €';
  return precio || '';
}

// Las fechas van en datos.json como "AAAA-MM-DD"
function leerFecha(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function hoySinHora() {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
}

function slug(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
}

// Fila de plato: nombre ....... precio + descripción opcional
function crearPlato(plato) {
  const li = crear('li', plato.destacado ? 'plato plato--destacado' : 'plato');
  const fila = crear('div', 'plato__fila');
  const nombre = crear('span', 'plato__nombre');
  if (plato.destacado) {
    const sello = crear('span', 'sello-mini', '★');
    sello.title = 'De la casa';
    nombre.append(sello);
  }
  nombre.append(plato.nombre);
  fila.append(nombre, crear('span', 'plato__puntos'), crear('span', 'plato__precio', formatearPrecio(plato.precio)));
  li.append(fila);
  if (plato.descripcion) li.append(crear('p', 'plato__desc', plato.descripcion));
  return li;
}

function ocultarSeccion(seccion, id) {
  seccion.hidden = true;
  document.querySelectorAll(`a[href="#${id}"]`).forEach(a => { a.hidden = true; });
}

/* ---------- Horario: ¿está abierto ahora? ---------- */

// "8:00 – 16:00 y 20:00 – 1:00" → [{abre: 480, cierra: 960}, {abre: 1200, cierra: 1500}] (minutos)
function leerTramos(texto) {
  const tramos = [];
  const patron = /(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/g;
  let m;
  while ((m = patron.exec(texto || ''))) {
    const abre = +m[1] * 60 + +m[2];
    let cierra = +m[3] * 60 + +m[4];
    if (cierra <= abre) cierra += 24 * 60; // cierra pasada la medianoche
    tramos.push({ abre, cierra });
  }
  return tramos;
}

function hora(minutos) {
  const m = minutos % (24 * 60);
  const h = Math.floor(m / 60);
  return `${h === 1 ? 'la' : 'las'} ${h}:${String(m % 60).padStart(2, '0')}`;
}

function calcularEstado(horario) {
  if (!horario || horario.length !== 7) return null;
  const semana = horario.map(d => leerTramos(d.horas));
  if (!semana.some(t => t.length)) return null;

  const ahora = new Date();
  const hoy = (ahora.getDay() + 6) % 7; // 0 = lunes
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  const ayer = (hoy + 6) % 7;

  const abierto = semana[hoy].find(t => min >= t.abre && min < t.cierra)
    || semana[ayer].map(t => ({ cierra: t.cierra - 1440 })).find(t => min < t.cierra);
  if (abierto) return { abierto: true, texto: `Abierto ahora · hasta ${hora(abierto.cierra)}` };

  for (let salto = 0; salto < 8; salto++) {
    const dia = (hoy + salto) % 7;
    const tramo = semana[dia].find(t => salto > 0 || t.abre > min);
    if (tramo) {
      const cuando = salto === 0 ? 'hoy' : salto === 1 ? 'mañana' : `el ${DIAS[dia]}`;
      return { abierto: false, texto: `Cerrado ahora · abrimos ${cuando} a ${hora(tramo.abre)}` };
    }
  }
  return null;
}

function pintarEstado(horario) {
  const estado = calcularEstado(horario);
  if (!estado) return;
  document.querySelectorAll('[data-estado]').forEach(el => {
    el.classList.add(estado.abierto ? 'estado--abierto' : 'estado--cerrado');
    el.querySelector('[data-estado-texto]').textContent = estado.texto;
  });
}

/* ---------- Secciones ---------- */

function pintarCarta(carta) {
  const contenedor = document.querySelector('[data-carta]');
  if (!contenedor) return;
  const categorias = document.querySelector('[data-carta-categorias]');
  contenedor.replaceChildren();
  if (categorias) categorias.replaceChildren();

  carta.forEach(grupo => {
    const id = 'carta-' + slug(grupo.categoria);
    const bloque = crear('article', 'carta__grupo');
    bloque.id = id;

    const cabeza = crear('header', 'carta__cabeza');
    const icono = crear('span', 'carta__icono');
    icono.append(crearIcono(grupo.icono));
    const titulos = crear('div');
    titulos.append(crear('h3', null, grupo.categoria));
    if (grupo.nota) titulos.append(crear('p', 'carta__nota', grupo.nota));
    cabeza.append(icono, titulos);

    const lista = crear('ul', 'carta__lista');
    grupo.platos.forEach(p => lista.append(crearPlato(p)));
    bloque.append(cabeza, lista);
    contenedor.append(bloque);

    if (categorias) {
      const enlace = crear('a');
      enlace.href = '#' + id;
      enlace.append(crearIcono(grupo.icono), grupo.categoria);
      categorias.append(enlace);
    }
  });

  marcarCategoriaActiva(categorias);
}

// Resalta la categoría que se está leyendo en la barra de categorías
function marcarCategoriaActiva(categorias) {
  if (!categorias || !('IntersectionObserver' in window)) return;
  const enlaces = [...categorias.querySelectorAll('a')];
  const obs = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
      if (!e.isIntersecting) return;
      enlaces.forEach(a => {
        const activa = a.hash === '#' + e.target.id;
        a.classList.toggle('activa', activa);
        if (activa) categorias.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
      });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  document.querySelectorAll('.carta__grupo').forEach(g => obs.observe(g));
}

function pintarPlatosDelDia(datos) {
  const seccion = document.querySelector('[data-del-dia]');
  if (!seccion) return;
  if (!datos || !datos.mostrar || !datos.platos || !datos.platos.length) {
    ocultarSeccion(seccion, 'del-dia');
    return;
  }
  seccion.querySelector('[data-del-dia-titulo]').textContent = datos.titulo || 'Hoy en la pizarra';
  seccion.querySelector('[data-del-dia-fecha]').textContent = datos.fecha
    ? leerFecha(datos.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  seccion.querySelector('[data-del-dia-nota]').textContent = datos.nota || '';
  const lista = seccion.querySelector('[data-del-dia-lista]');
  lista.replaceChildren(...datos.platos.map(crearPlato));
}

// Solo muestra eventos de hoy en adelante. Si no queda ninguno, oculta la sección.
function pintarEventos(eventos) {
  const seccion = document.querySelector('[data-eventos]');
  if (!seccion) return;
  const hoy = hoySinHora();
  const proximos = (eventos || [])
    .filter(e => leerFecha(e.fecha) >= hoy)
    .sort((a, b) => leerFecha(a.fecha) - leerFecha(b.fecha));

  if (!proximos.length) {
    ocultarSeccion(seccion, 'eventos');
    return;
  }

  const lista = seccion.querySelector('[data-eventos-lista]');
  lista.replaceChildren(...proximos.map(e => {
    const fecha = leerFecha(e.fecha);
    const li = crear('li', 'evento revelar');
    const matriz = crear('time', 'evento__fecha');
    matriz.dateTime = e.fecha;
    matriz.append(
      crear('span', 'evento__semana', fecha.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')),
      crear('span', 'evento__dia', fecha.getDate()),
      crear('span', 'evento__mes', fecha.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''))
    );
    const cuerpo = crear('div', 'evento__cuerpo');
    if (e.tipo) cuerpo.append(crear('span', 'evento__tipo', e.tipo));
    cuerpo.append(crear('h3', null, e.titulo));
    if (e.descripcion) cuerpo.append(crear('p', null, e.descripcion));
    li.append(matriz, cuerpo);
    return li;
  }));
}

// Pinta la tabla y resalta el día de hoy
function pintarHorario(horario) {
  const cuerpo = document.querySelector('[data-horario]');
  if (!cuerpo || !horario) return;
  const indiceHoy = (new Date().getDay() + 6) % 7; // 0 = lunes
  cuerpo.replaceChildren(...horario.map((d, i) => {
    const tr = crear('tr');
    if (/cerrado/i.test(d.horas)) tr.classList.add('cerrado');
    if (i === indiceHoy) tr.classList.add('hoy');
    const th = crear('th', null, d.dia);
    th.scope = 'row';
    tr.append(th, crear('td', null, d.horas));
    return tr;
  }));
}

function pintarAviso(aviso) {
  document.querySelectorAll('[data-aviso]').forEach(caja => {
    if (aviso && aviso.mostrar && aviso.texto) {
      caja.querySelector('[data-aviso-texto]').textContent = aviso.texto;
      caja.hidden = false;
    } else {
      caja.hidden = true;
    }
  });
}

// Frases de la casa bajo la portada (datos.json → "cinta")
function pintarCinta(frases) {
  const cinta = document.querySelector('[data-cinta]');
  if (!cinta || !frases || !frases.length) return;
  const pista = cinta.querySelector('[data-cinta-pista]');
  pista.replaceChildren(...frases.flatMap(f => {
    const sep = crear('span', 'cinta__sep', '✦');
    sep.setAttribute('aria-hidden', 'true');
    return [crear('span', null, f), sep];
  }));
  cinta.hidden = false;
}

function pintarDatosSueltos(datos) {
  document.querySelectorAll('[data-dato]').forEach(el => {
    const valor = datos[el.dataset.dato];
    if (valor) el.textContent = valor;
  });
}

function pintarSaludo() {
  const el = document.querySelector('[data-saludo]');
  if (!el) return;
  const h = new Date().getHours();
  el.textContent = h >= 6 && h < 13 ? '¡Buenos días!' : h >= 13 && h < 21 ? '¡Buenas tardes!' : '¡Buenas noches!';
}

/* ---------- Interacción ---------- */

function iniciarCabecera() {
  const cabecera = document.querySelector('.cabecera');
  if (!cabecera) return;
  const actualizar = () => cabecera.classList.toggle('solida', window.scrollY > 40 || Boolean(cabecera.querySelector('.menu.abierto')));
  window.addEventListener('scroll', actualizar, { passive: true });
  actualizar();
  return actualizar;
}

function iniciarMenu(actualizarCabecera) {
  const boton = document.querySelector('.menu-boton');
  const menu = document.getElementById('menu');
  if (!boton || !menu) return;

  const poner = abierto => {
    menu.classList.toggle('abierto', abierto);
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (actualizarCabecera) actualizarCabecera();
  };
  boton.addEventListener('click', () => poner(!menu.classList.contains('abierto')));
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') poner(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') poner(false); });
}

let observador;
function iniciarRevelado() {
  const elementos = document.querySelectorAll('.revelar:not(.visible)');
  if (!('IntersectionObserver' in window)) {
    elementos.forEach(el => el.classList.add('visible'));
    return;
  }
  observador = observador || new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12 });
  elementos.forEach(el => observador.observe(el));
}

/* ---------- Arranque ---------- */

async function iniciar() {
  iniciarMenu(iniciarCabecera());
  pintarSaludo();
  const anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();

  try {
    const respuesta = await fetch(RUTA_DATOS, { cache: 'no-cache' });
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    const datos = await respuesta.json();

    pintarDatosSueltos(datos);
    pintarAviso(datos.aviso);
    pintarCinta(datos.cinta);
    pintarCarta(datos.carta || []);
    pintarPlatosDelDia(datos.platosDelDia);
    pintarEventos(datos.eventos);
    pintarHorario(datos.horario);
    pintarEstado(datos.horario);
  } catch (error) {
    // Pasa si datos.json tiene un error de formato o si abres el HTML con doble clic (file://)
    console.error('No se pudo cargar datos.json:', error);
    document.querySelectorAll('[data-del-dia], [data-eventos]').forEach(s => ocultarSeccion(s, s.id));
    const carta = document.querySelector('[data-carta]');
    if (carta) {
      carta.replaceChildren(crear('p', 'error-datos',
        'No hemos podido cargar la carta. Pregunta en la barra, ¡te la enseñamos encantados!'));
    }
  }

  iniciarRevelado();
}

document.addEventListener('DOMContentLoaded', iniciar);
