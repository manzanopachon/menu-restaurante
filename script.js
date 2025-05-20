const API_URL = "https://stockwise.fly.dev/api";

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("/") || window.location.pathname.endsWith("index.html")) cargarPlatos();
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

  const categorias = {};
  platos.forEach((plato) => {
    const cat = plato.categoria?.nombre || "Otros";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(plato);
  });

  const ordenDeseado = ['Entrantes', 'Pasta', 'Pizzas', 'Carnes', 'Pescado', 'Postres', 'Bebidas'];

  const contenedor = document.getElementById("platos-container");
  ordenDeseado.forEach(categoria => {
    if (!categorias[categoria]) return;
    const section = document.createElement("div");
    section.classList.add("mb-6");
    section.innerHTML = `<h2 class="text-2xl font-semibold text-pink-600 mb-3 border-b pb-1">${categoria}</h2>`;

    categorias[categoria].forEach(plato => {
      const cantidad = getCantidadCarrito(plato.id);
      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded-lg shadow-lg border-l-4 border-blue-400 hover:shadow-xl transition-all duration-200 mb-4";
      card.innerHTML = `
        <div>
          <h3 class="font-bold">${plato.nombre}</h3>
          <p class="text-sm">${plato.descripcion}</p>
          <span class="text-blue-600 font-semibold">${plato.precio} €</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="modificarCantidad(${plato.id}, -1)" class="bg-red-600 hover:bg-red-700 hover:scale-110 transform text-white w-8 h-8 rounded-xl transition">-</button>
          <span id="contador-${plato.id}" class="w-6 text-center">${cantidad}</span>
          <button onclick="modificarCantidad(${plato.id}, 1, '${plato.nombre}', ${plato.precio})" class="bg-green-600 hover:bg-green-700 hover:scale-110 transform text-white w-8 h-8 rounded-xl transition">+</button>
        </div>
      `;
      section.appendChild(card);
    });

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
  if (contador) contador.innerText = getCantidadCarrito(platoId);

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
    div.className = "bg-white p-4 rounded shadow flex justify-between items-center";

    div.innerHTML = `
      <div>
        <h3 class="font-bold">${p.nombre}</h3>
        <span class="text-gray-700">Cantidad: <span id="contador-${p.platoId}" class="font-semibold">${p.cantidad}</span></span>
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

  document.getElementById("realizar-pedido").addEventListener("click", async () => {
    const platosIds = [];
    carrito.forEach(p => {
      for (let i = 0; i < p.cantidad; i++) platosIds.push(p.platoId);
    });

    const body = {
      numeroMesa: parseInt(mesaId),
      restauranteId: parseInt(restauranteId),
      platos: platosIds,
    };

    try {
      const res = await fetch(`${API_URL}/pedidos/crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        localStorage.removeItem("carrito");
        const data = await res.json();
        const codigo = data.codigoPedido;

        // Copiar automáticamente el código al portapapeles
        try {
          await navigator.clipboard.writeText(codigo);
          console.log("Código copiado al portapapeles:", codigo);
        } catch (err) {
          console.warn("No se pudo copiar al portapapeles:", err);
        }

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
      mensaje.innerText = "❌ Error de conexión.";
      console.error("Excepción:", e);
    }
  });
}
