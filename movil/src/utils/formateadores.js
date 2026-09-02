// movil/src/utils/formateadores.js
// Helpers de presentación (FASE B/C): fechas legibles DD/MM/YYYY, números,
// peso/altura, grupos musculares y nombres de comidas por horario.

// Convierte 'YYYY-MM-DD' o ISO ('2024-07-01T...') a 'DD/MM/YYYY' sin caer en
// el desfase de zona horaria (los datos del backend vienen como fecha plana).
export const formatearFechaLegible = (fecha) => {
  if (fecha == null || fecha === '') return '-';
  const str = String(fecha);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/');
};

export const formatearNumero = (valor, decimales = 0) => {
  const n = Number(valor);
  if (Number.isNaN(n)) return '-';
  return n.toFixed(decimales);
};

export const capitalizar = (texto) =>
  String(texto || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

export const formatearPeso = (peso) =>
  peso != null && !Number.isNaN(Number(peso)) ? `${Number(peso)} kg` : '-';

export const formatearAltura = (altura) =>
  altura != null && !Number.isNaN(Number(altura)) ? `${Number(altura)} cm` : '-';

// Mismo cálculo Atwater/IMC que el backend (peso / (talla/100)^2).
export const calcularIMC = (peso, altura) => {
  const p = Number(peso);
  const a = Number(altura);
  if (!p || !a || p <= 0 || a <= 0) return null;
  return Math.round((p / Math.pow(a / 100, 2)) * 100) / 100;
};

const COMIDAS = { 1: 'Desayuno', 2: 'Almuerzo', 3: 'Cena', 4: 'Snack' };

export const nombreComida = (num) => {
  const n = Number(num);
  return COMIDAS[n] || `Comida ${num}`;
};