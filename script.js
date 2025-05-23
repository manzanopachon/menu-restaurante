const API_URL = "https://stockwise.fly.dev/api";

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("/") || window.location.pathname.endsWith("index.html")) {
    const contenedor = document.getElementById("platos-container");
    if (contenedor) contenedor.innerHTML = "";

    cargarPlatos();
    actualizarContador();
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "carrito") {
      actualizarContador();
    }
  });

  if (window.location.pathname.includes("carrito.html")) cargarCarrito();
});

function getParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    restauranteId: urlParams.get("restaurante_id"),
    mesaId: urlParams.get("mesa_id"),
  };
}

async function cargarPlatos() {
  const { restauranteId, mesaId } = getParams();
  document.getElementById("ver-carrito").href = `carrito.html?restaurante_id=${restauranteId}&mesa_id=${mesaId}`;

  const res = await fetch(`${API_URL}/platos/restaurante/${restauranteId}`);
  const platos = await res.json();

  const categorias = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
  };

  const nombresCategorias = {
    1: "Entrantes",
    2: "Pizzas",
    3: "Pastas",
    4: "Carnes",
    5: "Pescados",
    6: "Postres",
    7: "Bebidas"
  };

  platos.forEach(plato => {
    const idCat = plato.categoria?.id;
    if (categorias[idCat]) categorias[idCat].push(plato);
  });

  document.getElementById("loader")?.classList.add("hidden");

  const contenedor = document.getElementById("platos-container");
  Object.keys(categorias).forEach(id => {
    const categoria = nombresCategorias[id];
    const platosCat = categorias[id];
    if (!platosCat.length) return;

    const section = document.createElement("div");
    section.classList.add("mb-6");

    const header = document.createElement("button");
    header.className = "text-2xl font-semibold text-pink-600 mb-3 border-b pb-1 w-full text-left hover:text-pink-500 transition";
    header.textContent = categoria;

    const content = document.createElement("div");
    content.className = "space-y-4 mt-2 hidden";

    platosCat.forEach(plato => {
      const card = document.createElement("div");
      card.className = "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-lg shadow-lg border-l-4 border-blue-400 hover:shadow-xl transition-all duration-200";

      card.innerHTML = `
        <div>
          <h3 class="font-bold">${plato.nombre}</h3>
          <p class="text-sm">${plato.descripcion}</p>
          <span class="text-blue-600 font-semibold">${plato.precio} €</span>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="modificarCantidad(${plato.id}, -1)" class="bg-red-600 hover:bg-red-700 hover:scale-110 transform text-white w-8 h-8 rounded-xl transition">-</button>
          <span id="contador-${plato.id}" class="w-6 text-center font-bold transition duration-200"></span>
          <button onclick="modificarCantidad(${plato.id}, 1, '${plato.nombre}', ${plato.precio})" class="bg-green-600 hover:bg-green-700 hover:scale-110 transform text-white w-8 h-8 rounded-xl transition">+</button>
        </div>
      `;

      content.appendChild(card);

      // Actualiza visualmente el contador al cargar
      const contador = card.querySelector(`#contador-${plato.id}`);
      if (contador) {
        contador.innerText = getCantidadCarrito(plato.id);
      }
    });

    header.addEventListener("click", () => {
      content.classList.toggle("hidden");
    });

    section.appendChild(header);
    section.appendChild(content);
    contenedor.appendChild(section);
  });

  actualizarContador();
}

function getCantidadCarrito(platoId) {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const item = carrito.find(p => p.platoId === platoId);
  return item ? item.cantidad : 0;
}

function modificarCantidad(platoId, cambio, nombre = '', precio = 0) {
  let carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const index = carrito.findIndex(p => p.platoId === platoId);

  if (index !== -1) {
    carrito[index].cantidad = Math.max(0, carrito[index].cantidad + cambio);
    if (carrito[index].cantidad === 0) carrito.splice(index, 1);
  } else if (cambio > 0) {
    carrito.push({ platoId, nombre, cantidad: 1, precio });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));

  const contador = document.getElementById(`contador-${platoId}`);
  if (contador) {
    contador.innerText = getCantidadCarrito(platoId);
    contador.classList.add("bg-yellow-300", "text-black", "rounded", "px-1");
    setTimeout(() => {
      contador.classList.remove("bg-yellow-300", "text-black", "rounded", "px-1");
    }, 400);
  }

  actualizarContador();

  if (window.location.pathname.includes("carrito.html")) {
    cargarCarrito();
  }
}

function actualizarContador() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const total = carrito.reduce((sum, p) => sum + p.cantidad, 0);
  const contador = document.getElementById("total-items");
  if (contador) contador.innerText = `${total} plato${total !== 1 ? 's' : ''} en el carrito`;
}
