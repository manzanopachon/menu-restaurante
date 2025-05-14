// app.js

// 1) Leer parámetros de URL
const params = new URLSearchParams(window.location.search);
const restauranteId = params.get('restaurante_id');
const mesaId = params.get('id_mesa');

// 2) Mostrar info arriba
document.getElementById('info').innerText =
  `Restaurante ID: ${restauranteId} | Mesa ID: ${mesaId}`;

// 3) URL base de tu API (ajusta según despliegue)
const API_URL = "http://localhost:8080/api";

// 4) Estructura del carrito en memoria
const carrito = {};

// 5) Función para cargar datos del restaurante (a futuro: menú)
async function cargarRestaurante() {
  if (!restauranteId) {
    alert("Falta el restaurante_id en la URL");
    return;
  }
  try {
    const res = await fetch(`${API_URL}/restaurantes/${id}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    console.log("REST:", data);
    // TODO: pintarCategorías(data);
  } catch (e) {
    console.error("Error al cargar restaurante:", e);
    alert("No hemos podido conectar con el backend");
  }
}

// 6) Arrancar la carga
window.addEventListener('DOMContentLoaded', () => {
  cargarRestaurante();
});
