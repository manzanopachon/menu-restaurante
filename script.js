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

  // ✅ Refrescar contadores visibles tras render completo
const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
carrito.forEach(p => {
  const span = document.getElementById(`contador-${p.platoId}`);
  if (span) span.innerText = p.cantidad;
});

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
    }, 300);
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

// ⬇️ LA FUNCIÓN QUE FALTABA: cargarCarrito
async function cargarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const contenedor = document.getElementById("carrito-items");
  const mensaje = document.getElementById("mensaje");
  const { restauranteId, mesaId } = getParams();

  try {
    const res = await fetch(`${API_URL}/restaurantes/${restauranteId}`);
    const restaurante = await res.json();
    document.getElementById("titulo-restaurante").innerText = `${restaurante.nombre} - Mesa ${mesaId}`;
  } catch (e) {
    document.getElementById("titulo-restaurante").innerText = `Mesa ${mesaId}`;
  }

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p>No hay platos en el carrito.</p>";
    document.getElementById("total-items").innerText = "";
    return;
  }

  contenedor.innerHTML = "";
  let totalEuros = 0;

  carrito.forEach(p => {
    totalEuros += p.precio * p.cantidad;

    const div = document.createElement("div");
    div.className = "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded shadow flex justify-between items-center";

    div.innerHTML = `
      <div>
        <h3 class="font-bold">${p.nombre}</h3>
        <span class="text-gray-800 dark:text-gray-300">Cantidad: <span id="contador-${p.platoId}" class="font-semibold">${p.cantidad}</span></span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="modificarCantidad(${p.platoId}, -1)" class="bg-red-600 hover:bg-red-700 hover:scale-110 transform text-white w-8 h-8 rounded-xl transition">-</button>
        <button onclick="modificarCantidad(${p.platoId}, 1, '${p.nombre}', ${p.precio})" class="bg-green-600 hover:bg-green-700 hover:scale-110 transform text-white w-8 h-8 rounded-xl transition">+</button>
      </div>
    `;

    contenedor.appendChild(div);
  });

  const totalPlatos = carrito.reduce((sum, p) => sum + p.cantidad, 0);
  document.getElementById("total-items").innerHTML = `
    <div class="text-right">
      <div>${totalPlatos} plato${totalPlatos !== 1 ? 's' : ''} en el carrito</div>
      <div class="text-lg text-green-700 font-semibold">Total: ${totalEuros.toFixed(2)} €</div>
    </div>
  `;

  const btnPedido = document.getElementById("realizar-pedido");
  const nuevoBtn = btnPedido.cloneNode(true);
  btnPedido.parentNode.replaceChild(nuevoBtn, btnPedido);

  nuevoBtn.addEventListener("click", async () => {
    const carritoActual = JSON.parse(localStorage.getItem("carrito") || "[]");
    const platosIds = [];
    carritoActual.forEach(p => {
      for (let i = 0; i < p.cantidad; i++) platosIds.push(p.platoId);
    });

    const body = {
      numeroMesa: parseInt(mesaId),
      restauranteId: parseInt(restauranteId),
      platos: platosIds
    };

    try {
      const res = await fetch(`${API_URL}/pedidos/crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        localStorage.removeItem("carrito");
        let data;
        try {
          data = await res.json();
        } catch (e) {
          mensaje.innerText = "❌ Error al interpretar la respuesta del servidor.";
          console.error("Error al parsear JSON:", e);
          return;
        }

        // solo continúa si data y codigoPedido existen
        if (!data || !data.codigoPedido) {
          mensaje.innerText = "❌ La respuesta del servidor no es válida.";
          console.error("Respuesta inesperada:", data);
          return;
        }
        const codigo = data.codigoPedido;

       try {
        await navigator.clipboard.writeText(codigo);
      } catch (e) {
        console.warn("No se pudo copiar al portapapeles:", e);
      }
        const copiado = document.getElementById("copiado");
        copiado.classList.remove("opacity-0");
        copiado.classList.add("opacity-100");

        setTimeout(() => {
          copiado.classList.remove("opacity-100");
          copiado.classList.add("opacity-0");
        }, 2000);

        document.getElementById("sound-success").play();

        const modal = document.getElementById("modal");
        modal.innerHTML = `
          <div class="bg-white p-6 rounded shadow text-center max-w-md w-full mx-4">
            <h2 class="text-xl font-bold mb-3 text-green-600">✅ Pedido realizado correctamente</h2>
            <p class="text-gray-800">Tu código de pedido es:</p>
            <p class="text-2xl font-mono text-purple-700 my-3">${codigo}</p>
            <p class="text-sm text-gray-500 mb-4">Se ha copiado automáticamente al portapapeles</p>
            <a href="pedido.html?codigo=${codigo}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition mb-3">Ver Pedido</a>
            <p class="text-gray-500 text-sm">Redirigiendo al menú...</p>
          </div>
        `;
        modal.classList.remove("hidden");

        setTimeout(() => {
          window.location.href = `index.html?restaurante_id=${restauranteId}&mesa_id=${mesaId}`;
        }, 5000);
      } else {
        const error = await res.text();
        mensaje.innerText = `❌ Error al realizar el pedido: ${error}`;
      }
    } catch (e) {
      mensaje.innerText = "❌ Error de conexioooon.";
      console.error("Excepción:", e);
    }
  });
}

// Activar cargarCarrito cuando todo esté cargado y definido
if (window.location.pathname.includes("carrito.html")) {
  document.addEventListener("DOMContentLoaded", cargarCarrito);
}
